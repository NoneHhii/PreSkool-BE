import type { Request, Response } from "express";
import * as userService from "./user.service";
import { createUserSchema } from "./user.validation";

export const createUser = async (
    req: Request,
    res: Response
) => {
    try {
        const result =
            createUserSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data",
                errors: result.error.flatten(),
            });
        }

        const user =
            await userService.createUser(
                result.data
            );

        return res.status(201).json({
            message: "User created successfully",
            data: user,
        });
    } catch (error) {
        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Create user failed",
        });
    }
};

export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const profile = await userService.getMyProfile(userId);

        return res.status(200).json({
            message: "Profile retrieved successfully",
            data: profile,
        });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to retrieve profile",
        });
    }
};

import { updateProfileSchema, changePasswordSchema } from "./user.validation";

export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const result = updateProfileSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data",
                errors: result.error.flatten(),
            });
        }

        const profile = await userService.updateMyProfile(userId, result.data);

        return res.status(200).json({
            message: "Profile updated successfully",
            data: profile,
        });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to update profile",
        });
    }
};

export const changeMyPassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const result = changePasswordSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data",
                errors: result.error.flatten(),
            });
        }

        await userService.changeMyPassword(userId, result.data);

        return res.status(200).json({
            message: "Password changed successfully",
        });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to change password",
        });
    }
};