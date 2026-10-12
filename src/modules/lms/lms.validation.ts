import { z } from "zod";

export const createLmsModuleSchema = z.object({
    classId: z.string().uuid(),
    title: z.string(),
    week: z.number().int(),
    order: z.number().int().optional()
});

export const addMaterialSchema = z.object({
    title: z.string(),
    type: z.enum(["PDF", "VIDEO", "LINK"]),
    url: z.string().url()
});

export const createAssignmentSchema = z.object({
    classId: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    deadline: z.string().datetime(),
    allowLate: z.boolean().optional(),
    isGroup: z.boolean().optional()
});

export const submitAssignmentSchema = z.object({
    fileUrl: z.string().url(),
    comments: z.string().optional()
});

export const gradeAssignmentSchema = z.object({
    score: z.number().min(0).max(100),
    comments: z.string().optional()
});
