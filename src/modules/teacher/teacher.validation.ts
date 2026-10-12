import { z } from "zod";

export const rescheduleRequestSchema = z.object({
    scheduleId: z.string().uuid(),
    newDate: z.string().datetime().optional(),
    newShift: z.string().optional(),
    newRoom: z.string().optional(),
    reason: z.string().min(10)
});

export const rollCallSchema = z.object({
    scheduleId: z.string().uuid(),
    attendances: z.array(z.object({
        studentId: z.string().uuid(),
        status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]),
        notes: z.string().optional()
    }))
});

export const teachingLogSchema = z.object({
    scheduleId: z.string().uuid(),
    content: z.string(),
    remarks: z.string().optional()
});
