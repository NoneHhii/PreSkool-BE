import type { Request, Response } from "express";
import * as lmsService from "./lms.service.ts";
import * as validation from "./lms.validation.ts";

// =============================================================================
// 1. KHÓA HỌC & HỌC LIỆU (COURSE CONTENT & MATERIALS)
// =============================================================================

export const getCourseSpace = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const studentId = (req as any).user?.studentId;
        const space = await lmsService.getCourseSpace(classId, studentId);
        return res.status(200).json({ message: "Success", data: space });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateSyllabus = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const result = validation.updateSyllabusSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await lmsService.updateSyllabus(classId, result.data);
        return res.status(200).json({ message: "Syllabus updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createModule = async (req: Request, res: Response) => {
    try {
        const result = validation.createLmsModuleSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const module = await lmsService.createModule(result.data);
        return res.status(201).json({ message: "Module created", data: module });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateModule = async (req: Request, res: Response) => {
    try {
        const moduleId = req.params.moduleId as string;
        const result = validation.updateLmsModuleSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await lmsService.updateModule(moduleId, result.data);
        return res.status(200).json({ message: "Module updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const deleteModule = async (req: Request, res: Response) => {
    try {
        const moduleId = req.params.moduleId as string;
        await lmsService.deleteModule(moduleId);
        return res.status(200).json({ message: "Module deleted" });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const addMaterial = async (req: Request, res: Response) => {
    try {
        const moduleId = req.params.moduleId as string;
        const result = validation.addMaterialSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const material = await lmsService.addMaterialToModule(moduleId, result.data);
        return res.status(201).json({ message: "Material added", data: material });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateMaterial = async (req: Request, res: Response) => {
    try {
        const materialId = req.params.materialId as string;
        const result = validation.updateMaterialSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await lmsService.updateMaterial(materialId, result.data);
        return res.status(200).json({ message: "Material updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const deleteMaterial = async (req: Request, res: Response) => {
    try {
        const materialId = req.params.materialId as string;
        await lmsService.deleteMaterial(materialId);
        return res.status(200).json({ message: "Material deleted" });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateProgress = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Chỉ sinh viên mới có tiến độ học tập" });

        const materialId = req.params.materialId as string;
        const result = validation.updateProgressSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const progress = await lmsService.updateMaterialProgress(materialId, studentId, result.data);
        return res.status(200).json({ message: "Progress updated", data: progress });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 2. BÀI TẬP (ASSIGNMENTS & PROJECTS)
// =============================================================================

export const createAssignment = async (req: Request, res: Response) => {
    try {
        const result = validation.createAssignmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const assignment = await lmsService.createAssignment(result.data);
        return res.status(201).json({ message: "Assignment created", data: assignment });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateAssignment = async (req: Request, res: Response) => {
    try {
        const assignmentId = req.params.assignmentId as string;
        const result = validation.updateAssignmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await lmsService.updateAssignment(assignmentId, result.data);
        return res.status(200).json({ message: "Assignment updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const studentId = (req as any).user?.studentId;
        const assignments = await lmsService.getAssignmentsByClass(classId, studentId);
        return res.status(200).json({ message: "Success", data: assignments });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAssignmentDetail = async (req: Request, res: Response) => {
    try {
        const assignmentId = req.params.assignmentId as string;
        const studentId = (req as any).user?.studentId;
        const assignment = await lmsService.getAssignmentDetail(assignmentId, studentId);
        return res.status(200).json({ message: "Success", data: assignment });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createAssignmentGroup = async (req: Request, res: Response) => {
    try {
        const result = validation.createAssignmentGroupSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const group = await lmsService.createAssignmentGroup(result.data.classId, result.data.name, result.data.studentIds);
        return res.status(201).json({ message: "Group created", data: group });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const autoSplitGroups = async (req: Request, res: Response) => {
    try {
        const result = validation.autoSplitGroupsSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const groups = await lmsService.autoSplitAssignmentGroups(result.data.classId, result.data.groupSize, result.data.prefix);
        return res.status(201).json({ message: "Groups generated successfully", data: groups });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAssignmentGroups = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const groups = await lmsService.getAssignmentGroups(classId);
        return res.status(200).json({ message: "Success", data: groups });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const joinAssignmentGroup = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can join groups" });

        const groupId = req.params.groupId as string;
        const membership = await lmsService.joinAssignmentGroup(groupId, studentId);
        return res.status(201).json({ message: "Joined group", data: membership });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const submitAssignment = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can submit assignments" });

        const assignmentId = req.params.assignmentId as string;
        const result = validation.submitAssignmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const submission = await lmsService.submitAssignment(assignmentId, studentId, result.data);
        return res.status(201).json({ message: "Assignment submitted", data: submission });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getSubmissions = async (req: Request, res: Response) => {
    try {
        const assignmentId = req.params.assignmentId as string;
        const submissions = await lmsService.getSubmissionsByAssignment(assignmentId);
        return res.status(200).json({ message: "Success", data: submissions });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const gradeSubmission = async (req: Request, res: Response) => {
    try {
        const submissionId = req.params.submissionId as string;
        const result = validation.gradeAssignmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const graded = await lmsService.gradeAssignmentSubmission(submissionId, result.data);
        return res.status(200).json({ message: "Submission graded", data: graded });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 3. THI CỬ & QUIZ (QUIZZES & ONLINE EXAMS)
// =============================================================================

export const createQuestion = async (req: Request, res: Response) => {
    try {
        const result = validation.createQuestionBankSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const question = await lmsService.createQuestion(result.data);
        return res.status(201).json({ message: "Question created", data: question });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getQuestions = async (req: Request, res: Response) => {
    try {
        const courseId = req.params.courseId as string;
        const { chapter, difficulty, lmsType } = req.query;
        const questions = await lmsService.getQuestionsByCourse(courseId, {
            chapter: chapter as string,
            difficulty: difficulty as any,
            lmsType: lmsType as any
        });
        return res.status(200).json({ message: "Success", data: questions });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createQuiz = async (req: Request, res: Response) => {
    try {
        const result = validation.createQuizSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const quiz = await lmsService.createQuiz(result.data);
        return res.status(201).json({ message: "Quiz created", data: quiz });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getQuizzes = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const studentId = (req as any).user?.studentId;
        const quizzes = await lmsService.getQuizzesByClass(classId, studentId);
        return res.status(200).json({ message: "Success", data: quizzes });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const startQuiz = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can take quizzes" });

        const quizId = req.params.quizId as string;
        const password = req.body?.password;
        const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

        const attempt = await lmsService.startQuizAttempt(quizId, studentId, password, clientIp);
        return res.status(200).json({ message: "Quiz started", data: attempt });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const saveQuizAnswer = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Unauthorized" });

        const attemptId = req.params.attemptId as string;
        const result = validation.saveQuizAnswerSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const saved = await lmsService.saveQuizAnswer(attemptId, studentId, result.data.questionBankId, result.data.studentAnswer);
        return res.status(200).json({ message: "Answer saved", data: saved });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const logCheating = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Unauthorized" });

        const attemptId = req.params.attemptId as string;
        const result = validation.logCheatingSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        await lmsService.logCheatingEvent(attemptId, studentId, result.data.event, result.data.details);
        return res.status(200).json({ message: "Event logged" });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const submitQuiz = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Unauthorized" });

        const attemptId = req.params.attemptId as string;
        const submitted = await lmsService.submitQuizAttempt(attemptId, studentId);
        return res.status(200).json({ message: "Quiz submitted successfully", data: submitted });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getQuizMonitoring = async (req: Request, res: Response) => {
    try {
        const quizId = req.params.quizId as string;
        const monitoring = await lmsService.getQuizMonitoring(quizId);
        return res.status(200).json({ message: "Success", data: monitoring });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const reopenQuiz = async (req: Request, res: Response) => {
    try {
        const quizId = req.params.quizId as string;
        const studentId = req.params.studentId as string;
        const result = validation.reopenAttemptSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const response = await lmsService.reopenQuizAttempt(quizId, studentId, result.data.reason);
        return res.status(200).json(response);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 4. DIỄN ĐÀN & LỚP HỌC ẢO (DISCUSSIONS & VIRTUAL CLASSROOM)
// =============================================================================

export const createThread = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const authorId = (req as any).user.id;
        const result = validation.createForumThreadSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const thread = await lmsService.createForumThread(classId, authorId, result.data);
        return res.status(201).json({ message: "Thread created", data: thread });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getThreads = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const threads = await lmsService.getForumThreads(classId);
        return res.status(200).json({ message: "Success", data: threads });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getThreadDetail = async (req: Request, res: Response) => {
    try {
        const threadId = req.params.threadId as string;
        const thread = await lmsService.getForumThreadDetail(threadId);
        return res.status(200).json({ message: "Success", data: thread });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        const threadId = req.params.threadId as string;
        const authorId = (req as any).user.id;
        const result = validation.createForumCommentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const comment = await lmsService.createForumComment(threadId, authorId, result.data);
        return res.status(201).json({ message: "Comment added", data: comment });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const voteForum = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = validation.voteForumSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const response = await lmsService.voteForum(userId, result.data.threadId, result.data.commentId, result.data.vote);
        return res.status(200).json(response);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const pinThread = async (req: Request, res: Response) => {
    try {
        const threadId = req.params.threadId as string;
        const isPinned = req.body.isPinned ?? true;
        const pinned = await lmsService.pinForumThread(threadId, isPinned);
        return res.status(200).json({ message: "Thread pin updated", data: pinned });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const markCommentResolved = async (req: Request, res: Response) => {
    try {
        const commentId = req.params.commentId as string;
        const isCorrect = req.body.isCorrectAnswer ?? true;
        const resolved = await lmsService.markCommentResolved(commentId, isCorrect);
        return res.status(200).json({ message: "Marked as correct answer", data: resolved });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createVirtualClassroom = async (req: Request, res: Response) => {
    try {
        const result = validation.createVirtualClassroomSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const room = await lmsService.createVirtualClassroom(result.data);
        return res.status(201).json({ message: "Virtual classroom created", data: room });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getVirtualClassrooms = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const rooms = await lmsService.getVirtualClassrooms(classId);
        return res.status(200).json({ message: "Success", data: rooms });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateRecordings = async (req: Request, res: Response) => {
    try {
        const classroomId = req.params.classroomId as string;
        const result = validation.updateRecordingsSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await lmsService.updateClassroomRecordings(classroomId, result.data.recordings);
        return res.status(200).json({ message: "Recordings updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 5. SỔ ĐIỂM QUÁ TRÌNH & PHÂN TÍCH (GRADEBOOK & LEARNING ANALYTICS)
// =============================================================================

export const updateGradeWeights = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const result = validation.updateGradeWeightsSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const config = await lmsService.updateGradeWeights(classId, result.data);
        return res.status(200).json({ message: "Weights updated", data: config });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getGradeWeights = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const config = await lmsService.getGradeWeights(classId);
        return res.status(200).json({ message: "Success", data: config });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getGradebook = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const role = (req as any).user?.role;
        const studentId = role === "STUDENT" ? (req as any).user?.studentId : undefined;

        const gradebook = await lmsService.getClassGradebook(classId, studentId);
        return res.status(200).json({ message: "Success", data: gradebook });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const syncGradebook = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const result = await lmsService.syncGradebookToErp(classId);
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const analytics = await lmsService.getClassAnalytics(classId);
        return res.status(200).json({ message: "Success", data: analytics });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 6. LỊCH HỌC TẬP, NHẮC HẠN & THÔNG BÁO (CALENDAR & NOTIFICATIONS)
// =============================================================================

export const getMyCalendar = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.studentId;
        if (!studentId) return res.status(403).json({ message: "Calendar is tailored for students" });

        const calendar = await lmsService.getStudentCalendar(studentId);
        return res.status(200).json({ message: "Success", data: calendar });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const authorId = (req as any).user.id;
        const result = validation.createAnnouncementSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const announcement = await lmsService.createCourseAnnouncement(classId, authorId, result.data);
        return res.status(201).json({ message: "Announcement created", data: announcement });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const announcements = await lmsService.getCourseAnnouncements(classId);
        return res.status(200).json({ message: "Success", data: announcements });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const notifications = await lmsService.getUserNotifications(userId);
        return res.status(200).json({ message: "Success", data: notifications });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const notificationId = req.params.id as string;
        const updated = await lmsService.markNotificationRead(notificationId, userId);
        return res.status(200).json({ message: "Marked as read", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
