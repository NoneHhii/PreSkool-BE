import type { Request, Response } from "express";
import * as financeService from "./finance.service.ts";
import * as validation from "./finance.validation.ts";

export const getTuitionConfigs = async (req: Request, res: Response) => {
    try {
        const configs = await financeService.getTuitionConfigs();
        return res.status(200).json({ message: "Success", data: configs });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createTuitionConfig = async (req: Request, res: Response) => {
    try {
        const result = validation.createTuitionConfigSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        
        const config = await financeService.createTuitionConfig(result.data);
        return res.status(201).json({ message: "Config created", data: config });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const generateInvoice = async (req: Request, res: Response) => {
    try {
        const result = validation.generateInvoiceSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        
        const invoice = await financeService.generateInvoice(result.data);
        return res.status(201).json({ message: "Invoice generated successfully", data: invoice });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMyInvoices = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can view their invoices" });

        const invoices = await financeService.getInvoicesByStudent(studentId);
        return res.status(200).json({ message: "Success", data: invoices });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const processPayment = async (req: Request, res: Response) => {
    try {
        const result = validation.processPaymentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        
        const user = (req as any).user;
        const collectedById = user.role === "ADMIN" ? user.userId : undefined;

        const payment = await financeService.processPayment(result.data, collectedById);
        return res.status(200).json({ message: "Payment processed successfully", data: payment });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
