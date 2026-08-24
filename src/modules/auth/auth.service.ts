import crypto from "crypto"
import prisma from "../../config/prisma.ts"
import { email, includes } from "zod";
import bcrypt, { compare } from "bcryptjs";
import {
    comparePassword,
} from "../../utils/password.ts";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../../utils/jwt.ts";

const hashToken = (token: string) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

export const login = async (
    username: string,
    password: string
) => {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                {
                    username: username
                },
                {
                    email: username
                },
            ],
        },
        include: {
            profile: true,
            student: true,
            teacher: true
        },
    });

    if (!user) {
        throw new Error("Invalid username/email or password");
    }

    if (user.status !== "ACTIVE") {
        throw new Error("Account is not active");
    }

    const isPasswordValid = await comparePassword(
        password,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid username/email or password");
    }

    const payload = {
        userId: user.id,
        role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date();

    expiresAt.setDate(
        expiresAt.getDate() + 7
    );

    await prisma.refreshToken.create({
        data: {
            tokenHash: refreshTokenHash,
            userId: user.id,
            expiresAt,
        },
    });

    return {
        accessToken,
        refreshToken,

        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,

            profile: user.profile,

            student: user.student,

            teacher: user.teacher,
        },
    };
}