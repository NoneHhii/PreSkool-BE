import app from "./app.ts";
import prisma from "./src/config/prisma.ts";

let isConnected = false;

export default async (req: any, res: any) => {
    if (!isConnected) {
        await prisma.$connect();
        console.log("Database connected in serverless function");
        isConnected = true;
    }
    return app(req, res);
};
