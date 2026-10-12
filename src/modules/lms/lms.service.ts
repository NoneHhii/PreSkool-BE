import prisma from "../../config/prisma";

export const createModule = async (data: any) => {
    return prisma.lMSModule.create({ data });
};

export const getModulesByClass = async (classId: string) => {
    return prisma.lMSModule.findMany({
        where: { classId },
        include: { materials: true },
        orderBy: { order: 'asc' }
    });
};

export const addMaterialToModule = async (moduleId: string, data: any) => {
    return prisma.lMSMaterial.create({
        data: {
            moduleId,
            ...data
        }
    });
};

export const createAssignment = async (data: any) => {
    return prisma.assignment.create({ data });
};

export const getAssignmentsByClass = async (classId: string) => {
    return prisma.assignment.findMany({
        where: { classId },
        include: { _count: { select: { submissions: true } } },
        orderBy: { deadline: 'asc' }
    });
};

export const submitAssignment = async (assignmentId: string, studentId: string, data: any) => {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new Error("Assignment not found");

    if (!assignment.allowLate && new Date() > assignment.deadline) {
        throw new Error("Deadline has passed and late submissions are not allowed");
    }

    return prisma.assignmentSubmission.create({
        data: {
            assignmentId,
            studentId,
            ...data
        }
    });
};

export const gradeAssignmentSubmission = async (submissionId: string, data: any) => {
    return prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data
    });
};
