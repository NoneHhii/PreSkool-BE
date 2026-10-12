import type { Request, Response } from "express";
import * as advisorService from "./advisor.service.ts";
import * as validation from "./advisor.validation.ts";

export const getAdvisedClasses = async (req: Request, res: Response) => {
    try {
        const advisorId = (req as any).user.teacherId;
        if (!advisorId) return res.status(403).json({ message: "Only teachers can be advisors" });

        const classes = await advisorService.getAdvisedClasses(advisorId);
        return res.status(200).json({ message: "Success", data: classes });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getHomeroomStats = async (req: Request, res: Response) => {
    try {
        const advisorId = (req as any).user.teacherId;
        if (!advisorId) return res.status(403).json({ message: "Only teachers can be advisors" });
        
        const homeroomClassId = req.params.homeroomClassId as string;
        const stats = await advisorService.getHomeroomStudentsStats(homeroomClassId, advisorId);
        return res.status(200).json({ message: "Success", data: stats });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const reviewTrainingPoint = async (req: Request, res: Response) => {
    try {
        const advisorId = (req as any).user.teacherId;
        if (!advisorId) return res.status(403).json({ message: "Only teachers can be advisors" });

        const result = validation.reviewTrainingPointSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const reviewed = await advisorService.reviewTrainingPoint(advisorId, result.data.trainingPointId, result.data.advisorScore);
        return res.status(200).json({ message: "Training point reviewed", data: reviewed });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const reviewRequest = async (req: Request, res: Response) => {
    try {
        const advisorId = (req as any).user.teacherId;
        if (!advisorId) return res.status(403).json({ message: "Only teachers can be advisors" });

        const result = validation.reviewRequestSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const reviewed = await advisorService.reviewStudentRequest(advisorId, result.data.requestId, result.data.status, result.data.note);
        return res.status(200).json({ message: "Request reviewed", data: reviewed });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
