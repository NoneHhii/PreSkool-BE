import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as examinationController from "./examination.controller.ts";

const router = Router();

router.use(authenticate);

// Exams & Rooms
router.post("/exams", requireRole("ADMIN"), examinationController.createExam);
router.post("/exams/:examId/rooms", requireRole("ADMIN"), examinationController.assignRooms);

// Grades
router.put("/classes/:classId/students/:studentId/grades", requireRole("TEACHER"), examinationController.enterGrade);
router.put("/classes/:classId/students/:studentId/grades/admin-edit", requireRole("ADMIN"), examinationController.adminEditGrade);

// Question Bank
router.post("/questions", requireRole("TEACHER", "ADMIN"), examinationController.createQuestion);
router.get("/courses/:courseId/questions", requireRole("TEACHER", "ADMIN"), examinationController.getQuestions);

// Rescore Requests
router.post("/rescore-requests", requireRole("STUDENT"), examinationController.submitRescoreRequest);
router.get("/rescore-requests", requireRole("TEACHER", "ADMIN"), examinationController.getRescoreRequests);

export default router;
