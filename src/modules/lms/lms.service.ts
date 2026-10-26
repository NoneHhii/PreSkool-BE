import prisma from "../../config/prisma.ts";

// =============================================================================
// 1. KHÔNG GIAN KHÓA HỌC & HỌC LIỆU (COURSE CONTENT & MATERIALS)
// =============================================================================

export const getCourseSpace = async (classId: string, studentId?: string) => {
    const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        include: {
            course: true,
            teacher: { include: { user: { include: { profile: true } } } },
            lmsmodules: {
                include: {
                    materials: {
                        include: studentId ? {
                            progresses: {
                                where: { studentId }
                            }
                        } : undefined,
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!classRecord) throw new Error("Class not found");

    // Calculate student progress if studentId is provided
    let overallProgress = 0;
    let totalMaterials = 0;
    let completedMaterials = 0;

    const modulesWithAccess = classRecord.lmsmodules.map((mod: any) => {
        const materialsWithStatus = mod.materials.map((mat: any) => {
            totalMaterials++;
            const studentProgress = mat.progresses?.[0];
            const isCompleted = studentProgress?.isCompleted ?? false;
            if (isCompleted) completedMaterials++;

            // Prerequisite check
            let isLocked = false;
            let lockReason: string | null = null;

            if (mat.unlockAt && new Date() < new Date(mat.unlockAt)) {
                isLocked = true;
                lockReason = `Mở khóa vào lúc ${new Date(mat.unlockAt).toLocaleString('vi-VN')}`;
            }

            return {
                id: mat.id,
                title: mat.title,
                type: mat.type,
                url: isLocked ? null : mat.url, // Hide URL if locked
                description: mat.description,
                isLocked,
                lockReason,
                isCompleted,
                progressPercent: studentProgress?.progressPercent ?? 0
            };
        });

        return {
            ...mod,
            materials: materialsWithStatus
        };
    });

    if (totalMaterials > 0) {
        overallProgress = Math.round((completedMaterials / totalMaterials) * 100);
    }

    return {
        classId: classRecord.id,
        classCode: classRecord.code,
        courseName: classRecord.course.name,
        courseCode: classRecord.course.code,
        credits: classRecord.course.credits,
        syllabus: classRecord.syllabus,
        teacher: classRecord.teacher ? {
            name: classRecord.teacher.user.profile?.fullName,
            email: classRecord.teacher.user.email,
            phone: classRecord.teacher.user.profile?.phone
        } : null,
        studentOverallProgress: studentId ? overallProgress : undefined,
        modules: modulesWithAccess
    };
};

export const updateSyllabus = async (classId: string, syllabusData: any) => {
    return prisma.class.update({
        where: { id: classId },
        data: { syllabus: syllabusData }
    });
};

export const createModule = async (data: any) => {
    return prisma.lMSModule.create({ data });
};

export const updateModule = async (moduleId: string, data: any) => {
    return prisma.lMSModule.update({
        where: { id: moduleId },
        data
    });
};

export const deleteModule = async (moduleId: string) => {
    return prisma.lMSModule.delete({ where: { id: moduleId } });
};

export const addMaterialToModule = async (moduleId: string, data: any) => {
    return prisma.lMSMaterial.create({
        data: {
            moduleId,
            ...data
        }
    });
};

export const updateMaterial = async (materialId: string, data: any) => {
    return prisma.lMSMaterial.update({
        where: { id: materialId },
        data
    });
};

export const deleteMaterial = async (materialId: string) => {
    return prisma.lMSMaterial.delete({ where: { id: materialId } });
};

export const updateMaterialProgress = async (materialId: string, studentId: string, data: { isCompleted?: boolean; progressPercent?: number }) => {
    const isCompleted = data.isCompleted ?? ((data.progressPercent ?? 0) >= 100);

    const progress = await prisma.materialProgress.upsert({
        where: { materialId_studentId: { materialId, studentId } },
        update: {
            isCompleted,
            progressPercent: data.progressPercent ?? (isCompleted ? 100 : 0),
            completedAt: isCompleted ? new Date() : null
        },
        create: {
            materialId,
            studentId,
            isCompleted,
            progressPercent: data.progressPercent ?? (isCompleted ? 100 : 0),
            completedAt: isCompleted ? new Date() : null
        }
    });

    return progress;
};

// =============================================================================
// 2. QUẢN LÝ BÀI TẬP TỰ LUẬN, THỰC HÀNH & ĐỒ ÁN (ASSIGNMENTS & PROJECTS)
// =============================================================================

export const createAssignment = async (data: any) => {
    return prisma.assignment.create({ data });
};

export const updateAssignment = async (assignmentId: string, data: any) => {
    return prisma.assignment.update({
        where: { id: assignmentId },
        data
    });
};

export const getAssignmentsByClass = async (classId: string, studentId?: string) => {
    const assignments = await prisma.assignment.findMany({
        where: { classId },
        include: {
            _count: { select: { submissions: true } },
            submissions: studentId ? {
                where: { studentId },
                orderBy: { version: 'desc' },
                take: 1
            } : false
        },
        orderBy: { deadline: 'asc' }
    });

    return assignments.map((a: any) => {
        const mySubmission = a.submissions?.[0] || null;
        return {
            id: a.id,
            title: a.title,
            description: a.description,
            openDate: a.openDate,
            deadline: a.deadline,
            cutOffDate: a.cutOffDate,
            allowLate: a.allowLate,
            isGroup: a.isGroup,
            submissionType: a.submissionType,
            maxFileSizeMb: a.maxFileSizeMb,
            allowedFileTypes: a.allowedFileTypes,
            totalSubmissions: a._count.submissions,
            mySubmission: mySubmission ? {
                id: mySubmission.id,
                fileUrl: mySubmission.fileUrl,
                onlineText: mySubmission.onlineText,
                linkUrl: mySubmission.linkUrl,
                score: mySubmission.score,
                feedback: mySubmission.feedback,
                isLate: mySubmission.isLate,
                submittedAt: mySubmission.submittedAt,
                version: mySubmission.version
            } : null
        };
    });
};

export const getAssignmentDetail = async (assignmentId: string, studentId?: string) => {
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            class: { select: { id: true, code: true } },
            submissions: studentId ? {
                where: { studentId },
                orderBy: { version: 'desc' }
            } : false
        }
    });

    if (!assignment) throw new Error("Assignment not found");
    return assignment;
};

export const createAssignmentGroup = async (classId: string, name: string, studentIds?: string[]) => {
    return prisma.assignmentGroup.create({
        data: {
            classId,
            name,
            members: studentIds && studentIds.length > 0 ? {
                create: studentIds.map((sId, index) => ({
                    studentId: sId,
                    isLeader: index === 0
                }))
            } : undefined
        },
        include: { members: { include: { student: { include: { user: { include: { profile: true } } } } } } }
    });
};

export const autoSplitAssignmentGroups = async (classId: string, groupSize: number = 4, prefix: string = "Nhóm") => {
    const enrollments = await prisma.classStudent.findMany({
        where: { classId, registrationStatus: "ENROLLED" },
        include: { student: true }
    });

    if (enrollments.length === 0) throw new Error("No enrolled students to form groups");

    // Shuffle students randomly
    const shuffled = [...enrollments].sort(() => 0.5 - Math.random());
    const groupsCreated = [];

    let groupCounter = 1;
    for (let i = 0; i < shuffled.length; i += groupSize) {
        const chunk = shuffled.slice(i, i + groupSize);
        const group = await prisma.assignmentGroup.create({
            data: {
                classId,
                name: `${prefix} ${groupCounter}`,
                members: {
                    create: chunk.map((c, idx) => ({
                        studentId: c.studentId,
                        isLeader: idx === 0
                    }))
                }
            },
            include: { members: true }
        });
        groupsCreated.push(group);
        groupCounter++;
    }

    return groupsCreated;
};

export const getAssignmentGroups = async (classId: string) => {
    return prisma.assignmentGroup.findMany({
        where: { classId },
        include: {
            members: {
                include: {
                    student: {
                        include: { user: { include: { profile: true } } }
                    }
                }
            }
        }
    });
};

export const joinAssignmentGroup = async (groupId: string, studentId: string) => {
    const group = await prisma.assignmentGroup.findUnique({
        where: { id: groupId },
        include: { members: true }
    });
    if (!group) throw new Error("Group not found");

    // Check if student already in a group in this class
    const existing = await prisma.assignmentGroupMember.findFirst({
        where: {
            studentId,
            group: { classId: group.classId }
        }
    });
    if (existing) throw new Error("Student is already in a group for this class");

    return prisma.assignmentGroupMember.create({
        data: {
            groupId,
            studentId,
            isLeader: group.members.length === 0
        }
    });
};

export const submitAssignment = async (assignmentId: string, studentId: string, data: any) => {
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId }
    });
    if (!assignment) throw new Error("Assignment not found");

    const now = new Date();

    if (assignment.openDate && now < new Date(assignment.openDate)) {
        throw new Error("Chưa đến thời gian mở nộp bài");
    }

    if (assignment.cutOffDate && now > new Date(assignment.cutOffDate)) {
        throw new Error("Cổng nộp bài đã bị khóa hoàn toàn (Hạn chót trễ đã qua)");
    }

    const isLate = now > new Date(assignment.deadline);
    if (isLate && !assignment.allowLate && !assignment.cutOffDate) {
        throw new Error("Đã quá hạn nộp bài và bài tập không cho phép nộp muộn");
    }

    // Check group submission
    let groupId: string | null = null;
    if (assignment.isGroup) {
        const membership = await prisma.assignmentGroupMember.findFirst({
            where: {
                studentId,
                group: { classId: assignment.classId }
            }
        });
        if (membership) {
            groupId = membership.groupId;
        }
    }

    // Check previous submissions to increment version
    const prevSubmission = await prisma.assignmentSubmission.findFirst({
        where: { assignmentId, studentId },
        orderBy: { version: 'desc' }
    });
    const version = prevSubmission ? prevSubmission.version + 1 : 1;

    return prisma.assignmentSubmission.create({
        data: {
            assignmentId,
            studentId,
            groupId,
            fileUrl: data.fileUrl || "",
            onlineText: data.onlineText,
            linkUrl: data.linkUrl,
            submissionType: data.submissionType || "FILE",
            version,
            isLate,
            comments: data.comments
        }
    });
};

export const getSubmissionsByAssignment = async (assignmentId: string) => {
    return prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
            student: { include: { user: { include: { profile: true } } } },
            group: { include: { members: { include: { student: { include: { user: { include: { profile: true } } } } } } } }
        },
        orderBy: { submittedAt: 'desc' }
    });
};

export const gradeAssignmentSubmission = async (submissionId: string, data: any) => {
    const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: { group: { include: { members: true } } }
    });
    if (!submission) throw new Error("Submission not found");

    // Grade this submission
    const graded = await prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
            score: data.score,
            feedback: data.feedback,
            annotations: data.annotations,
            rubricScores: data.rubricScores,
            comments: data.comments
        }
    });

    // If group submission, also replicate score for other group members' submissions if needed
    if (submission.groupId && submission.group) {
        for (const member of submission.group.members) {
            if (member.studentId !== submission.studentId) {
                await prisma.assignmentSubmission.upsert({
                    where: { id: `${submission.id}_${member.studentId}` }, // or by matching records
                    update: {
                        score: data.score,
                        feedback: data.feedback
                    },
                    create: {
                        id: `${submission.id}_${member.studentId}`,
                        assignmentId: submission.assignmentId,
                        studentId: member.studentId,
                        groupId: submission.groupId,
                        fileUrl: submission.fileUrl,
                        onlineText: submission.onlineText,
                        linkUrl: submission.linkUrl,
                        submissionType: submission.submissionType,
                        version: submission.version,
                        isLate: submission.isLate,
                        score: data.score,
                        feedback: data.feedback,
                        annotations: data.annotations,
                        rubricScores: data.rubricScores
                    }
                }).catch(() => {});
            }
        }
    }

    return graded;
};

// =============================================================================
// 3. HỆ THỐNG KHẢO THÍ & THI TRỰC TUYẾN (QUIZZES & ONLINE EXAMS)
// =============================================================================

export const createQuestion = async (data: any) => {
    return prisma.questionBank.create({ data });
};

export const getQuestionsByCourse = async (courseId: string, filter?: { chapter?: string; difficulty?: any; lmsType?: any }) => {
    return prisma.questionBank.findMany({
        where: {
            courseId,
            chapter: filter?.chapter,
            difficulty: filter?.difficulty,
            lmsType: filter?.lmsType
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const createQuiz = async (data: any) => {
    const { questionIds, questionMatrix, ...quizData } = data;

    return prisma.$transaction(async (tx) => {
        const quiz = await tx.quiz.create({
            data: {
                ...quizData,
                questionMatrix
            }
        });

        // 1. If manual questions provided
        if (questionIds && questionIds.length > 0) {
            await tx.quizQuestion.createMany({
                data: questionIds.map((qId: string, idx: number) => ({
                    quizId: quiz.id,
                    questionBankId: qId,
                    points: 1.0,
                    order: idx + 1
                }))
            });
        }
        // 2. If questionMatrix provided (auto pick from question bank)
        else if (questionMatrix && questionMatrix.difficulty) {
            const classObj = await tx.class.findUnique({ where: { id: quiz.classId } });
            if (classObj) {
                let currentOrder = 1;
                for (const [diff, count] of Object.entries(questionMatrix.difficulty as Record<string, number>)) {
                    const pickedQuestions = await tx.questionBank.findMany({
                        where: {
                            courseId: classObj.courseId,
                            difficulty: diff as any
                        },
                        take: count
                    });

                    for (const q of pickedQuestions) {
                        await tx.quizQuestion.create({
                            data: {
                                quizId: quiz.id,
                                questionBankId: q.id,
                                points: 1.0,
                                order: currentOrder++
                            }
                        });
                    }
                }
            }
        }

        return quiz;
    });
};

export const getQuizzesByClass = async (classId: string, studentId?: string) => {
    const quizzes = await prisma.quiz.findMany({
        where: { classId },
        include: {
            _count: { select: { questions: true } },
            attempts: studentId ? {
                where: { studentId },
                orderBy: { score: 'desc' }
            } : false
        },
        orderBy: { openTime: 'asc' }
    });

    return quizzes.map((q: any) => {
        const myAttempts = q.attempts || [];
        const highestScore = myAttempts.length > 0 ? myAttempts[0].score : null;
        return {
            id: q.id,
            title: q.title,
            description: q.description,
            openTime: q.openTime,
            closeTime: q.closeTime,
            durationMinutes: q.durationMinutes,
            hasPassword: !!q.password,
            maxAttempts: q.maxAttempts,
            totalQuestions: q._count.questions,
            attemptsUsed: myAttempts.length,
            highestScore,
            passingScore: q.passingScore
        };
    });
};

export const startQuizAttempt = async (quizId: string, studentId: string, password?: string, clientIp?: string) => {
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                include: { questionBank: true },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!quiz) throw new Error("Quiz not found");

    const now = new Date();
    if (now < new Date(quiz.openTime)) throw new Error("Chưa đến giờ mở đề kiểm tra");
    if (now > new Date(quiz.closeTime)) throw new Error("Đợt kiểm tra đã kết thúc");

    if (quiz.password && quiz.password !== password) {
        throw new Error("Mật khẩu ca thi không chính xác");
    }

    if (quiz.ipRange && clientIp && !clientIp.startsWith(quiz.ipRange)) {
        throw new Error(`IP của bạn (${clientIp}) không nằm trong dải IP cho phép phòng thi (${quiz.ipRange})`);
    }

    const existingAttempts = await prisma.quizAttempt.findMany({
        where: { quizId, studentId }
    });

    if (existingAttempts.length >= quiz.maxAttempts) {
        throw new Error(`Bạn đã đạt giới hạn tối đa ${quiz.maxAttempts} lần làm bài`);
    }

    // Shuffle questions if required
    let questions = [...quiz.questions];
    if (quiz.shuffleQuestions) {
        questions = questions.sort(() => 0.5 - Math.random());
    }

    const attemptNumber = existingAttempts.length + 1;

    // Create attempt
    const attempt = await prisma.quizAttempt.create({
        data: {
            quizId,
            studentId,
            attemptNumber,
            clientIp,
            status: "IN_PROGRESS",
            questionOrder: questions.map(q => q.questionBankId)
        }
    });

    // Strip answers for client presentation
    const safeQuestions = questions.map(q => {
        let options = q.questionBank.options as any;
        if (quiz.shuffleOptions && Array.isArray(options)) {
            options = [...options].sort(() => 0.5 - Math.random());
        }

        return {
            id: q.questionBankId,
            points: q.points,
            title: q.questionBank.title,
            content: q.questionBank.content,
            lmsType: q.questionBank.lmsType,
            options,
            codeLanguage: q.questionBank.codeLanguage
        };
    });

    return {
        attemptId: attempt.id,
        durationMinutes: quiz.durationMinutes,
        startTime: attempt.startTime,
        endTime: new Date(attempt.startTime.getTime() + quiz.durationMinutes * 60000),
        questions: safeQuestions
    };
};

export const saveQuizAnswer = async (attemptId: string, studentId: string, questionBankId: string, studentAnswer: any) => {
    const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: { quiz: true }
    });
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.studentId !== studentId) throw new Error("Unauthorized");
    if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt is already closed or submitted");

    // Check timer
    const maxEndTime = new Date(attempt.startTime.getTime() + (attempt.quiz.durationMinutes + 1) * 60000);
    if (new Date() > maxEndTime) {
        throw new Error("Hết thời gian làm bài");
    }

    return prisma.quizAttemptAnswer.upsert({
        where: { attemptId_questionBankId: { attemptId, questionBankId } },
        update: { studentAnswer },
        create: {
            attemptId,
            questionBankId,
            studentAnswer
        }
    });
};

export const logCheatingEvent = async (attemptId: string, studentId: string, event: string, details?: string) => {
    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.studentId !== studentId) return;

    const currentLogs = (attempt.cheatingLogs as any[]) || [];
    currentLogs.push({
        event,
        details,
        timestamp: new Date().toISOString()
    });

    return prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
            tabSwitchCount: { increment: 1 },
            cheatingLogs: currentLogs
        }
    });
};

export const submitQuizAttempt = async (attemptId: string, studentId: string) => {
    const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
            quiz: {
                include: {
                    questions: { include: { questionBank: true } }
                }
            },
            answers: true
        }
    });

    if (!attempt) throw new Error("Attempt not found");
    if (attempt.studentId !== studentId) throw new Error("Unauthorized");

    let totalScore = 0;
    const answerMap = new Map((attempt.answers as any[]).map((a: any) => [a.questionBankId, a]));

    for (const q of (attempt.quiz.questions as any[])) {
        const studentAns: any = answerMap.get(q.questionBankId);
        const correctAns = q.questionBank.answer?.trim();
        let isCorrect = false;

        if (studentAns && studentAns.studentAnswer !== undefined && studentAns.studentAnswer !== null) {
            const rawAns = typeof studentAns.studentAnswer === 'string'
                ? studentAns.studentAnswer.trim()
                : JSON.stringify(studentAns.studentAnswer);

            // Basic auto-grading
            if (rawAns.toLowerCase() === correctAns?.toLowerCase()) {
                isCorrect = true;
                totalScore += q.points;
            }

            await prisma.quizAttemptAnswer.update({
                where: { id: studentAns.id },
                data: {
                    isCorrect,
                    score: isCorrect ? q.points : 0
                }
            });
        }
    }

    // Convert to 10-point scale
    const totalPointsPossible = (attempt.quiz.questions as any[]).reduce((sum: number, q: any) => sum + q.points, 0);
    const scaledScore = totalPointsPossible > 0
        ? Math.round(((totalScore / totalPointsPossible) * 10) * 10) / 10
        : totalScore;

    return prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
            score: scaledScore,
            status: "SUBMITTED",
            submittedAt: new Date()
        }
    });
};

export const getQuizMonitoring = async (quizId: string) => {
    return prisma.quizAttempt.findMany({
        where: { quizId },
        include: {
            student: { include: { user: { include: { profile: true } } } }
        },
        orderBy: { startTime: 'desc' }
    });
};

export const reopenQuizAttempt = async (quizId: string, studentId: string, reason: string) => {
    // Delete student's latest attempt or allow another attempt
    const latestAttempt = await prisma.quizAttempt.findFirst({
        where: { quizId, studentId },
        orderBy: { attemptNumber: 'desc' }
    });

    if (latestAttempt) {
        await prisma.quizAttempt.delete({ where: { id: latestAttempt.id } });
    }

    return { message: "Reopened quiz attempt for student", reason };
};

// =============================================================================
// 4. DIỄN ĐÀN THẢO LUẬN & LỚP HỌC ẢO (DISCUSSIONS & VIRTUAL CLASSROOM)
// =============================================================================

export const createForumThread = async (classId: string, authorId: string, data: any) => {
    return prisma.forumThread.create({
        data: {
            classId,
            authorId,
            moduleId: data.moduleId,
            title: data.title,
            content: data.content,
            attachments: data.attachments
        }
    });
};

export const getForumThreads = async (classId: string) => {
    return prisma.forumThread.findMany({
        where: { classId },
        include: {
            author: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            _count: { select: { comments: true } }
        },
        orderBy: [
            { isPinned: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'desc' }
        ]
    });
};

export const getForumThreadDetail = async (threadId: string) => {
    return prisma.forumThread.findUnique({
        where: { id: threadId },
        include: {
            author: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            comments: {
                include: {
                    author: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } },
                    replies: {
                        include: {
                            author: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } }
                        }
                    }
                },
                where: { parentId: null },
                orderBy: [
                    { isCorrectAnswer: 'desc' },
                    { upvotes: 'desc' },
                    { createdAt: 'asc' }
                ]
            }
        }
    });
};

export const createForumComment = async (threadId: string, authorId: string, data: any) => {
    return prisma.forumComment.create({
        data: {
            threadId,
            authorId,
            content: data.content,
            attachments: data.attachments,
            parentId: data.parentId
        }
    });
};

export const voteForum = async (userId: string, threadId?: string, commentId?: string, vote: number = 1) => {
    return prisma.$transaction(async (tx) => {
        if (threadId) {
            await tx.forumVote.upsert({
                where: { userId_threadId_commentId: { userId, threadId, commentId: "" } },
                update: { vote },
                create: { userId, threadId, commentId: "", vote }
            });
            const agg = await tx.forumVote.aggregate({
                where: { threadId },
                _sum: { vote: true }
            });
            await tx.forumThread.update({
                where: { id: threadId },
                data: { upvotes: agg._sum.vote || 0 }
            });
        } else if (commentId) {
            await tx.forumVote.upsert({
                where: { userId_threadId_commentId: { userId, threadId: "", commentId } },
                update: { vote },
                create: { userId, threadId: "", commentId, vote }
            });
            const agg = await tx.forumVote.aggregate({
                where: { commentId },
                _sum: { vote: true }
            });
            await tx.forumComment.update({
                where: { id: commentId },
                data: { upvotes: agg._sum.vote || 0 }
            });
        }
        return { message: "Vote recorded" };
    });
};

export const pinForumThread = async (threadId: string, isPinned: boolean) => {
    return prisma.forumThread.update({
        where: { id: threadId },
        data: { isPinned }
    });
};

export const markCommentResolved = async (commentId: string, isCorrectAnswer: boolean) => {
    const comment = await prisma.forumComment.update({
        where: { id: commentId },
        data: { isCorrectAnswer }
    });

    if (isCorrectAnswer) {
        await prisma.forumThread.update({
            where: { id: comment.threadId },
            data: { isResolved: true }
        });
    }

    return comment;
};

export const createVirtualClassroom = async (data: any) => {
    return prisma.virtualClassroom.create({ data });
};

export const getVirtualClassrooms = async (classId: string) => {
    return prisma.virtualClassroom.findMany({
        where: { classId },
        orderBy: { startTime: 'desc' }
    });
};

export const updateClassroomRecordings = async (classroomId: string, recordings: any[]) => {
    return prisma.virtualClassroom.update({
        where: { id: classroomId },
        data: { recordings }
    });
};

// =============================================================================
// 5. SỔ ĐIỂM QUÁ TRÌNH & PHÂN TÍCH HỌC TẬP (GRADEBOOK & LEARNING ANALYTICS)
// =============================================================================

export const updateGradeWeights = async (classId: string, data: any) => {
    return prisma.gradeWeightConfig.upsert({
        where: { classId },
        update: data,
        create: {
            classId,
            ...data
        }
    });
};

export const getGradeWeights = async (classId: string) => {
    return prisma.gradeWeightConfig.findUnique({
        where: { classId }
    });
};

export const getClassGradebook = async (classId: string, studentId?: string) => {
    const weightConfig = await prisma.gradeWeightConfig.findUnique({ where: { classId } });
    const quizWeight = weightConfig?.quizWeight ?? 0.3;
    const assignmentWeight = weightConfig?.assignmentWeight ?? 0.4;

    const classStudents = await prisma.classStudent.findMany({
        where: { classId, registrationStatus: "ENROLLED" },
        include: {
            student: {
                include: {
                    user: { include: { profile: true } },
                    quizAttempts: {
                        where: { quiz: { classId } },
                        orderBy: { score: 'desc' }
                    },
                    assignmentSubmissions: {
                        where: { assignment: { classId } },
                        orderBy: { score: 'desc' }
                    }
                }
            }
        }
    });

    const studentSummaries = classStudents.map((cs: any) => {
        const student = cs.student;
        // Best scores for quizzes
        const quizScores: Record<string, number | null> = {};
        for (const att of student.quizAttempts) {
            if (quizScores[att.quizId] === undefined || (att.score && att.score > (quizScores[att.quizId] || 0))) {
                quizScores[att.quizId] = att.score;
            }
        }

        // Best scores for assignments
        const assignScores: Record<string, number | null> = {};
        for (const sub of student.assignmentSubmissions) {
            if (assignScores[sub.assignmentId] === undefined || (sub.score && sub.score > (assignScores[sub.assignmentId] || 0))) {
                assignScores[sub.assignmentId] = sub.score;
            }
        }

        // Calculate averages
        const quizValues = Object.values(quizScores).filter((v): v is number => v !== null);
        const avgQuiz = quizValues.length > 0 ? (quizValues.reduce((a, b) => a + b, 0) / quizValues.length) : null;

        const assignValues = Object.values(assignScores).filter((v): v is number => v !== null);
        const avgAssign = assignValues.length > 0 ? (assignValues.reduce((a, b) => a + b, 0) / assignValues.length) : null;

        // Weighted Process Score (thang 10)
        let processScore: number | null = null;
        if (avgQuiz !== null || avgAssign !== null) {
            const qPart = (avgQuiz ?? 0) * quizWeight;
            const aPart = ((avgAssign ?? 0) / 10) * assignmentWeight; // assignments usually 100 max -> / 10
            const totalWeights = (avgQuiz !== null ? quizWeight : 0) + (avgAssign !== null ? assignmentWeight : 0);
            processScore = totalWeights > 0 ? Math.round(((qPart + aPart) / totalWeights) * 10) / 10 : null;
        }

        return {
            studentId: student.id,
            studentCode: student.studentCode,
            fullName: student.user.profile?.fullName,
            quizScores,
            assignScores,
            avgQuiz,
            avgAssign,
            processScore
        };
    });

    // Rank students
    studentSummaries.sort((a, b) => (b.processScore ?? 0) - (a.processScore ?? 0));
    const ranked = studentSummaries.map((s, idx) => ({ ...s, rank: idx + 1 }));

    // If student, filter to only return my rank and summary
    if (studentId) {
        const myRecord = ranked.find(r => r.studentId === studentId);
        return {
            isStudentView: true,
            myGrade: myRecord || null,
            totalStudents: ranked.length
        };
    }

    return {
        isStudentView: false,
        weightConfig,
        roster: ranked
    };
};

export const syncGradebookToErp = async (classId: string) => {
    const gradebook = await getClassGradebook(classId);
    if (!gradebook.roster) throw new Error("Could not calculate gradebook");

    let syncedCount = 0;
    for (const record of gradebook.roster) {
        if (record.processScore !== null) {
            await prisma.grade.upsert({
                where: { classId_studentId: { classId, studentId: record.studentId } },
                update: { processScore: record.processScore },
                create: {
                    classId,
                    studentId: record.studentId,
                    processScore: record.processScore
                }
            });
            syncedCount++;
        }
    }

    return { message: `Đã đồng bộ ${syncedCount} sinh viên sang bảng điểm ERP thành công!`, syncedCount };
};

export const getClassAnalytics = async (classId: string) => {
    const gradebook = await getClassGradebook(classId);
    const scores = (gradebook.roster || []).map(r => r.processScore).filter((s): s is number => s !== null);

    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

    // Standard deviation
    const variance = scores.length > 0
        ? scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length
        : 0;
    const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

    // Identify At-Risk Students (chưa có điểm hoặc processScore < 5.0)
    const atRiskStudents = (gradebook.roster || []).filter(r => r.processScore === null || r.processScore < 5.0);

    return {
        totalStudents: gradebook.roster?.length || 0,
        testedStudents: scores.length,
        maxScore: max,
        minScore: min,
        avgScore: avg,
        stdDev,
        atRiskStudentsCount: atRiskStudents.length,
        atRiskStudents: atRiskStudents.map(s => ({
            studentId: s.studentId,
            studentCode: s.studentCode,
            fullName: s.fullName,
            processScore: s.processScore
        }))
    };
};

// =============================================================================
// 6. LỊCH HỌC TẬP, NHẮC HẠN & THÔNG BÁO (CALENDAR & NOTIFICATIONS)
// =============================================================================

export const getStudentCalendar = async (studentId: string) => {
    const enrollments = await prisma.classStudent.findMany({
        where: { studentId, registrationStatus: "ENROLLED" },
        include: {
            class: {
                include: {
                    course: true,
                    assignments: true,
                    quizzes: true,
                    virtualClassrooms: true,
                    schedules: true
                }
            }
        }
    });

    const events: any[] = [];

    for (const enr of (enrollments as any[])) {
        const cls = enr.class;
        // 1. Assignments
        for (const a of cls.assignments) {
            events.push({
                type: "ASSIGNMENT",
                title: `Hạn nộp bài tập: ${a.title}`,
                course: cls.course.name,
                classCode: cls.code,
                deadline: a.deadline,
                referenceId: a.id
            });
        }
        // 2. Quizzes
        for (const q of cls.quizzes) {
            events.push({
                type: "QUIZ",
                title: `Kiểm tra Quiz: ${q.title}`,
                course: cls.course.name,
                classCode: cls.code,
                openTime: q.openTime,
                closeTime: q.closeTime,
                durationMinutes: q.durationMinutes,
                referenceId: q.id
            });
        }
        // 3. Virtual Classrooms
        for (const vc of cls.virtualClassrooms) {
            events.push({
                type: "LIVE_CLASS",
                title: `Lớp học trực tuyến: ${vc.title}`,
                course: cls.course.name,
                classCode: cls.code,
                startTime: vc.startTime,
                meetingUrl: vc.meetingUrl,
                referenceId: vc.id
            });
        }
        // 4. In-person Schedules
        for (const sc of cls.schedules) {
            events.push({
                type: "CLASS_SCHEDULE",
                title: `Học trên lớp (${sc.shift} - Phòng ${sc.room})`,
                course: cls.course.name,
                classCode: cls.code,
                date: sc.date,
                shift: sc.shift,
                room: sc.room
            });
        }
    }

    return events.sort((a, b) => new Date(a.deadline || a.openTime || a.startTime || a.date).getTime() - new Date(b.deadline || b.openTime || b.startTime || b.date).getTime());
};

export const createCourseAnnouncement = async (classId: string, authorId: string, data: any) => {
    return prisma.$transaction(async (tx) => {
        const announcement = await tx.courseAnnouncement.create({
            data: {
                classId,
                authorId,
                title: data.title,
                content: data.content,
                isPinned: data.isPinned ?? false
            }
        });

        // Broadcast notification to all enrolled students
        const students = await tx.classStudent.findMany({
            where: { classId, registrationStatus: "ENROLLED" },
            include: { student: true }
        });

        for (const cs of students) {
            await tx.notification.create({
                data: {
                    userId: cs.student.userId,
                    title: `Thông báo lớp học: ${data.title}`,
                    message: data.content.substring(0, 100),
                    type: "ANNOUNCEMENT",
                    referenceId: announcement.id
                }
            });
        }

        return announcement;
    });
};

export const getCourseAnnouncements = async (classId: string) => {
    return prisma.courseAnnouncement.findMany({
        where: { classId },
        include: {
            author: { select: { id: true, email: true, profile: { select: { fullName: true } } } }
        },
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
        ]
    });
};

export const getUserNotifications = async (userId: string) => {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
};

export const markNotificationRead = async (notificationId: string, userId: string) => {
    return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
    });
};
