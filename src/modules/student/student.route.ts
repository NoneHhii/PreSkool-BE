import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as studentController from "./student.controller.ts";

const router = Router();

router.use(authenticate);

// List students with multidimensional filters
router.get("/", requireRole("ADMIN", "TEACHER"), studentController.getStudents);

// Get student detail
router.get("/:id", requireRole("ADMIN", "TEACHER", "STUDENT"), studentController.getStudentById);

// Update student profile
router.put("/:id/profile", requireRole("ADMIN", "STUDENT"), studentController.updateStudentProfile);

// Update student academic status (SUSPENDED, DROPPED, etc.)
router.post("/:id/status", requireRole("ADMIN"), studentController.updateStudentStatus);

export default router;
