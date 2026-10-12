import type { Request, Response } from "express";
import * as registrationService from "./registration.service.ts";
import * as validation from "./registration.validation.ts";

export const getRegistrationPeriods = async (req: Request, res: Response) => {
    try {
        const periods = await registrationService.getRegistrationPeriods();
        return res.status(200).json({ message: "Success", data: periods });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createRegistrationPeriod = async (req: Request, res: Response) => {
    try {
        const result = validation.createRegistrationPeriodSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        
        const period = await registrationService.createRegistrationPeriod(result.data);
        return res.status(201).json({ message: "Period created", data: period });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const autoEnrollBatch = async (req: Request, res: Response) => {
    try {
        const result = validation.autoEnrollBatchSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        
        const enrolled = await registrationService.autoEnrollBatch(result.data.homeroomClassId, result.data.classIds);
        return res.status(200).json({ message: "Batch enrollment successful", data: enrolled });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const enrollStudent = async (req: Request, res: Response) => {
    try {
        // req.user might be defined by auth middleware
        const studentId = (req as any).user.studentId; 
        if (!studentId) return res.status(403).json({ message: "Only students can perform this action directly" });

        const classId = req.params.classId as string;
        const enrolled = await registrationService.enrollStudent(studentId, classId, false);
        return res.status(200).json({ message: "Enrolled successfully", data: enrolled });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const unenrollStudent = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId; 
        if (!studentId) return res.status(403).json({ message: "Only students can perform this action directly" });

        const classId = req.params.classId as string;
        const unenrolled = await registrationService.unenrollStudent(studentId, classId, false);
        return res.status(200).json({ message: "Unenrolled successfully", data: unenrolled });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const manualOverrideEnroll = async (req: Request, res: Response) => {
    try {
        const result = validation.enrollManualOverrideSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        
        const enrolled = await registrationService.enrollStudent(result.data.studentId, result.data.classId, true);
        return res.status(200).json({ message: "Manual override enrollment successful", data: enrolled });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
