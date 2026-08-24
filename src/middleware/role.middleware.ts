import type {
    NextFunction,
    Response,
} from "express";

import type { AuthRequest } from "./auth.middleware.ts";

export const requireRole = (
    ...roles: ("ADMIN" | "TEACHER" | "STUDENT")[]
) => {
    return (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (
            !roles.includes(req.user.role)
        ) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        next();
    };
};