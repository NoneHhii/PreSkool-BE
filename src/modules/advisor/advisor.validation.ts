import { z } from "zod";

export const reviewTrainingPointSchema = z.object({
    trainingPointId: z.string().uuid(),
    advisorScore: z.number().int().min(0).max(100)
});

export const reviewRequestSchema = z.object({
    requestId: z.string().uuid(),
    status: z.enum(["APPROVED", "REJECTED"]),
    note: z.string().optional()
});
