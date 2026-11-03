import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.ts";

export const initTeamsSocket = (io: SocketIOServer) => {
    // Middleware for JWT Authentication on WebSocket connection
    io.use(async (socket: Socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
            if (!token) {
                return next(new Error("Authentication token required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as any;
            (socket as any).userId = decoded.userId || decoded.id;
            next();
        } catch (err: any) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", async (socket: Socket) => {
        const userId = (socket as any).userId;
        if (!userId) return;

        // 1. Set User Presence Online
        await prisma.user.update({
            where: { id: userId },
            data: { presenceStatus: "ONLINE", lastSeenAt: new Date() }
        }).catch(() => {});

        socket.broadcast.emit("presence_change", { userId, status: "ONLINE" });

        // Join user's personal room for direct notifications
        socket.join(`user_${userId}`);

        // 2. Room Subscriptions
        socket.on("join_channel", (channelId: string) => {
            socket.join(`channel_${channelId}`);
        });

        socket.on("leave_channel", (channelId: string) => {
            socket.leave(`channel_${channelId}`);
        });

        socket.on("join_conversation", (conversationId: string) => {
            socket.join(`conversation_${conversationId}`);
        });

        socket.on("join_meeting", (meetingId: string) => {
            socket.join(`meeting_${meetingId}`);
            socket.to(`meeting_${meetingId}`).emit("user_joined_meeting", { userId });
        });

        socket.on("leave_meeting", (meetingId: string) => {
            socket.leave(`meeting_${meetingId}`);
            socket.to(`meeting_${meetingId}`).emit("user_left_meeting", { userId });
        });

        // 3. Real-time Chat & Typing Indicators
        socket.on("typing", (data: { channelId?: string; conversationId?: string; isTyping: boolean; userName: string }) => {
            if (data.channelId) {
                socket.to(`channel_${data.channelId}`).emit("user_typing", { userId, userName: data.userName, isTyping: data.isTyping });
            } else if (data.conversationId) {
                socket.to(`conversation_${data.conversationId}`).emit("user_typing", { userId, userName: data.userName, isTyping: data.isTyping });
            }
        });

        socket.on("channel_message", (data: { channelId: string; message: any }) => {
            io.to(`channel_${data.channelId}`).emit("new_channel_message", data.message);
        });

        socket.on("direct_message", (data: { conversationId: string; message: any }) => {
            io.to(`conversation_${data.conversationId}`).emit("new_direct_message", data.message);
        });

        // 4. WebRTC Signaling (Video / Audio & Screen Sharing)
        socket.on("webrtc_offer", (data: { meetingId: string; targetUserId: string; sdp: any }) => {
            io.to(`user_${data.targetUserId}`).emit("webrtc_offer", {
                fromUserId: userId,
                sdp: data.sdp,
                meetingId: data.meetingId
            });
        });

        socket.on("webrtc_answer", (data: { meetingId: string; targetUserId: string; sdp: any }) => {
            io.to(`user_${data.targetUserId}`).emit("webrtc_answer", {
                fromUserId: userId,
                sdp: data.sdp,
                meetingId: data.meetingId
            });
        });

        socket.on("webrtc_ice_candidate", (data: { meetingId: string; targetUserId: string; candidate: any }) => {
            io.to(`user_${data.targetUserId}`).emit("webrtc_ice_candidate", {
                fromUserId: userId,
                candidate: data.candidate,
                meetingId: data.meetingId
            });
        });

        // 5. Interactive Classroom Real-time Events
        socket.on("raise_hand", (data: { meetingId: string; userName: string }) => {
            io.to(`meeting_${data.meetingId}`).emit("hand_raised", { userId, userName: data.userName });
        });

        socket.on("lower_hand", (data: { meetingId: string }) => {
            io.to(`meeting_${data.meetingId}`).emit("hand_lowered", { userId });
        });

        socket.on("mute_all_forced", (data: { meetingId: string }) => {
            socket.to(`meeting_${data.meetingId}`).emit("force_muted_by_host");
        });

        socket.on("live_poll_started", (data: { meetingId: string; poll: any }) => {
            io.to(`meeting_${data.meetingId}`).emit("new_live_poll", data.poll);
        });

        socket.on("whiteboard_draw", (data: { meetingId: string; stroke: any }) => {
            socket.to(`meeting_${data.meetingId}`).emit("whiteboard_stroke", data.stroke);
        });

        // 6. Handle Disconnect
        socket.on("disconnect", async () => {
            await prisma.user.update({
                where: { id: userId },
                data: { presenceStatus: "OFFLINE", lastSeenAt: new Date() }
            }).catch(() => {});

            socket.broadcast.emit("presence_change", { userId, status: "OFFLINE" });
        });
    });
};
