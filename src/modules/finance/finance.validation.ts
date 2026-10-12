import { z } from "zod";

export const createTuitionConfigSchema = z.object({
    academicYear: z.string(),
    semester: z.number().int(),
    majorId: z.string().uuid().optional(),
    cohort: z.string().optional(),
    pricePerCredit: z.number().positive()
});

export const generateInvoiceSchema = z.object({
    studentId: z.string().uuid(),
    academicYear: z.string(),
    semester: z.number().int(),
    dueDate: z.string().datetime()
});

export const processPaymentSchema = z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().positive(),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "VNPAY", "MOMO"]),
    transactionRef: z.string().optional()
});
