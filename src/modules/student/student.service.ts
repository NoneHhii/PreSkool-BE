import prisma from "../../config/prisma";
import { StudentStatus } from "@prisma/client";

export const getStudents = async (query: any) => {
    const { search, cohort, majorId, homeroomClassId, status, gender, page = 1, limit = 20 } = query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};

    if (cohort) where.cohort = cohort;
    if (majorId) where.majorId = majorId;
    if (homeroomClassId) where.homeroomClassId = homeroomClassId;
    if (status) where.status = status;

    if (search) {
        where.OR = [
            { studentCode: { contains: search, mode: "insensitive" } },
            { user: { profile: { fullName: { contains: search, mode: "insensitive" } } } },
            { user: { profile: { identityCard: { contains: search } } } },
            { user: { profile: { phone: { contains: search } } } }
        ];
    }

    if (gender) {
        where.user = {
            ...where.user,
            profile: {
                ...where.user?.profile,
                gender: gender
            }
        };
    }

    const students = await prisma.student.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
            user: {
                select: {
                    email: true,
                    status: true,
                    profile: true
                }
            },
            major: true,
            homeroomClass: true
        }
    });

    const total = await prisma.student.count({ where });

    return { students, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
};

export const getStudentById = async (id: string) => {
    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    email: true,
                    status: true,
                    profile: true
                }
            },
            major: true,
            homeroomClass: true,
            statusLogs: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!student) throw new Error("Student not found");
    return student;
};

export const updateStudentProfile = async (id: string, data: any) => {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new Error("Student not found");

    const profile = await prisma.userProfile.update({
        where: { userId: student.userId },
        data
    });

    return profile;
};

export const updateStudentStatus = async (id: string, data: { newStatus: StudentStatus, decisionNumber?: string, effectiveDate: string, attachmentUrl?: string, note?: string }) => {
    const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
    if (!student) throw new Error("Student not found");

    return await prisma.$transaction(async (tx) => {
        // 1. Create Log
        const log = await tx.studentStatusLog.create({
            data: {
                studentId: id,
                oldStatus: student.status,
                newStatus: data.newStatus,
                decisionNumber: data.decisionNumber,
                effectiveDate: new Date(data.effectiveDate),
                attachmentUrl: data.attachmentUrl,
                note: data.note
            }
        });

        // 2. Update Student status
        await tx.student.update({
            where: { id },
            data: { status: data.newStatus }
        });

        // 3. Lock or Unlock User account based on status
        let userStatus: "ACTIVE" | "INACTIVE" = "ACTIVE";
        if (["SUSPENDED", "DROPPED", "GRADUATED", "DISCIPLINED"].includes(data.newStatus)) {
            userStatus = "INACTIVE";
        }

        if (student.user.status !== userStatus) {
            await tx.user.update({
                where: { id: student.userId },
                data: { status: userStatus }
            });
        }

        return log;
    });
};
