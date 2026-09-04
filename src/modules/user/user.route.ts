import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import { uploadExcel } from "../../config/upload.ts";
import { importUsers, importStudents } from "../../controllers/auth/auth.controller.ts";
import { createUser, getMyProfile, updateMyProfile, changeMyPassword } from "./users.controller.ts";

const router = Router();

// Profile Routes (available to all authenticated users)
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.put("/me/password", authenticate, changeMyPassword);

// Admin routes
router.post("/", authenticate, requireRole("ADMIN"), createUser);
router.post("/import", authenticate, requireRole("ADMIN"), uploadExcel.single("file"), importUsers);
router.post("/import-students", authenticate, requireRole("ADMIN"), uploadExcel.single("file"), importStudents);

export default router;