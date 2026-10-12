import prisma from "../../config/prisma";
import { AttendanceStatus } from "@prisma/client";

export const getMySchedule = async (teacherId: string, startDate?: string, endDate?: string) => {
    const where: any = { class: { teacherId } };
    
    if (startDate && endDate) {
        where.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    return prisma.schedule.findMany({
        where,
        include: { class: { include: { course: true } } },
        orderBy: { date: 'asc' }
    });
};

export const getAssignedClasses = async (teacherId: string) => {
    return prisma.class.findMany({
        where: { teacherId },
        include: { course: true, _count: { select: { students: true } } }
    });
};

export const getClassRoster = async (classId: string) => {
    return prisma.classStudent.findMany({
        where: { classId, registrationStatus: "ENROLLED" },
        include: { student: { include: { user: { include: { profile: true } }, homeroomClass: true } } }
    });
};

export const createRescheduleRequest = async (teacherId: string, data: any) => {
    const schedule = await prisma.schedule.findUnique({ where: { id: data.scheduleId }, include: { class: true } });
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.class.teacherId !== teacherId) throw new Error("You are not the teacher of this class");

    return prisma.rescheduleRequest.create({
        data: {
            teacherId,
            scheduleId: data.scheduleId,
            newDate: data.newDate ? new Date(data.newDate) : null,
            newShift: data.newShift,
            newRoom: data.newRoom,
            reason: data.reason,
            status: "PENDING"
        }
    });
};

export const rollCall = async (scheduleId: string, attendances: { studentId: string, status: AttendanceStatus, notes?: string }[]) => {
    return prisma.$transaction(async (tx) => {
        const results = [];
        for (const att of attendances) {
            const recorded = await tx.attendance.upsert({
                where: { scheduleId_studentId: { scheduleId, studentId: att.studentId } },
                update: { status: att.status, notes: att.notes },
                create: {
                    scheduleId,
                    studentId: att.studentId,
                    status: att.status,
                    notes: att.notes
                }
            });
            results.push(recorded);
        }
        return results;
    });
};

export const saveTeachingLog = async (scheduleId: string, content: string, remarks?: string) => {
    return prisma.teachingLog.upsert({
        where: { scheduleId },
        update: { content, remarks },
        create: { scheduleId, content, remarks }
    });
};

export const getStudentAbsenceStats = async (classId: string) => {
    // Total schedules in this class
    const totalSchedules = await prisma.schedule.count({ where: { classId } });
    if (totalSchedules === 0) return [];

    // Get all absent attendances
    const absences = await prisma.attendance.groupBy({
        by: ['studentId'],
        where: { schedule: { classId }, status: { in: ["ABSENT", "EXCUSED"] } },
        _count: { status: true }
    });

    return absences.map(abs => {
        const percentage = (abs._count.status / totalSchedules) * 100;
        return {
            studentId: abs.studentId,
            totalAbsences: abs._count.status,
            percentage,
            isBanned: percentage >= 20 // Cấm thi nếu vắng >= 20%
        };
    });
};
