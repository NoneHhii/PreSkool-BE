import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as lmsController from "./lms.controller.ts";

const router = Router();

router.use(authenticate);

// =============================================================================
// 1. KHÔNG GIAN KHÓA HỌC & HỌC LIỆU (COURSE CONTENT & MATERIALS)
// =============================================================================
router.get("/classes/:classId/space", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getCourseSpace);
router.put("/classes/:classId/syllabus", requireRole("TEACHER", "ADMIN"), lmsController.updateSyllabus);

// Modules (Tuần / Chương)
router.post("/modules", requireRole("TEACHER", "ADMIN"), lmsController.createModule);
router.put("/modules/:moduleId", requireRole("TEACHER", "ADMIN"), lmsController.updateModule);
router.delete("/modules/:moduleId", requireRole("TEACHER", "ADMIN"), lmsController.deleteModule);

// Học liệu (Materials & Prerequisite)
router.post("/modules/:moduleId/materials", requireRole("TEACHER", "ADMIN"), lmsController.addMaterial);
router.put("/materials/:materialId", requireRole("TEACHER", "ADMIN"), lmsController.updateMaterial);
router.delete("/materials/:materialId", requireRole("TEACHER", "ADMIN"), lmsController.deleteMaterial);
router.post("/materials/:materialId/progress", requireRole("STUDENT"), lmsController.updateProgress);

// =============================================================================
// 2. BÀI TẬP TỰ LUẬN, THỰC HÀNH & ĐỒ ÁN (ASSIGNMENTS & PROJECTS)
// =============================================================================
router.post("/assignments", requireRole("TEACHER", "ADMIN"), lmsController.createAssignment);
router.put("/assignments/:assignmentId", requireRole("TEACHER", "ADMIN"), lmsController.updateAssignment);
router.get("/classes/:classId/assignments", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getAssignments);
router.get("/assignments/:assignmentId", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getAssignmentDetail);

// Nhóm làm bài tập (Assignment Groups)
router.post("/classes/:classId/assignment-groups", requireRole("TEACHER", "ADMIN"), lmsController.createAssignmentGroup);
router.post("/classes/:classId/assignment-groups/auto-split", requireRole("TEACHER", "ADMIN"), lmsController.autoSplitGroups);
router.get("/classes/:classId/assignment-groups", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getAssignmentGroups);
router.post("/assignment-groups/:groupId/join", requireRole("STUDENT"), lmsController.joinAssignmentGroup);

// Nộp bài & Chấm điểm
router.post("/assignments/:assignmentId/submissions", requireRole("STUDENT"), lmsController.submitAssignment);
router.get("/assignments/:assignmentId/submissions", requireRole("TEACHER", "ADMIN"), lmsController.getSubmissions);
router.put("/submissions/:submissionId/grade", requireRole("TEACHER", "ADMIN"), lmsController.gradeSubmission);

// =============================================================================
// 3. HỆ THỐNG KHẢO THÍ & THI TRỰC TUYẾN (QUIZZES & ONLINE EXAMS)
// =============================================================================
router.post("/question-bank", requireRole("TEACHER", "ADMIN"), lmsController.createQuestion);
router.get("/courses/:courseId/question-bank", requireRole("TEACHER", "ADMIN"), lmsController.getQuestions);

router.post("/quizzes", requireRole("TEACHER", "ADMIN"), lmsController.createQuiz);
router.get("/classes/:classId/quizzes", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getQuizzes);

// Làm bài thi & Chống gian lận
router.post("/quizzes/:quizId/start", requireRole("STUDENT"), lmsController.startQuiz);
router.post("/quiz-attempts/:attemptId/save-answer", requireRole("STUDENT"), lmsController.saveQuizAnswer);
router.post("/quiz-attempts/:attemptId/log-cheating", requireRole("STUDENT"), lmsController.logCheating);
router.post("/quiz-attempts/:attemptId/submit", requireRole("STUDENT"), lmsController.submitQuiz);

// Giám sát & Mở lại lượt thi
router.get("/quizzes/:quizId/monitoring", requireRole("TEACHER", "ADMIN"), lmsController.getQuizMonitoring);
router.post("/quizzes/:quizId/students/:studentId/reopen-attempt", requireRole("TEACHER", "ADMIN"), lmsController.reopenQuiz);

// =============================================================================
// 4. DIỄN ĐÀN THẢO LUẬN & LỚP HỌC ẢO (DISCUSSIONS & VIRTUAL CLASSROOM)
// =============================================================================
router.post("/classes/:classId/forum/threads", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.createThread);
router.get("/classes/:classId/forum/threads", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getThreads);
router.get("/forum/threads/:threadId", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getThreadDetail);
router.post("/forum/threads/:threadId/comments", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.createComment);
router.post("/forum/vote", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.voteForum);
router.put("/forum/threads/:threadId/pin", requireRole("TEACHER", "ADMIN"), lmsController.pinThread);
router.put("/forum/comments/:commentId/mark-resolved", requireRole("TEACHER", "ADMIN"), lmsController.markCommentResolved);

// Lớp học ảo
router.post("/classes/:classId/virtual-classrooms", requireRole("TEACHER", "ADMIN"), lmsController.createVirtualClassroom);
router.get("/classes/:classId/virtual-classrooms", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getVirtualClassrooms);
router.put("/virtual-classrooms/:classroomId/recordings", requireRole("TEACHER", "ADMIN"), lmsController.updateRecordings);

// =============================================================================
// 5. SỔ ĐIỂM QUÁ TRÌNH & PHÂN TÍCH HỌC TẬP (GRADEBOOK & LEARNING ANALYTICS)
// =============================================================================
router.put("/classes/:classId/grade-weights", requireRole("TEACHER", "ADMIN"), lmsController.updateGradeWeights);
router.get("/classes/:classId/grade-weights", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getGradeWeights);
router.get("/classes/:classId/gradebook", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getGradebook);
router.post("/classes/:classId/gradebook/sync-to-erp", requireRole("TEACHER", "ADMIN"), lmsController.syncGradebook);
router.get("/classes/:classId/analytics", requireRole("TEACHER", "ADMIN"), lmsController.getAnalytics);

// =============================================================================
// 6. LỊCH HỌC TẬP, NHẮC HẠN & THÔNG BÁO (CALENDAR & NOTIFICATIONS)
// =============================================================================
router.get("/my-calendar", requireRole("STUDENT", "TEACHER"), lmsController.getMyCalendar);
router.post("/classes/:classId/announcements", requireRole("TEACHER", "ADMIN"), lmsController.createAnnouncement);
router.get("/classes/:classId/announcements", requireRole("STUDENT", "TEACHER", "ADMIN"), lmsController.getAnnouncements);
router.get("/notifications", lmsController.getMyNotifications);
router.put("/notifications/:id/read", lmsController.markNotificationRead);

export default router;
