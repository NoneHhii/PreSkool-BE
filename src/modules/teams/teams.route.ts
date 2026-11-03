import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as teamsController from "./teams.controller.ts";

const router = Router();

router.use(authenticate);

// =============================================================================
// 1. TEAMS & CHANNELS
// =============================================================================
router.post("/sync", requireRole("TEACHER", "ADMIN"), teamsController.syncTeam);
router.post("/custom", teamsController.createCustomTeam);
router.get("/my", teamsController.getMyTeams);
router.get("/:teamId", teamsController.getTeamDetail);
router.post("/:teamId/channels", teamsController.createChannel);

// =============================================================================
// 2. VIDEO CONFERENCING & INTERACTIVE TOOLS
// =============================================================================
router.post("/meetings", requireRole("TEACHER", "ADMIN"), teamsController.scheduleMeeting);
router.get("/meetings/:meetingId", teamsController.getMeetingDetail);
router.post("/meetings/:meetingId/join", teamsController.joinMeeting);
router.post("/meetings/:meetingId/leave", teamsController.leaveMeeting);
router.post("/meetings/:meetingId/raise-hand", teamsController.raiseHand);
router.post("/meetings/:meetingId/lower-hand", teamsController.lowerHand);
router.get("/meetings/:meetingId/hands", teamsController.getHandRaises);

router.post("/meetings/:meetingId/polls", requireRole("TEACHER", "ADMIN"), teamsController.createLivePoll);
router.post("/polls/:pollId/vote", teamsController.voteLivePoll);
router.get("/polls/:pollId/results", teamsController.getPollResults);

router.put("/meetings/:meetingId/moderate", requireRole("TEACHER", "ADMIN"), teamsController.moderateMeeting);
router.put("/meetings/:meetingId/whiteboard", teamsController.updateWhiteboard);

// =============================================================================
// 3. RECORDING & AUTO-ATTENDANCE
// =============================================================================
router.post("/meetings/:meetingId/end", requireRole("TEACHER", "ADMIN"), teamsController.endMeeting);
router.get("/meetings/:meetingId/attendance-report", requireRole("TEACHER", "ADMIN"), teamsController.getMeetingAttendanceReport);

// =============================================================================
// 4. REAL-TIME CHAT & DIRECT MESSAGING
// =============================================================================
router.put("/presence", teamsController.updatePresence);
router.post("/conversations/direct", teamsController.getOrCreateDirectConversation);
router.post("/conversations/group", teamsController.createGroupConversation);
router.get("/conversations", teamsController.getMyConversations);
router.post("/conversations/:conversationId/messages", teamsController.sendDirectMessage);
router.get("/conversations/:conversationId/messages", teamsController.getDirectMessages);

router.post("/channels/:channelId/messages", teamsController.sendChannelMessage);
router.get("/channels/:channelId/messages", teamsController.getChannelMessages);

router.post("/messages/:messageId/react", teamsController.reactToMessage);
router.put("/messages/:messageId/pin", teamsController.pinMessage);

// =============================================================================
// 5. SHARED FILES & KANBAN TASKS
// =============================================================================
router.get("/channels/:channelId/files", teamsController.getChannelFiles);
router.post("/channels/:channelId/files", teamsController.uploadChannelFile);

router.post("/channels/:channelId/tasks", teamsController.createTask);
router.get("/channels/:channelId/tasks", teamsController.getChannelTasks);
router.put("/tasks/:taskId", teamsController.updateTask);
router.delete("/tasks/:taskId", teamsController.deleteTask);

// =============================================================================
// 6. CALENDAR & APPOINTMENTS & ACTIVITY FEED
// =============================================================================
router.get("/calendar", teamsController.getUnifiedCalendar);
router.post("/appointments", requireRole("STUDENT"), teamsController.bookAppointment);
router.put("/appointments/:appointmentId/respond", requireRole("TEACHER", "ADMIN"), teamsController.respondAppointment);
router.get("/appointments", teamsController.getMyAppointments);

router.get("/activity-feed", teamsController.getActivityFeed);
router.put("/activity-feed/:id/read", teamsController.markActivityFeedRead);

export default router;
