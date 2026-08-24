import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

export interface JwtPayload {
    userId: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
}

export const generateAccessToken = (
    payload: JwtPayload
): string => {
    return jwt.sign(
        payload,
        env.jwtAccessSecret,
        {
            expiresIn: env.accessTokenExpiresIn as jwt.SignOptions["expiresIn"],
        }
    );
};

export const generateRefreshToken = (
    paload: JwtPayload
): string => {
    return jwt.sign(
        paload,
        env.jwtRefreshSecret,
        {
            expiresIn: env.refreshTokenExpiresIn as jwt.SignOptions["expiresIn"],
        }
    );
};

export const verifyAccessToken = (
    token: string
): JwtPayload => {
    return jwt.verify(
        token,
        env.jwtAccessSecret
    ) as JwtPayload;
};

export const verifyRefreshToken = (
    token: string
): JwtPayload => {
    return jwt.verify(
        token,
        env.jwtRefreshSecret
    ) as JwtPayload;
};
