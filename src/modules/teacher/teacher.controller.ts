import type { Request, Response } from "express";
import * as teacherService from "./teacher.service.ts";
import * as validation from "./teacher.validation.ts";

export const getMySchedule = async (req: Request, res: Response) => {
    try {
        const teacherId = (req as any).user.teacherId;
        if (!teacherId) return res.status(403).json({ message: "Only teachers can perform this action" });
        
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const schedule = await teacherService.getMySchedule(teacherId, startDate, endDate);
        return res.status(200).json({ message: "Success", data: schedule });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAssignedClasses = async (req: Request, res: Response) => {
    try {
        const teacherId = (req as any).user.teacherId;
        if (!teacherId) return res.status(403).json({ message: "Only teachers can perform this action" });

        const classes = await teacherService.getAssignedClasses(teacherId);
        return res.status(200).json({ message: "Success", data: classes });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getClassRoster = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const roster = await teacherService.getClassRoster(classId);
        return res.status(200).json({ message: "Success", data: roster });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const submitRescheduleRequest = async (req: Request, res: Response) => {
    try {
        const teacherId = (req as any).user.teacherId;
        if (!teacherId) return res.status(403).json({ message: "Only teachers can perform this action" });

        const result = validation.rescheduleRequestSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const request = await teacherService.createRescheduleRequest(teacherId, result.data);
        return res.status(201).json({ message: "Reschedule request submitted", data: request });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const performRollCall = async (req: Request, res: Response) => {
    try {
        const result = validation.rollCallSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const attendance = await teacherService.rollCall(result.data.scheduleId, result.data.attendances);
        return res.status(200).json({ message: "Roll call recorded", data: attendance });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const submitTeachingLog = async (req: Request, res: Response) => {
    try {
        const result = validation.teachingLogSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const log = await teacherService.saveTeachingLog(result.data.scheduleId, result.data.content, result.data.remarks);
        return res.status(200).json({ message: "Teaching log saved", data: log });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAbsenceWarning = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const stats = await teacherService.getStudentAbsenceStats(classId);
        return res.status(200).json({ message: "Success", data: stats });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
