import { z } from "zod";

// =============================================================================
// 1. TEAMS & CHANNELS
// =============================================================================
export const syncTeamSchema = z.object({
    classId: z.string().uuid().optional(),
    homeroomClassId: z.string().uuid().optional()
});

export const createCustomTeamSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    code: z.string().optional(),
    avatarUrl: z.string().optional()
});

export const addTeamMemberSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(["OWNER", "MODERATOR", "MEMBER"]).default("MEMBER")
});

export const createChannelSchema = z.object({
    name: z.string().min(1),
    displayName: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
    isAnnouncementOnly: z.boolean().default(false),
    assignmentGroupId: z.string().uuid().optional(),
    memberIds: z.array(z.string().uuid()).optional() // For private channels
});

// =============================================================================
// 2. VIDEO CONFERENCING & INTERACTIVE TOOLS
// =============================================================================
export const scheduleMeetingSchema = z.object({
    channelId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    title: z.string().min(1),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    passcode: z.string().optional()
});

export const moderateMeetingSchema = z.object({
    isMuteForced: z.boolean().optional(),
    activePresenterId: z.string().uuid().optional().nullable(),
    breakoutRooms: z.array(z.object({
        id: z.string(),
        name: z.string(),
        members: z.array(z.string().uuid())
    })).optional()
});

export const createLivePollSchema = z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correctAnswer: z.string().optional()
});

export const votePollSchema = z.object({
    selectedOption: z.string().min(1)
});

export const updateWhiteboardSchema = z.object({
    whiteboardData: z.any()
});

// =============================================================================
// 3. REAL-TIME CHAT & DIRECT MESSAGING
// =============================================================================
export const updatePresenceSchema = z.object({
    status: z.enum(["ONLINE", "IN_A_CALL", "BUSY", "AWAY", "OFFLINE"])
});

export const createDirectConversationSchema = z.object({
    targetUserId: z.string().uuid()
});

export const createGroupConversationSchema = z.object({
    name: z.string().min(1),
    participantIds: z.array(z.string().uuid()).min(2)
});

export const sendMessageSchema = z.object({
    content: z.string().min(1),
    codeSnippet: z.object({
        language: z.string(),
        code: z.string()
    }).optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        size: z.number().optional(),
        type: z.string().optional()
    })).optional(),
    replyToId: z.string().uuid().optional(),
    mentions: z.array(z.string().uuid()).optional()
});

export const reactMessageSchema = z.object({
    reaction: z.string().min(1) // e.g. "👍", "❤️", "😂"
});

export const pinMessageSchema = z.object({
    isPinned: z.boolean().default(true)
});

// =============================================================================
// 4. RECORDING & AUTO-ATTENDANCE
// =============================================================================
export const endMeetingSchema = z.object({
    recordingUrl: z.string().url().optional(),
    targetLmsWeek: z.number().int().min(1).optional() // Tự động gắn link vào tuần LMS
});

// =============================================================================
// 5. KANBAN TASKS & SHARED FILES
// =============================================================================
export const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).default("TODO"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable()
});

export const updateTaskSchema = createTaskSchema.partial().extend({
    order: z.number().int().optional()
});

export const uploadFileRecordSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    sizeBytes: z.number().int().optional(),
    mimeType: z.string().optional(),
    folder: z.string().default("General")
});

// =============================================================================
// 6. CALENDAR & APPOINTMENTS
// =============================================================================
export const bookAppointmentSchema = z.object({
    teacherId: z.string().uuid(),
    title: z.string().min(1),
    topic: z.string().optional(),
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    notes: z.string().optional()
});

export const respondAppointmentSchema = z.object({
    status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
    meetingUrl: z.string().url().optional(),
    notes: z.string().optional()
});
