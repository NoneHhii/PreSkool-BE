import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as lmsController from "./lms.controller.ts";

const router = Router();

router.use(authenticate);

// Phase 3: Course Materials
router.post("/modules", requireRole("TEACHER"), lmsController.createModule);
router.get("/classes/:classId/modules", requireRole("TEACHER", "STUDENT", "ADMIN"), lmsController.getModules);
router.post("/modules/:moduleId/materials", requireRole("TEACHER"), lmsController.addMaterial);

// Phase 3: Assignments
router.post("/assignments", requireRole("TEACHER"), lmsController.createAssignment);
router.get("/classes/:classId/assignments", requireRole("TEACHER", "STUDENT", "ADMIN"), lmsController.getAssignments);

router.post("/assignments/:assignmentId/submissions", requireRole("STUDENT"), lmsController.submitAssignment);
router.put("/submissions/:submissionId/grade", requireRole("TEACHER"), lmsController.gradeSubmission);

export default router;
