import { date, email } from "zod";
import prisma from "../../config/prisma.ts";
import { hashPassword, comparePassword } from "../../utils/password.ts";

interface createUserInput {
    username: string;
    email: string;
    password: string;
    role: "STUDENT" | "TEACHER";
    fullName: string;
    phone?: string;

    studentCode?: string;

    teacherCode?: string;
    specialization?: string;
}

export const createUser = async (
    data: createUserInput
) => {
    const existingUser =
        await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        username: data.username
                    },
                    {
                        email: data.email
                    },
                ],
            },
        });

    if (existingUser) {
        throw new Error(
            "Username or email already exists"
        );
    }

    if (data.role === "STUDENT" && !data.studentCode) {
        throw new Error(
            "studentCode is required for student"
        );
    }

    if (data.role === "TEACHER" && !data.teacherCode) {
        throw new Error(
            "teacherCode is required for teacher"
        );
    };

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(
        async (tx: any) => {
            const newUser = await tx.user.create({
                data: {
                    username: data.username,
                    email: data.email,
                    passwordHash,
                    role: data.role,
                },
            });

            await tx.userProfile.create({
                data: {
                    userId: newUser.id,
                    fullName: data.fullName,
                    phone: data.phone,
                },
            });

            if (data.role === "STUDENT") {
                await tx.student.create({
                    data: {
                        userId: newUser.id,
                        studentCode:
                            data.studentCode!,
                    },
                });
            }

            if (data.role === "TEACHER") {
                await tx.teacher.create({
                    data: {
                        userId: newUser.id,
                        teacherCode:
                            data.teacherCode!,
                        specialization:
                            data.specialization,
                    },
                });
            }

            return newUser;
        }
    );

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };
}

export const getMyProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            student: true,
            teacher: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Exclude passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const updateMyProfile = async (userId: string, data: any) => {
    // We only update the profile table
    const profile = await prisma.userProfile.update({
        where: { userId },
        data: {
            fullName: data.fullName,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            gender: data.gender,
            address: data.address,
            avatarUrl: data.avatarUrl,
        },
    });
    return profile;
};

export const changeMyPassword = async (userId: string, data: any) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const isPasswordValid = await comparePassword(
        data.oldPassword,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid old password");
    }

    const passwordHash = await hashPassword(data.newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });

    return true;
};
