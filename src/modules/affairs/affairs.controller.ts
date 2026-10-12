import type { Request, Response } from "express";
import * as affairsService from "./affairs.service.ts";
import * as validation from "./affairs.validation.ts";

export const gradeTrainingPoint = async (req: Request, res: Response) => {
    try {
        const studentId = req.params.studentId as string;
        const academicYear = req.params.academicYear as string;
        const semester = req.params.semester as string;
        const result = validation.gradeTrainingPointSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const point = await affairsService.gradeTrainingPoint(studentId, academicYear, parseInt(semester), result.data.score, result.data.level);
        return res.status(200).json({ message: "Graded successfully", data: point });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMyTrainingPoints = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can view their training points directly" });

        const points = await affairsService.getTrainingPoints(studentId);
        return res.status(200).json({ message: "Success", data: points });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createStudentRequest = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can create requests" });

        const result = validation.createRequestSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const request = await affairsService.createStudentRequest({ studentId, ...result.data });
        return res.status(201).json({ message: "Request created", data: request });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMyRequests = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can view their requests" });

        const requests = await affairsService.getStudentRequests(studentId);
        return res.status(200).json({ message: "Success", data: requests });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAllRequests = async (req: Request, res: Response) => {
    try {
        const status = req.query.status as string;
        const requests = await affairsService.getAllStudentRequests(status);
        return res.status(200).json({ message: "Success", data: requests });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateStudentRequest = async (req: Request, res: Response) => {
    try {
        const requestId = req.params.requestId as string;
        const result = validation.updateRequestSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await affairsService.updateStudentRequest(requestId, result.data);
        return res.status(200).json({ message: "Request updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
