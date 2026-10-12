import type { Request, Response } from "express";
import * as examinationService from "./examination.service.ts";
import * as validation from "./examination.validation.ts";

export const createExam = async (req: Request, res: Response) => {
    try {
        const result = validation.createExamSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const exam = await examinationService.createExam(result.data);
        return res.status(201).json({ message: "Exam created", data: exam });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const assignRooms = async (req: Request, res: Response) => {
    try {
        const examId = req.params.examId as string;
        const result = validation.assignRoomsSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const assignRes = await examinationService.assignRoomsAndStudents(examId, result.data.rooms);
        return res.status(200).json(assignRes);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const enterGrade = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const studentId = req.params.studentId as string;
        const result = validation.updateGradeSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const grade = await examinationService.enterGrades(classId, studentId, result.data);
        return res.status(200).json({ message: "Grade saved", data: grade });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const adminEditGrade = async (req: Request, res: Response) => {
    try {
        const adminUserId = (req as any).user.userId;
        const classId = req.params.classId as string;
        const studentId = req.params.studentId as string;

        const result = validation.adminUpdateGradeSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const grade = await examinationService.adminEditGrades(classId, studentId, result.data, adminUserId);
        return res.status(200).json({ message: "Grade updated by admin", data: grade });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createQuestion = async (req: Request, res: Response) => {
    try {
        const result = validation.createQuestionSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        
        const question = await examinationService.createQuestion(result.data);
        return res.status(201).json({ message: "Question added to bank", data: question });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getQuestions = async (req: Request, res: Response) => {
    try {
        const courseId = req.params.courseId as string;
        const questions = await examinationService.getQuestionsByCourse(courseId);
        return res.status(200).json({ message: "Success", data: questions });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const submitRescoreRequest = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can perform this action" });

        const result = validation.submitRescoreRequestSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const request = await examinationService.submitRescoreRequest(studentId, result.data.gradeId, result.data.reason);
        return res.status(201).json({ message: "Rescore request submitted", data: request });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getRescoreRequests = async (req: Request, res: Response) => {
    try {
        const requests = await examinationService.getRescoreRequests();
        return res.status(200).json({ message: "Success", data: requests });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
