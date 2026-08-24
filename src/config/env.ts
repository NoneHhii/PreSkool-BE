import dotenv from "dotenv";

dotenv.config();

export const env = {
    port: Number(process.env.PORT) || 5000,
    databaseUrl: process.env.DATABASE_URL!,
    jwtAccessSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,

    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1d",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
}