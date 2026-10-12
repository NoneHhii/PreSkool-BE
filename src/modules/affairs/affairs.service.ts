import prisma from "../../config/prisma";

export const gradeTrainingPoint = async (
    studentId: string, 
    academicYear: string, 
    semester: number, 
    score: number, 
    level: "SELF" | "CLASS" | "ADVISOR" | "FINAL"
) => {
    let updateData: any = {};
    let status = "";

    switch (level) {
        case "SELF":
            updateData.selfScore = score;
            status = "CLASS_GRADING";
            break;
        case "CLASS":
            updateData.classScore = score;
            status = "ADVISOR_GRADING";
            break;
        case "ADVISOR":
            updateData.advisorScore = score;
            status = "APPROVED"; // Or FACULTY_GRADING
            updateData.finalScore = score;
            break;
        case "FINAL":
            updateData.finalScore = score;
            status = "APPROVED";
            break;
    }

    if (updateData.finalScore !== undefined) {
        if (updateData.finalScore >= 90) updateData.classification = "Xuất sắc";
        else if (updateData.finalScore >= 80) updateData.classification = "Tốt";
        else if (updateData.finalScore >= 65) updateData.classification = "Khá";
        else if (updateData.finalScore >= 50) updateData.classification = "Trung bình";
        else if (updateData.finalScore >= 35) updateData.classification = "Yếu";
        else updateData.classification = "Kém";
    }

    updateData.status = status;

    return prisma.trainingPoint.upsert({
        where: { studentId_academicYear_semester: { studentId, academicYear, semester } },
        update: updateData,
        create: {
            studentId,
            academicYear,
            semester,
            ...updateData
        }
    });
};

export const getTrainingPoints = async (studentId: string) => {
    return prisma.trainingPoint.findMany({ where: { studentId }, orderBy: [{ academicYear: 'desc' }, { semester: 'desc' }] });
};

export const createStudentRequest = async (data: { studentId: string, requestType: any, note?: string }) => {
    return prisma.studentRequest.create({
        data: {
            ...data,
            status: "PENDING"
        }
    });
};

export const getStudentRequests = async (studentId: string) => {
    return prisma.studentRequest.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' }
    });
};

export const getAllStudentRequests = async (status?: any) => {
    const where = status ? { status } : {};
    return prisma.studentRequest.findMany({
        where,
        include: { student: { include: { user: { include: { profile: true } } } } },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateStudentRequest = async (requestId: string, data: { status: any, resultAttachmentUrl?: string }) => {
    return prisma.studentRequest.update({
        where: { id: requestId },
        data
    });
};
