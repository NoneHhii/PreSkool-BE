import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as teacherController from "./teacher.controller.ts";

const router = Router();

router.use(authenticate);

// Phase 2: Teaching Schedule & Attendance
router.get("/my-schedule", requireRole("TEACHER"), teacherController.getMySchedule);
router.get("/assigned-classes", requireRole("TEACHER"), teacherController.getAssignedClasses);
router.get("/classes/:classId/roster", requireRole("TEACHER", "ADMIN"), teacherController.getClassRoster);

router.post("/reschedule-requests", requireRole("TEACHER"), teacherController.submitRescheduleRequest);

router.post("/roll-call", requireRole("TEACHER"), teacherController.performRollCall);
router.post("/teaching-log", requireRole("TEACHER"), teacherController.submitTeachingLog);
router.get("/classes/:classId/absence-warnings", requireRole("TEACHER", "ADMIN"), teacherController.getAbsenceWarning);

export default router;
