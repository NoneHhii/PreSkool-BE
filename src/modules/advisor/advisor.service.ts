import prisma from "../../config/prisma";
import { RequestStatus } from "@prisma/client";

export const getAdvisedClasses = async (advisorId: string) => {
    return prisma.homeroomClass.findMany({
        where: { advisorId },
        include: { _count: { select: { students: true } } }
    });
};

export const getHomeroomStudentsStats = async (homeroomClassId: string, advisorId: string) => {
    const homeroom = await prisma.homeroomClass.findUnique({ where: { id: homeroomClassId } });
    if (!homeroom || homeroom.advisorId !== advisorId) throw new Error("Unauthorized or Homeroom not found");

    const students = await prisma.student.findMany({
        where: { homeroomClassId },
        include: { user: { include: { profile: true } }, grades: true }
    });

    return students.map(student => {
        const totalCredits = student.grades.length * 3; // Mock 3 credits per class for simplicity
        const totalScore = student.grades.reduce((acc, grade) => acc + (grade.totalScore || 0), 0);
        const gpa = student.grades.length > 0 ? (totalScore / student.grades.length) : 0;
        
        return {
            studentId: student.id,
            studentCode: student.studentCode,
            fullName: student.user.profile?.fullName,
            gpa: parseFloat(gpa.toFixed(2)),
            totalCredits,
            needsWarning: gpa < 5.0
        };
    });
};

export const reviewTrainingPoint = async (advisorId: string, trainingPointId: string, advisorScore: number) => {
    const point = await prisma.trainingPoint.findUnique({
        where: { id: trainingPointId },
        include: { student: { include: { homeroomClass: true } } }
    });

    if (!point || point.student.homeroomClass?.advisorId !== advisorId) {
        throw new Error("Unauthorized to review this training point");
    }

    return prisma.trainingPoint.update({
        where: { id: trainingPointId },
        data: {
            advisorScore,
            finalScore: advisorScore, // In a real flow, this might go to Faculty or University Admin next
            status: "ADVISOR_APPROVED"
        }
    });
};

export const reviewStudentRequest = async (advisorId: string, requestId: string, status: RequestStatus, note?: string) => {
    const request = await prisma.studentRequest.findUnique({
        where: { id: requestId },
        include: { student: { include: { homeroomClass: true } } }
    });

    if (!request || request.student.homeroomClass?.advisorId !== advisorId) {
        throw new Error("Unauthorized to review this request");
    }

    return prisma.studentRequest.update({
        where: { id: requestId },
        data: {
            status,
            note: note || request.note
        }
    });
};
