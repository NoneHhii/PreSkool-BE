import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as financeController from "./finance.controller.ts";

const router = Router();

router.use(authenticate);

// Configs
router.get("/configs", requireRole("ADMIN", "TEACHER"), financeController.getTuitionConfigs);
router.post("/configs", requireRole("ADMIN"), financeController.createTuitionConfig);

// Invoices
router.post("/invoices/generate", requireRole("ADMIN"), financeController.generateInvoice);
router.get("/invoices/me", requireRole("STUDENT"), financeController.getMyInvoices);

// Payments
router.post("/payments", requireRole("ADMIN", "STUDENT"), financeController.processPayment);

export default router;
