import prisma from "../../config/prisma";

export const createExam = async (data: any) => {
    return prisma.exam.create({ data });
};

export const assignRoomsAndStudents = async (examId: string, rooms: { roomName: string, capacity: number }[]) => {
    // 1. Get Exam and Class students
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { class: { include: { students: { include: { student: true } } } } } });
    if (!exam) throw new Error("Exam not found");

    const students = exam.class.students.filter(cs => cs.registrationStatus === "ENROLLED");
    
    // Check total capacity
    const totalCap = rooms.reduce((acc, r) => acc + r.capacity, 0);
    if (totalCap < students.length) throw new Error("Not enough capacity in rooms for all students");

    // 2. Create Rooms and Assign Students with SBD
    return prisma.$transaction(async (tx) => {
        let studentIndex = 0;

        for (const roomData of rooms) {
            const room = await tx.examRoom.create({
                data: {
                    examId,
                    roomName: roomData.roomName,
                    capacity: roomData.capacity
                }
            });

            // Assign students to this room up to capacity
            let sbdCounter = 1;
            while (sbdCounter <= roomData.capacity && studentIndex < students.length) {
                const classStudent = students[studentIndex];
                
                // Extremely basic eligibility check: Could check attendance here.
                const isEligible = true;

                await tx.examStudent.create({
                    data: {
                        examRoomId: room.id,
                        studentId: classStudent.studentId,
                        sbd: sbdCounter.toString().padStart(3, '0'),
                        isEligible: isEligible,
                        ineligibilityReason: isEligible ? null : "Vắng quá số buổi"
                    }
                });

                sbdCounter++;
                studentIndex++;
            }
        }
        
        return { message: "Rooms assigned and SBD generated successfully" };
    });
};

export const enterGrades = async (classId: string, studentId: string, data: any) => {
    const classRecord = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRecord) throw new Error("Class not found");

    // Determine letter grade and total if all are provided (Basic 10-point scale formula)
    let totalScore = null;
    let letterGrade = null;

    // This is a simplistic calculation, usually requires specific weights per course.
    if (data.processScore !== undefined && data.midtermScore !== undefined && data.finalScore !== undefined) {
        totalScore = (data.processScore * 0.2) + (data.midtermScore * 0.3) + (data.finalScore * 0.5);
        if (totalScore >= 8.5) letterGrade = "A";
        else if (totalScore >= 7.0) letterGrade = "B";
        else if (totalScore >= 5.5) letterGrade = "C";
        else if (totalScore >= 4.0) letterGrade = "D";
        else letterGrade = "F";
    }

    return prisma.grade.upsert({
        where: { classId_studentId: { classId, studentId } },
        update: {
            ...data,
            totalScore: totalScore !== null ? totalScore : undefined,
            letterGrade: letterGrade !== null ? letterGrade : undefined
        },
        create: {
            classId,
            studentId,
            ...data,
            totalScore,
            letterGrade
        }
    });
};

export const adminEditGrades = async (classId: string, studentId: string, data: any, adminUserId: string) => {
    return prisma.$transaction(async (tx) => {
        const existingGrade = await tx.grade.findUnique({
            where: { classId_studentId: { classId, studentId } }
        });

        if (!existingGrade) throw new Error("Grade record not found. Cannot edit non-existent grade.");

        // Calculate new totals
        let newTotalScore = existingGrade.totalScore;
        let newLetterGrade = existingGrade.letterGrade;

        const processScore = data.processScore ?? existingGrade.processScore;
        const midtermScore = data.midtermScore ?? existingGrade.midtermScore;
        const finalScore = data.finalScore ?? existingGrade.finalScore;

        if (processScore !== null && midtermScore !== null && finalScore !== null) {
            newTotalScore = (processScore * 0.2) + (midtermScore * 0.3) + (finalScore * 0.5);
            if (newTotalScore >= 8.5) newLetterGrade = "A";
            else if (newTotalScore >= 7.0) newLetterGrade = "B";
            else if (newTotalScore >= 5.5) newLetterGrade = "C";
            else if (newTotalScore >= 4.0) newLetterGrade = "D";
            else newLetterGrade = "F";
        }

        // Update Grade
        const updated = await tx.grade.update({
            where: { id: existingGrade.id },
            data: {
                processScore: data.processScore,
                midtermScore: data.midtermScore,
                finalScore: data.finalScore,
                totalScore: newTotalScore,
                letterGrade: newLetterGrade
            }
        });

        // Create Audit Log
        await tx.gradeAuditLog.create({
            data: {
                gradeId: existingGrade.id,
                modifiedById: adminUserId,
                oldProcessScore: existingGrade.processScore,
                newProcessScore: data.processScore,
                oldMidtermScore: existingGrade.midtermScore,
                newMidtermScore: data.midtermScore,
                oldFinalScore: existingGrade.finalScore,
                newFinalScore: data.finalScore,
                reason: data.reason
            }
        });

        return updated;
    });
};

export const createQuestion = async (data: any) => {
    return prisma.questionBank.create({ data });
};

export const getQuestionsByCourse = async (courseId: string) => {
    return prisma.questionBank.findMany({
        where: { courseId },
        orderBy: { createdAt: 'desc' }
    });
};

export const submitRescoreRequest = async (studentId: string, gradeId: string, reason: string) => {
    const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
    if (!grade) throw new Error("Grade not found");
    if (grade.studentId !== studentId) throw new Error("This is not your grade");

    return prisma.rescoreRequest.create({
        data: {
            studentId,
            gradeId,
            reason,
            status: "PENDING"
        }
    });
};

export const getRescoreRequests = async () => {
    return prisma.rescoreRequest.findMany({
        include: { student: { include: { user: { include: { profile: true } } } }, grade: true },
        orderBy: { createdAt: 'desc' }
    });
};
