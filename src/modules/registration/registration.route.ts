import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as registrationController from "./registration.controller.ts";

const router = Router();

router.use(authenticate);

// Registration Periods
router.get("/periods", requireRole("ADMIN", "TEACHER"), registrationController.getRegistrationPeriods);
router.post("/periods", requireRole("ADMIN"), registrationController.createRegistrationPeriod);

// Auto-enrollment for freshmen/cohorts
router.post("/auto-enroll-batch", requireRole("ADMIN"), registrationController.autoEnrollBatch);

// Manual override (for Admins)
router.post("/manual-override", requireRole("ADMIN"), registrationController.manualOverrideEnroll);

// Student Self-Enrollment
router.post("/classes/:classId/enroll", requireRole("STUDENT"), registrationController.enrollStudent);
router.delete("/classes/:classId/unenroll", requireRole("STUDENT"), registrationController.unenrollStudent);

export default router;
