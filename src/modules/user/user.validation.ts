import z from "zod";

export const createUserSchema = z.object({
    username: z
        .string()
        .min(3)
        .max(50),

    email: z
        .string()
        .email(),

    password: z
        .string()
        .min(6),

    role: z.enum([
        "STUDENT",
        "TEACHER",
    ]),

    fullName: z
        .string()
        .min(2),

    phone: z
        .string()
        .optional(),

    studentCode: z
        .string()
        .optional(),

    teacherCode: z
        .string()
        .optional(),

    specialization: z
        .string()
        .optional(),
});

export const updateProfileSchema = z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});