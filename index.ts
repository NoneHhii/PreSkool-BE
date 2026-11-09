import 'dotenv/config';
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.ts";
import prisma from "./src/config/prisma.ts";
import { initTeamsSocket } from "./src/modules/teams/teams.socket.ts";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000
});

initTeamsSocket(io);

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected");

        const PORT = process.env.PORT || 8000;
        server.listen(PORT, () => {
            console.log(`Server & Socket.io running on port: ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
