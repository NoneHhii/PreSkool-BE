import 'dotenv/config';
import connectDB from "./src/config/database.js";
import app from "./app.js";
import prisma from "./src/config/prisma.ts";


// const io = new http.Server

const startServer = async () => {
    try {
        await prisma.$connect();

        console.log(
            "Database connected"
        );

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port: ${process.env.PORT || 8000}`);

        })
    } catch (error) {
        console.error(
            "Failed to start server:",
            error
        );

        process.exit(1);
    }
}

startServer();
