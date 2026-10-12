import { z } from "zod";

export const gradeTrainingPointSchema = z.object({
    score: z.number().int().min(0).max(100),
    level: z.enum(["SELF", "CLASS", "ADVISOR", "FINAL"])
});

export const createRequestSchema = z.object({
    requestType: z.enum(["CERTIFICATE", "INTERNSHIP_REFERRAL", "ID_CARD_REPLACEMENT", "TRANSCRIPT"]),
    note: z.string().optional()
});

export const updateRequestSchema = z.object({
    status: z.enum(["PENDING", "PROCESSING", "APPROVED", "REJECTED"]),
    resultAttachmentUrl: z.string().optional()
});
