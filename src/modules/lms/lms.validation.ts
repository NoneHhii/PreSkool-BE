import { z } from "zod";

// 1. Course Space & Materials
export const updateSyllabusSchema = z.object({
    objectives: z.string().optional(),
    clos: z.array(z.string()).optional(), // Chuẩn đầu ra
    gradeWeights: z.record(z.string(), z.number()).optional(), // Trọng số điểm
    textbooks: z.array(z.string()).optional(), // Giáo trình bắt buộc
    description: z.string().optional()
});

export const createLmsModuleSchema = z.object({
    classId: z.string().uuid(),
    title: z.string().min(1),
    week: z.number().int().min(1),
    order: z.number().int().optional()
});

export const updateLmsModuleSchema = z.object({
    title: z.string().min(1).optional(),
    week: z.number().int().min(1).optional(),
    order: z.number().int().optional()
});

export const addMaterialSchema = z.object({
    title: z.string().min(1),
    type: z.enum(["PDF", "VIDEO", "LINK", "PPTX", "DOCX", "SCORM"]),
    url: z.string().min(1),
    description: z.string().optional(),
    prerequisiteMaterialId: z.string().uuid().optional().nullable(),
    prerequisiteQuizId: z.string().uuid().optional().nullable(),
    minQuizScore: z.number().min(0).max(10).optional().nullable(),
    unlockAt: z.string().datetime().optional().nullable()
});

export const updateMaterialSchema = addMaterialSchema.partial();

export const updateProgressSchema = z.object({
    isCompleted: z.boolean().optional(),
    progressPercent: z.number().min(0).max(100).optional()
});

// 2. Assignments & Projects
export const createAssignmentSchema = z.object({
    classId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().min(1),
    openDate: z.string().datetime().optional().nullable(),
    deadline: z.string().datetime(),
    cutOffDate: z.string().datetime().optional().nullable(),
    allowLate: z.boolean().optional(),
    isGroup: z.boolean().optional(),
    maxFileSizeMb: z.number().int().positive().optional(),
    allowedFileTypes: z.string().optional(), // vd: ".pdf,.zip"
    submissionType: z.enum(["FILE", "ONLINE_TEXT", "LINK", "HYBRID"]).optional(),
    rubric: z.any().optional()
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const createAssignmentGroupSchema = z.object({
    classId: z.string().uuid(),
    name: z.string().min(1),
    studentIds: z.array(z.string().uuid()).optional()
});

export const autoSplitGroupsSchema = z.object({
    classId: z.string().uuid(),
    groupSize: z.number().int().min(2).max(10).default(4),
    prefix: z.string().default("Nhóm")
});

export const submitAssignmentSchema = z.object({
    fileUrl: z.string().optional().nullable(),
    onlineText: z.string().optional().nullable(),
    linkUrl: z.string().optional().nullable(),
    submissionType: z.enum(["FILE", "ONLINE_TEXT", "LINK", "HYBRID"]).optional(),
    comments: z.string().optional()
});

export const gradeAssignmentSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().optional(),
    annotations: z.any().optional(),
    rubricScores: z.any().optional(),
    comments: z.string().optional()
});

// 3. Quizzes & Question Bank
export const createQuestionBankSchema = z.object({
    courseId: z.string().uuid(),
    title: z.string().min(1),
    type: z.enum(["MULTIPLE_CHOICE", "ESSAY", "ORAL", "PROJECT"]).default("MULTIPLE_CHOICE"),
    lmsType: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "MATCHING", "SHORT_ANSWER", "CODE"]).default("SINGLE_CHOICE"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).default("MEDIUM"),
    chapter: z.string().optional(),
    topic: z.string().optional(),
    content: z.string().min(1),
    options: z.any().optional(),
    answer: z.string().min(1),
    codeLanguage: z.string().optional(),
    testCases: z.any().optional()
});

export const createQuizSchema = z.object({
    classId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    openTime: z.string().datetime(),
    closeTime: z.string().datetime(),
    durationMinutes: z.number().int().positive(),
    password: z.string().optional().nullable(),
    ipRange: z.string().optional().nullable(),
    maxAttempts: z.number().int().positive().default(1),
    shuffleQuestions: z.boolean().default(true),
    shuffleOptions: z.boolean().default(true),
    passingScore: z.number().min(0).max(10).default(5.0),
    totalPoints: z.number().positive().default(10.0),
    questionMatrix: z.any().optional(), // { chapters: [...], difficulty: { EASY: 10, MEDIUM: 5, HARD: 2 } }
    questionIds: z.array(z.string().uuid()).optional()
});

export const startQuizSchema = z.object({
    password: z.string().optional()
});

export const saveQuizAnswerSchema = z.object({
    questionBankId: z.string().uuid(),
    studentAnswer: z.any()
});

export const logCheatingSchema = z.object({
    event: z.enum(["TAB_SWITCH", "BLUR", "FULLSCREEN_EXIT", "COPY_PASTE", "RIGHT_CLICK"]),
    details: z.string().optional()
});

export const reopenAttemptSchema = z.object({
    reason: z.string().min(1)
});

// 4. Forum & Virtual Classroom
export const createForumThreadSchema = z.object({
    classId: z.string().uuid(),
    moduleId: z.string().uuid().optional().nullable(),
    title: z.string().min(1),
    content: z.string().min(1),
    attachments: z.any().optional()
});

export const createForumCommentSchema = z.object({
    content: z.string().min(1),
    attachments: z.any().optional(),
    parentId: z.string().uuid().optional().nullable()
});

export const voteForumSchema = z.object({
    threadId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    vote: z.number().int().min(-1).max(1).default(1)
});

export const createVirtualClassroomSchema = z.object({
    classId: z.string().uuid(),
    title: z.string().min(1),
    platform: z.enum(["JITSI", "ZOOM", "TEAMS", "LIVEKIT"]).default("JITSI"),
    meetingUrl: z.string().min(1),
    roomPassword: z.string().optional().nullable(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional().nullable(),
    recordings: z.any().optional()
});

export const updateRecordingsSchema = z.object({
    recordings: z.array(z.object({
        title: z.string(),
        url: z.string().url(),
        duration: z.string().optional()
    }))
});

// 5. Gradebook Weights
export const updateGradeWeightsSchema = z.object({
    quizWeight: z.number().min(0).max(1),
    assignmentWeight: z.number().min(0).max(1),
    midtermWeight: z.number().min(0).max(1).optional(),
    finalWeight: z.number().min(0).max(1).optional(),
    rubricRules: z.any().optional(),
    isLocked: z.boolean().optional()
});

// 6. Announcements
export const createAnnouncementSchema = z.object({
    classId: z.string().uuid(),
    title: z.string().min(1),
    content: z.string().min(1),
    isPinned: z.boolean().default(false)
});
