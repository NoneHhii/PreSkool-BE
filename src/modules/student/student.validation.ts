import { z } from "zod";

export const updateProfileSchema = z.object({
    identityCard: z.string().optional(),
    birthPlace: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    policyObject: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    fullName: z.string().optional(),
    dateOfBirth: z.string().datetime().optional()
});

export const updateStatusSchema = z.object({
    newStatus: z.enum(["ACTIVE", "SUSPENDED", "DROPPED", "GRADUATED", "DISCIPLINED"]),
    decisionNumber: z.string().optional(),
    effectiveDate: z.string().datetime(),
    attachmentUrl: z.string().optional(),
    note: z.string().optional()
});
