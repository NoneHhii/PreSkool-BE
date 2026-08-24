import type { Response, Request } from "express";
import * as authService from "../../modules/auth/auth.service.ts";
import { hashPassword } from "../../utils/password.ts";
import prisma from "../../config/prisma.ts";
import XLSX from "xlsx";

export const login = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            usernameOrEmail,
            password,
        } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({
                message:
                    "usernameOrEmail and password are required",
            });
        }

        const result = await authService.login(
            usernameOrEmail,
            password
        );

        return res.status(200).json({
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        return res.status(401).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Login failed",
        });
    }
};

export const importUsers = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Excel file is required",
            });
        }

        const workbook =
            XLSX.read(req.file.buffer, {
                type: "buffer",
            });

        const sheetName =
            workbook.SheetNames[0];

        const sheet =
            workbook.Sheets[sheetName];

        const rows =
            XLSX.utils.sheet_to_json<any>(
                sheet
            );

        const success: any[] = [];
        const errors: any[] = [];

        for (
            let i = 0;
            i < rows.length;
            i++
        ) {
            const row = rows[i];

            try {
                if (
                    !row.username ||
                    !row.email ||
                    !row.password ||
                    !row.role ||
                    !row.fullName
                ) {
                    throw new Error(
                        "Missing required fields"
                    );
                }

                if (
                    ![
                        "STUDENT",
                        "TEACHER",
                    ].includes(row.role)
                ) {
                    throw new Error(
                        "Role must be STUDENT or TEACHER"
                    );
                }

                const existing =
                    await prisma.user.findFirst({
                        where: {
                            OR: [
                                {
                                    username:
                                        row.username,
                                },
                                {
                                    email: row.email,
                                },
                            ],
                        },
                    });

                if (existing) {
                    throw new Error(
                        "Username or email already exists"
                    );
                }

                if (
                    row.role === "STUDENT" &&
                    !row.studentCode
                ) {
                    throw new Error(
                        "studentCode is required"
                    );
                }

                if (
                    row.role === "TEACHER" &&
                    !row.teacherCode
                ) {
                    throw new Error(
                        "teacherCode is required"
                    );
                }

                const passwordHash =
                    await hashPassword(
                        String(row.password)
                    );

                const user =
                    await prisma.$transaction(
                        async (tx: any) => {
                            const newUser =
                                await tx.user.create({
                                    data: {
                                        username:
                                            String(row.username),
                                        email:
                                            String(row.email),
                                        passwordHash,
                                        role: row.role,
                                    },
                                });

                            await tx.userProfile.create({
                                data: {
                                    userId:
                                        newUser.id,
                                    fullName:
                                        String(
                                            row.fullName
                                        ),
                                    phone: row.phone
                                        ? String(row.phone)
                                        : undefined,
                                },
                            });

                            if (
                                row.role ===
                                "STUDENT"
                            ) {
                                await tx.student.create({
                                    data: {
                                        userId:
                                            newUser.id,
                                        studentCode:
                                            String(
                                                row.studentCode
                                            ),
                                    },
                                });
                            }

                            if (
                                row.role ===
                                "TEACHER"
                            ) {
                                await tx.teacher.create({
                                    data: {
                                        userId:
                                            newUser.id,
                                        teacherCode:
                                            String(
                                                row.teacherCode
                                            ),
                                        specialization:
                                            row.specialization
                                                ? String(
                                                    row.specialization
                                                )
                                                : undefined,
                                    },
                                });
                            }

                            return newUser;
                        }
                    );

                success.push({
                    row: i + 2,
                    username:
                        user.username,
                });
            } catch (error) {
                errors.push({
                    row: i + 2,
                    username:
                        row.username,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                });
            }
        }

        return res.status(200).json({
            message:
                "Import completed",
            total: rows.length,
            success: success.length,
            failed: errors.length,
            successRows: success,
            errors,
        });
    } catch (error) {
        return res.status(500).json({
            message:
                "Failed to process Excel file",
        });
    }
};