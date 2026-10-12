import prisma from "../../config/prisma";

export const createRegistrationPeriod = async (data: any) => {
    return prisma.registrationPeriod.create({ data });
};

export const getRegistrationPeriods = async () => {
    return prisma.registrationPeriod.findMany({
        orderBy: { startTime: 'desc' }
    });
};

export const getActiveRegistrationPeriod = async () => {
    const now = new Date();
    return prisma.registrationPeriod.findFirst({
        where: {
            startTime: { lte: now },
            endTime: { gte: now }
        }
    });
};

export const autoEnrollBatch = async (homeroomClassId: string, classIds: string[]) => {
    // Get all students in the homeroom class
    const students = await prisma.student.findMany({
        where: { homeroomClassId, status: "ACTIVE" }
    });

    if (students.length === 0) throw new Error("No active students found in this homeroom class");

    // Get the classes to check capacity (we might ignore capacity for batch enrollment, or just forcefully enroll them)
    // For batch auto-enrollment, usually we bypass capacity constraints because it's administrative.

    const results: {studentId: string, classId: string}[] = [];
    
    // Using transaction for batch
    await prisma.$transaction(async (tx) => {
        for (const classId of classIds) {
            for (const student of students) {
                // Check if already enrolled
                const existing = await tx.classStudent.findUnique({
                    where: {
                        classId_studentId: { classId, studentId: student.id }
                    }
                });

                if (!existing) {
                    await tx.classStudent.create({
                        data: {
                            classId,
                            studentId: student.id,
                            registrationStatus: "ENROLLED",
                            isManualOverride: true
                        }
                    });
                    results.push({ studentId: student.id, classId });
                }
            }
        }
    });

    return { enrolledCount: results.length, details: results };
};

export const enrollStudent = async (studentId: string, classId: string, isOverride: boolean = false) => {
    return prisma.$transaction(async (tx) => {
        // 1. Check if class exists and get course details
        const targetClass = await tx.class.findUnique({
            where: { id: classId },
            include: { course: true, schedules: true, _count: { select: { students: { where: { registrationStatus: "ENROLLED" } } } } }
        });
        if (!targetClass) throw new Error("Class not found");
        if (targetClass.status === "CLOSED" || targetClass.status === "CANCELLED") {
            if (!isOverride) throw new Error("This class is closed or cancelled");
        }

        // 2. Constraints if NOT override
        if (!isOverride) {
            // Check active registration period
            const period = await getActiveRegistrationPeriod();
            if (!period) throw new Error("No active registration period");

            // Check capacity
            if (targetClass._count.students >= targetClass.maxCapacity) {
                throw new Error("Class is already full");
            }

            // Check if student has already registered for another class of the SAME course this semester
            const existingCourseClass = await tx.classStudent.findFirst({
                where: {
                    studentId,
                    registrationStatus: "ENROLLED",
                    class: {
                        courseId: targetClass.courseId,
                        academicYear: targetClass.academicYear,
                        semester: targetClass.semester
                    }
                }
            });
            if (existingCourseClass) throw new Error("Already enrolled in another class for this course");

            // Schedule conflict check (Advanced logic)
            // Fetch all current enrolled schedules
            const currentEnrolled = await tx.classStudent.findMany({
                where: { studentId, registrationStatus: "ENROLLED", class: { academicYear: targetClass.academicYear, semester: targetClass.semester } },
                include: { class: { include: { schedules: true } } }
            });

            for (const enrolled of currentEnrolled) {
                for (const existingSchedule of enrolled.class.schedules) {
                    for (const newSchedule of targetClass.schedules) {
                        // Very basic conflict check: same Date and same Shift
                        // Note: Prisma stores DateTime. Need to compare dates properly.
                        if (existingSchedule.date.getTime() === newSchedule.date.getTime() && existingSchedule.shift === newSchedule.shift) {
                            throw new Error(`Schedule conflict with class ${enrolled.class.code}`);
                        }
                    }
                }
            }
        }

        // 3. Upsert enrollment (in case they withdrew before and are re-enrolling)
        const enrolled = await tx.classStudent.upsert({
            where: {
                classId_studentId: { classId, studentId }
            },
            update: {
                registrationStatus: "ENROLLED",
                isManualOverride: isOverride
            },
            create: {
                classId,
                studentId,
                registrationStatus: "ENROLLED",
                isManualOverride: isOverride
            }
        });

        return enrolled;
    });
};

export const unenrollStudent = async (studentId: string, classId: string, isOverride: boolean = false) => {
    // If not override, check period
    if (!isOverride) {
        const period = await getActiveRegistrationPeriod();
        if (!period) throw new Error("No active registration period");
    }

    const enrollment = await prisma.classStudent.findUnique({
        where: { classId_studentId: { classId, studentId } }
    });

    if (!enrollment || enrollment.registrationStatus !== "ENROLLED") {
        throw new Error("Student is not enrolled in this class");
    }

    return prisma.classStudent.update({
        where: { id: enrollment.id },
        data: { registrationStatus: "WITHDRAWN" }
    });
};
