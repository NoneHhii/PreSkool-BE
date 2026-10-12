import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as affairsController from "./affairs.controller.ts";

const router = Router();

router.use(authenticate);

// Training Points
router.get("/training-points/me", requireRole("STUDENT"), affairsController.getMyTrainingPoints);
router.post("/training-points/students/:studentId/years/:academicYear/semesters/:semester", requireRole("STUDENT", "TEACHER", "ADMIN"), affairsController.gradeTrainingPoint);

// Student Requests
router.get("/requests/me", requireRole("STUDENT"), affairsController.getMyRequests);
router.post("/requests", requireRole("STUDENT"), affairsController.createStudentRequest);

router.get("/requests", requireRole("ADMIN"), affairsController.getAllRequests);
router.put("/requests/:requestId", requireRole("ADMIN"), affairsController.updateStudentRequest);

export default router;
