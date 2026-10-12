import { z } from "zod";

export const createRegistrationPeriodSchema = z.object({
    name: z.string(),
    academicYear: z.string(),
    semester: z.number().int(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    minCredits: z.number().int().default(12),
    maxCredits: z.number().int().default(24),
    type: z.enum(["NORMAL", "RETAKE", "ADJUSTMENT"]).default("NORMAL")
});

export const autoEnrollBatchSchema = z.object({
    homeroomClassId: z.string().uuid(),
    classIds: z.array(z.string().uuid()),
});

export const enrollManualOverrideSchema = z.object({
    studentId: z.string().uuid(),
    classId: z.string().uuid()
});
