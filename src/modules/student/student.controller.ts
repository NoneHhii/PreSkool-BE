import type { Request, Response } from "express";
import * as studentService from "./student.service.ts";
import * as validation from "./student.validation.ts";

export const getStudents = async (req: Request, res: Response) => {
    try {
        const result = await studentService.getStudents(req.query);
        return res.status(200).json({ message: "Success", data: result });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getStudentById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const student = await studentService.getStudentById(id);
        return res.status(200).json({ message: "Success", data: student });
    } catch (error: any) {
        return res.status(404).json({ message: error.message });
    }
};

export const updateStudentProfile = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = validation.updateProfileSchema.safeParse(req.body);
        
        if (!result.success) {
            return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        }

        const profile = await studentService.updateStudentProfile(id, result.data);
        return res.status(200).json({ message: "Profile updated successfully", data: profile });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateStudentStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = validation.updateStatusSchema.safeParse(req.body);
        
        if (!result.success) {
            return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        }

        const log = await studentService.updateStudentStatus(id, result.data);
        return res.status(200).json({ message: "Student status updated successfully", data: log });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
