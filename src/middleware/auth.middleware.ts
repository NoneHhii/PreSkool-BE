import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.ts";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: "ADMIN" | "TEACHER" | "STUDENT";
    };
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Access token required",
            });
        }

        const [type, token] =
            authHeader.split(" ");

        if (
            type !== "Bearer" ||
            !token
        ) {
            return res.status(401).json({
                message: "Invalid authorization format",
            });
        }

        const payload =
            verifyAccessToken(token);

        req.user = payload;

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired access token",
        });
    }
};