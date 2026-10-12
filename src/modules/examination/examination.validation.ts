import { z } from "zod";

export const createExamSchema = z.object({
    classId: z.string().uuid(),
    examDate: z.string().datetime(),
    examType: z.enum(["MULTIPLE_CHOICE", "ESSAY", "ORAL", "PROJECT"])
});

export const assignRoomsSchema = z.object({
    rooms: z.array(z.object({
        roomName: z.string(),
        capacity: z.number().int()
    }))
});

export const updateGradeSchema = z.object({
    processScore: z.number().optional(),
    midtermScore: z.number().optional(),
    finalScore: z.number().optional()
});

export const adminUpdateGradeSchema = z.object({
    processScore: z.number().optional(),
    midtermScore: z.number().optional(),
    finalScore: z.number().optional(),
    reason: z.string().min(5)
});

export const createQuestionSchema = z.object({
    courseId: z.string().uuid(),
    title: z.string(),
    type: z.enum(["MULTIPLE_CHOICE", "ESSAY", "ORAL", "PROJECT"]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    content: z.string(),
    options: z.any().optional(), // Can be array of strings or JSON
    answer: z.string()
});

export const submitRescoreRequestSchema = z.object({
    gradeId: z.string().uuid(),
    reason: z.string().min(10)
});
