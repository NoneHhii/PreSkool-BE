import type { Request, Response } from "express";
import * as lmsService from "./lms.service.ts";
import * as validation from "./lms.validation.ts";

export const createModule = async (req: Request, res: Response) => {
    try {
        const result = validation.createLmsModuleSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const module = await lmsService.createModule(result.data);
        return res.status(201).json({ message: "Module created", data: module });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getModules = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const modules = await lmsService.getModulesByClass(classId);
        return res.status(200).json({ message: "Success", data: modules });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const addMaterial = async (req: Request, res: Response) => {
    try {
        const moduleId = req.params.moduleId as string;
        const result = validation.addMaterialSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const material = await lmsService.addMaterialToModule(moduleId, result.data);
        return res.status(201).json({ message: "Material added", data: material });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createAssignment = async (req: Request, res: Response) => {
    try {
        const result = validation.createAssignmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const assignment = await lmsService.createAssignment(result.data);
        return res.status(201).json({ message: "Assignment created", data: assignment });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const classId = req.params.classId as string;
        const assignments = await lmsService.getAssignmentsByClass(classId);
        return res.status(200).json({ message: "Success", data: assignments });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const submitAssignment = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.studentId;
        if (!studentId) return res.status(403).json({ message: "Only students can submit assignments" });

        const assignmentId = req.params.assignmentId as string;
        const result = validation.submitAssignmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const submission = await lmsService.submitAssignment(assignmentId, studentId, result.data);
        return res.status(201).json({ message: "Assignment submitted", data: submission });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const gradeSubmission = async (req: Request, res: Response) => {
    try {
        const submissionId = req.params.submissionId as string;
        const result = validation.gradeAssignmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const graded = await lmsService.gradeAssignmentSubmission(submissionId, result.data);
        return res.status(200).json({ message: "Submission graded", data: graded });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
