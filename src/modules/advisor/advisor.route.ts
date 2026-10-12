import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as advisorController from "./advisor.controller.ts";

const router = Router();

router.use(authenticate);
router.use(requireRole("TEACHER"));

// Phase 5: Academic Advisor
router.get("/classes", advisorController.getAdvisedClasses);
router.get("/classes/:homeroomClassId/stats", advisorController.getHomeroomStats);

router.post("/review-training-point", advisorController.reviewTrainingPoint);
router.post("/review-request", advisorController.reviewRequest);

export default router;
