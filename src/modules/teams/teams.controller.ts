import type { Request, Response } from "express";
import * as teamsService from "./teams.service.ts";
import * as validation from "./teams.validation.ts";

// =============================================================================
// 1. TEAMS & CHANNELS
// =============================================================================

export const syncTeam = async (req: Request, res: Response) => {
    try {
        const { classId, homeroomClassId } = req.body;
        if (classId) {
            const team = await teamsService.syncTeamFromClass(classId);
            return res.status(200).json({ message: "Team synced from Course Class", data: team });
        } else if (homeroomClassId) {
            const team = await teamsService.syncTeamFromHomeroom(homeroomClassId);
            return res.status(200).json({ message: "Team synced from Homeroom Class", data: team });
        } else {
            return res.status(400).json({ message: "classId or homeroomClassId is required" });
        }
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createCustomTeam = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = validation.createCustomTeamSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const team = await teamsService.createCustomTeam(userId, result.data);
        return res.status(201).json({ message: "Custom team created", data: team });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMyTeams = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const teams = await teamsService.getMyTeams(userId);
        return res.status(200).json({ message: "Success", data: teams });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getTeamDetail = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const teamId = req.params.teamId as string;
        const detail = await teamsService.getTeamDetail(teamId, userId);
        return res.status(200).json({ message: "Success", data: detail });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createChannel = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const teamId = req.params.teamId as string;
        const result = validation.createChannelSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const channel = await teamsService.createChannel(teamId, userId, result.data);
        return res.status(201).json({ message: "Channel created", data: channel });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 2. VIDEO CONFERENCING & INTERACTIVE TOOLS
// =============================================================================

export const scheduleMeeting = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = validation.scheduleMeetingSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const meeting = await teamsService.scheduleOrStartMeeting(userId, result.data);
        return res.status(201).json({ message: "Meeting scheduled", data: meeting });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMeetingDetail = async (req: Request, res: Response) => {
    try {
        const meetingId = req.params.meetingId as string;
        const meeting = await teamsService.getMeetingDetail(meetingId);
        return res.status(200).json({ message: "Success", data: meeting });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const joinMeeting = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const meetingId = req.params.meetingId as string;
        const log = await teamsService.joinMeeting(meetingId, userId);
        return res.status(200).json({ message: "Joined meeting", data: log });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const leaveMeeting = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const meetingId = req.params.meetingId as string;
        const response = await teamsService.leaveMeeting(meetingId, userId);
        return res.status(200).json(response);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const raiseHand = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const meetingId = req.params.meetingId as string;
        const hand = await teamsService.raiseHand(meetingId, userId);
        return res.status(201).json({ message: "Hand raised", data: hand });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const lowerHand = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const meetingId = req.params.meetingId as string;
        await teamsService.lowerHand(meetingId, userId);
        return res.status(200).json({ message: "Hand lowered" });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getHandRaises = async (req: Request, res: Response) => {
    try {
        const meetingId = req.params.meetingId as string;
        const hands = await teamsService.getHandRaises(meetingId);
        return res.status(200).json({ message: "Success", data: hands });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createLivePoll = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const meetingId = req.params.meetingId as string;
        const result = validation.createLivePollSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const poll = await teamsService.createLivePoll(meetingId, userId, result.data);
        return res.status(201).json({ message: "Poll created", data: poll });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const voteLivePoll = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const pollId = req.params.pollId as string;
        const result = validation.votePollSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const vote = await teamsService.voteLivePoll(pollId, userId, result.data.selectedOption);
        return res.status(200).json({ message: "Vote recorded", data: vote });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getPollResults = async (req: Request, res: Response) => {
    try {
        const pollId = req.params.pollId as string;
        const results = await teamsService.getPollResults(pollId);
        return res.status(200).json({ message: "Success", data: results });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const moderateMeeting = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
        const meetingId = req.params.meetingId as string;
        const result = validation.moderateMeetingSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const moderated = await teamsService.moderateMeeting(meetingId, hostId, result.data);
        return res.status(200).json({ message: "Meeting updated", data: moderated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateWhiteboard = async (req: Request, res: Response) => {
    try {
        const meetingId = req.params.meetingId as string;
        const result = validation.updateWhiteboardSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await teamsService.updateWhiteboard(meetingId, result.data.whiteboardData);
        return res.status(200).json({ message: "Whiteboard saved", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 3. REAL-TIME CHAT & DIRECT MESSAGING
// =============================================================================

export const updatePresence = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = validation.updatePresenceSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await teamsService.updatePresence(userId, result.data.status);
        return res.status(200).json({ message: "Presence updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getOrCreateDirectConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = validation.createDirectConversationSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const convo = await teamsService.getOrCreateDirectConversation(userId, result.data.targetUserId);
        return res.status(200).json({ message: "Success", data: convo });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createGroupConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = validation.createGroupConversationSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const convo = await teamsService.createGroupConversation(userId, result.data.participantIds, result.data.name);
        return res.status(201).json({ message: "Group chat created", data: convo });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMyConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const convos = await teamsService.getMyConversations(userId);
        return res.status(200).json({ message: "Success", data: convos });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const sendDirectMessage = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.id;
        const conversationId = req.params.conversationId as string;
        const result = validation.sendMessageSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const msg = await teamsService.sendDirectMessage(senderId, conversationId, result.data);
        return res.status(201).json({ message: "Message sent", data: msg });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getDirectMessages = async (req: Request, res: Response) => {
    try {
        const conversationId = req.params.conversationId as string;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const messages = await teamsService.getDirectMessages(conversationId, limit);
        return res.status(200).json({ message: "Success", data: messages });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const sendChannelMessage = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.id;
        const channelId = req.params.channelId as string;
        const result = validation.sendMessageSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const msg = await teamsService.sendChannelMessage(senderId, channelId, result.data);
        return res.status(201).json({ message: "Channel message posted", data: msg });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getChannelMessages = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.channelId as string;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const messages = await teamsService.getChannelMessages(channelId, limit);
        return res.status(200).json({ message: "Success", data: messages });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const reactToMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const messageId = req.params.messageId as string;
        const isChannel = req.query.isChannel === "true";
        const result = validation.reactMessageSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await teamsService.reactToMessage(userId, messageId, isChannel, result.data.reaction);
        return res.status(200).json({ message: "Reaction updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const pinMessage = async (req: Request, res: Response) => {
    try {
        const messageId = req.params.messageId as string;
        const isChannel = req.query.isChannel === "true";
        const isPinned = req.body.isPinned ?? true;

        const updated = await teamsService.pinMessage(messageId, isChannel, isPinned);
        return res.status(200).json({ message: "Pin status updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 4. RECORDING & AUTO-ATTENDANCE
// =============================================================================

export const endMeeting = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
        const meetingId = req.params.meetingId as string;
        const result = validation.endMeetingSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const outcome = await teamsService.endMeetingAndProcessAttendance(meetingId, hostId, result.data);
        return res.status(200).json(outcome);
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMeetingAttendanceReport = async (req: Request, res: Response) => {
    try {
        const meetingId = req.params.meetingId as string;
        const report = await teamsService.getMeetingAttendanceReport(meetingId);
        return res.status(200).json({ message: "Success", data: report });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 5. KANBAN TASKS & SHARED FILES
// =============================================================================

export const getChannelFiles = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.channelId as string;
        const files = await teamsService.getChannelFiles(channelId);
        return res.status(200).json({ message: "Success", data: files });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const uploadChannelFile = async (req: Request, res: Response) => {
    try {
        const uploaderId = (req as any).user.id;
        const channelId = req.params.channelId as string;
        const result = validation.uploadFileRecordSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const fileRecord = await teamsService.uploadChannelFile(channelId, uploaderId, result.data);
        return res.status(201).json({ message: "File registered", data: fileRecord });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const creatorId = (req as any).user.id;
        const channelId = req.params.channelId as string;
        const result = validation.createTaskSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const task = await teamsService.createTask(channelId, creatorId, result.data);
        return res.status(201).json({ message: "Task created", data: task });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getChannelTasks = async (req: Request, res: Response) => {
    try {
        const channelId = req.params.channelId as string;
        const kanban = await teamsService.getChannelTasks(channelId);
        return res.status(200).json({ message: "Success", data: kanban });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId as string;
        const result = validation.updateTaskSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await teamsService.updateTask(taskId, result.data);
        return res.status(200).json({ message: "Task updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId as string;
        await teamsService.deleteTask(taskId);
        return res.status(200).json({ message: "Task deleted" });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// 6. CALENDAR & APPOINTMENTS
// =============================================================================

export const getUnifiedCalendar = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const calendar = await teamsService.getUnifiedCalendar(userId);
        return res.status(200).json({ message: "Success", data: calendar });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const bookAppointment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = validation.bookAppointmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const appt = await teamsService.bookOfficeHourAppointment(userId, result.data);
        return res.status(201).json({ message: "Appointment requested", data: appt });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const respondAppointment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const appointmentId = req.params.appointmentId as string;
        const result = validation.respondAppointmentSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });

        const updated = await teamsService.respondToAppointment(
            appointmentId,
            userId,
            result.data.status,
            result.data.meetingUrl,
            result.data.notes
        );
        return res.status(200).json({ message: "Appointment updated", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getMyAppointments = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const appts = await teamsService.getMyAppointments(userId);
        return res.status(200).json({ message: "Success", data: appts });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getActivityFeed = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const feed = await teamsService.getActivityFeed(userId);
        return res.status(200).json({ message: "Success", data: feed });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const markActivityFeedRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const itemId = req.params.id as string;
        const updated = await teamsService.markActivityFeedRead(itemId, userId);
        return res.status(200).json({ message: "Marked as read", data: updated });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
