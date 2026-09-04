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

export const importStudents = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Excel file is required" });
        }
        
        const enrollmentYearStr = req.body.enrollmentYear || req.query.enrollmentYear || new Date().getFullYear().toString();
        const yearPrefix = enrollmentYearStr.slice(-2);

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Read with raw: false to get formatted strings for dates if possible
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { raw: false });

        const success: any[] = [];
        const errors: any[] = [];
        
        const seqMap: { [prefix: string]: number } = {};

        const allMajors = await prisma.major.findMany();
        const majorMap = new Map(allMajors.map(m => [String(m.code), m]));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                if (!row.fullName || !row.dateOfBirth || !row.email || !row.majorCode) {
                    throw new Error("Missing required fields (fullName, dateOfBirth, email, majorCode)");
                }

                const majorCode = String(row.majorCode);
                const major = majorMap.get(majorCode);
                if (!major) {
                    throw new Error(`Major code ${majorCode} not found in system`);
                }

                const existing = await prisma.user.findFirst({
                    where: { email: String(row.email) }
                });
                if (existing) {
                    throw new Error(`Email ${row.email} already exists`);
                }

                const majorSuffix = majorCode.length >= 3 ? majorCode.slice(-3) : majorCode.padStart(3, '0');
                const studentCodePrefix = `${yearPrefix}${majorSuffix}`;
                
                if (seqMap[studentCodePrefix] === undefined) {
                    const lastStudent = await prisma.student.findFirst({
                        where: { studentCode: { startsWith: studentCodePrefix } },
                        orderBy: { studentCode: 'desc' }
                    });
                    
                    if (lastStudent) {
                        const seqStr = lastStudent.studentCode.replace(studentCodePrefix, '');
                        const seq = parseInt(seqStr);
                        seqMap[studentCodePrefix] = isNaN(seq) ? 0 : seq;
                    } else {
                        seqMap[studentCodePrefix] = 0;
                    }
                }
                
                seqMap[studentCodePrefix]++;
                const sequenceNum = seqMap[studentCodePrefix].toString().padStart(3, '0');
                const studentCode = `${studentCodePrefix}${sequenceNum}`;

                let dobString = String(row.dateOfBirth);
                let defaultPassword = "password123";
                
                let cleanDob = dobString.replace(/[\/\\]/g, '-');
                const parts = cleanDob.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        defaultPassword = `${parts[2].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[0]}`;
                    } else if (parts[2].length === 4) {
                        defaultPassword = `${parts[0].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[2]}`;
                    } else {
                        defaultPassword = dobString.replace(/\D/g, '').substring(0, 8);
                    }
                } else {
                    defaultPassword = dobString.replace(/\D/g, '').substring(0, 8) || "password123";
                }

                const passwordHash = await hashPassword(defaultPassword);
                
                let dobDate: Date | null = null;
                const parsedDate = new Date(dobString);
                if (!isNaN(parsedDate.getTime())) {
                    dobDate = parsedDate;
                } else if (parts.length === 3 && parts[2].length === 4) {
                    // DD-MM-YYYY fallback
                    dobDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }

                const user = await prisma.$transaction(async (tx: any) => {
                    const createdUser = await tx.user.create({
                        data: {
                            username: studentCode,
                            email: String(row.email),
                            password: passwordHash,
                            role: "STUDENT",
                        }
                    });

                    await tx.profile.create({
                        data: {
                            userId: createdUser.id,
                            fullName: String(row.fullName),
                            dateOfBirth: dobDate,
                            gender: row.gender ? String(row.gender).toUpperCase() : null,
                            phone: row.phone ? String(row.phone) : null,
                            address: row.address ? String(row.address) : null,
                        }
                    });

                    await tx.student.create({
                        data: {
                            userId: createdUser.id,
                            studentCode: studentCode,
                            cohort: row.cohort ? String(row.cohort) : null,
                            majorId: major.id,
                            enrollmentDate: new Date(),
                            status: "ACTIVE"
                        }
                    });

                    return createdUser;
                });

                success.push({ row: i + 2, studentCode, email: row.email, defaultPassword });
            } catch (err: any) {
                errors.push({ row: i + 2, email: row.email, message: err.message });
            }
        }

        return res.status(200).json({
            message: "Student import completed",
            total: rows.length,
            success: success.length,
            failed: errors.length,
            successRows: success,
            errors,
        });

    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};