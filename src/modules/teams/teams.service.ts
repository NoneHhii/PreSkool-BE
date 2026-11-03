import prisma from "../../config/prisma.ts";

// =============================================================================
// 1. KHÔNG GIAN NHÓM & KÊNH (TEAMS & CHANNELS)
// =============================================================================

export const syncTeamFromClass = async (classId: string) => {
    const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        include: {
            course: true,
            teacher: { include: { user: true } },
            students: {
                where: { registrationStatus: "ENROLLED" },
                include: { student: { include: { user: true } } }
            },
            team: true
        }
    });

    if (!classRecord) throw new Error("Class not found");
    if (classRecord.team) return classRecord.team;

    const ownerId = classRecord.teacher?.user?.id;
    if (!ownerId) throw new Error("Giảng viên lớp học phần chưa được gán tài khoản User để làm Team Owner");

    return prisma.$transaction(async (tx) => {
        // 1. Create Team
        const team = await tx.team.create({
            data: {
                name: `Lớp học phần ${classRecord.course.name} - ${classRecord.code}`,
                description: `Không gian trao đổi trực tuyến cho lớp học phần ${classRecord.course.name} (${classRecord.course.code})`,
                code: `TEAM_${classRecord.code}`,
                type: "COURSE_CLASS",
                classId: classRecord.id,
                ownerId: ownerId,
                members: {
                    create: [
                        { userId: ownerId, role: "OWNER" },
                        ...classRecord.students.map(cs => ({
                            userId: cs.student.user.id,
                            role: "MEMBER"
                        }))
                    ]
                }
            }
        });

        // 2. Create Default Channels: #General & #Q&A
        await tx.teamChannel.createMany({
            data: [
                {
                    teamId: team.id,
                    name: "general",
                    displayName: "Chung (#General)",
                    description: "Kênh thông báo chính thức và lịch học của giảng viên",
                    type: "PUBLIC",
                    isAnnouncementOnly: true // Chỉ giảng viên đăng bài mới
                },
                {
                    teamId: team.id,
                    name: "q-and-a",
                    displayName: "Hỏi đáp / Thảo luận (#Q&A)",
                    description: "Nơi sinh viên hỏi bài, thảo luận lỗi code và trao đổi học tập",
                    type: "PUBLIC",
                    isAnnouncementOnly: false
                }
            ]
        });

        return team;
    });
};

export const syncTeamFromHomeroom = async (homeroomClassId: string) => {
    const homeroom = await prisma.homeroomClass.findUnique({
        where: { id: homeroomClassId },
        include: {
            advisor: { include: { user: true } },
            students: { include: { user: true } },
            team: true
        }
    });

    if (!homeroom) throw new Error("Homeroom class not found");
    if (homeroom.team) return homeroom.team;

    const ownerId = homeroom.advisor?.user?.id;
    if (!ownerId) throw new Error("Cố vấn học tập chưa có tài khoản User để làm Team Owner");

    return prisma.$transaction(async (tx) => {
        const team = await tx.team.create({
            data: {
                name: `Lớp sinh hoạt ${homeroom.name} (${homeroom.code})`,
                description: `Không gian sinh hoạt và cố vấn học tập cho lớp ${homeroom.name}`,
                code: `TEAM_HR_${homeroom.code}`,
                type: "HOMEROOM_CLASS",
                homeroomClassId: homeroom.id,
                ownerId: ownerId,
                members: {
                    create: [
                        { userId: ownerId, role: "OWNER" },
                        ...homeroom.students.map(s => ({
                            userId: s.user.id,
                            role: "MEMBER"
                        }))
                    ]
                }
            }
        });

        await tx.teamChannel.createMany({
            data: [
                {
                    teamId: team.id,
                    name: "general",
                    displayName: "Chung (#General)",
                    description: "Kênh thông báo của Cố vấn học tập",
                    type: "PUBLIC",
                    isAnnouncementOnly: true
                },
                {
                    teamId: team.id,
                    name: "q-and-a",
                    displayName: "Hỏi đáp / Hoạt động (#Q&A)",
                    description: "Trao đổi việc lớp, điểm rèn luyện và phong trào sinh viên",
                    type: "PUBLIC",
                    isAnnouncementOnly: false
                }
            ]
        });

        return team;
    });
};

export const createCustomTeam = async (ownerId: string, data: any) => {
    return prisma.$transaction(async (tx) => {
        const team = await tx.team.create({
            data: {
                ...data,
                type: "CUSTOM",
                ownerId,
                members: {
                    create: [{ userId: ownerId, role: "OWNER" }]
                }
            }
        });

        await tx.teamChannel.create({
            data: {
                teamId: team.id,
                name: "general",
                displayName: "Chung (#General)",
                type: "PUBLIC"
            }
        });

        return team;
    });
};

export const getMyTeams = async (userId: string) => {
    return prisma.team.findMany({
        where: {
            members: { some: { userId } }
        },
        include: {
            owner: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            _count: { select: { members: true, channels: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });
};

export const getTeamDetail = async (teamId: string, userId: string) => {
    const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } }
    });
    if (!membership) throw new Error("You are not a member of this team");

    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
            owner: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            members: {
                include: {
                    user: { select: { id: true, email: true, presenceStatus: true, profile: { select: { fullName: true, avatarUrl: true } } } }
                }
            },
            channels: {
                include: {
                    members: { where: { userId } }
                }
            }
        }
    });

    if (!team) throw new Error("Team not found");

    // Filter channels: show PUBLIC channels and PRIVATE channels where user is a member or team owner
    const isOwner = team.ownerId === userId || membership.role === "OWNER";
    const accessibleChannels = team.channels.filter(ch => {
        if (ch.type === "PUBLIC") return true;
        if (isOwner) return true;
        return ch.members.length > 0;
    });

    return {
        ...team,
        channels: accessibleChannels
    };
};

export const createChannel = async (teamId: string, userId: string, data: any) => {
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true }
    });
    if (!team) throw new Error("Team not found");

    const userMember = team.members.find(m => m.userId === userId);
    if (!userMember) throw new Error("Unauthorized");

    let memberIds: string[] = data.memberIds || [];

    // If linked to an AssignmentGroup, add all group students to the private channel
    if (data.assignmentGroupId) {
        const group = await prisma.assignmentGroup.findUnique({
            where: { id: data.assignmentGroupId },
            include: { members: { include: { student: true } } }
        });
        if (group) {
            const studentUserIds = group.members.map(m => m.student.userId);
            memberIds = Array.from(new Set([...memberIds, ...studentUserIds]));
        }
    }

    // Always include creator and Team Owner
    memberIds = Array.from(new Set([...memberIds, userId, team.ownerId]));

    return prisma.teamChannel.create({
        data: {
            teamId,
            name: data.name.toLowerCase().replace(/\s+/g, '-'),
            displayName: data.displayName,
            description: data.description,
            type: data.type,
            isAnnouncementOnly: data.isAnnouncementOnly ?? false,
            assignmentGroupId: data.assignmentGroupId,
            members: data.type === "PRIVATE" ? {
                create: memberIds.map(uid => ({ userId: uid }))
            } : undefined
        },
        include: { members: true }
    });
};

// =============================================================================
// 2. PHÒNG HỌC ẢO & HỌP TRỰC TUYẾN (LIVE VIDEO CONFERENCING)
// =============================================================================

export const scheduleOrStartMeeting = async (userId: string, data: any) => {
    const roomCode = `meet-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const meetingUrl = `https://meet.preskool.edu.vn/room/${roomCode}`;

    return prisma.$transaction(async (tx) => {
        const meeting = await tx.teamMeeting.create({
            data: {
                title: data.title,
                hostId: userId,
                channelId: data.channelId,
                teamId: data.teamId,
                startTime: new Date(data.startTime),
                endTime: data.endTime ? new Date(data.endTime) : undefined,
                actualStartTime: new Date(),
                status: "LIVE",
                meetingUrl,
                roomCode,
                passcode: data.passcode
            }
        });

        // Broadcast to Activity Feed of team members
        if (data.teamId) {
            const members = await tx.teamMember.findMany({ where: { teamId: data.teamId } });
            for (const m of members) {
                if (m.userId !== userId) {
                    await tx.activityFeedItem.create({
                        data: {
                            userId: m.userId,
                            title: `Cuộc họp mới đã bắt đầu!`,
                            content: `${data.title} đang diễn ra trực tuyến`,
                            type: "MEETING_STARTED",
                            teamId: data.teamId,
                            channelId: data.channelId,
                            meetingId: meeting.id
                        }
                    });
                }
            }
        }

        return meeting;
    });
};

export const getMeetingDetail = async (meetingId: string) => {
    return prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        include: {
            host: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            handRaises: {
                where: { isLowered: false },
                include: { user: { select: { id: true, profile: { select: { fullName: true } } } } },
                orderBy: { raisedAt: 'asc' }
            },
            polls: {
                where: { isOpen: true },
                include: { votes: true }
            },
            attendances: {
                include: { user: { select: { id: true, profile: { select: { fullName: true } } } } }
            }
        }
    });
};

export const joinMeeting = async (meetingId: string, userId: string) => {
    const meeting = await prisma.teamMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new Error("Meeting not found");

    // Find student ID if user is a student
    const student = await prisma.student.findUnique({ where: { userId } });

    // Update presence to IN_A_CALL
    await prisma.user.update({
        where: { id: userId },
        data: { presenceStatus: "IN_A_CALL", lastSeenAt: new Date() }
    });

    // Record attendance log
    return prisma.meetingAttendanceLog.upsert({
        where: { meetingId_userId: { meetingId, userId } },
        update: {
            joinedAt: new Date(),
            leftAt: null
        },
        create: {
            meetingId,
            userId,
            studentId: student?.id || null,
            joinedAt: new Date()
        }
    });
};

export const leaveMeeting = async (meetingId: string, userId: string) => {
    const log = await prisma.meetingAttendanceLog.findUnique({
        where: { meetingId_userId: { meetingId, userId } }
    });

    if (log) {
        const now = new Date();
        const sessionMinutes = Math.max(1, Math.round((now.getTime() - new Date(log.joinedAt).getTime()) / 60000));
        const totalDurationMinutes = log.totalDurationMinutes + sessionMinutes;

        await prisma.meetingAttendanceLog.update({
            where: { id: log.id },
            data: {
                leftAt: now,
                totalDurationMinutes
            }
        });
    }

    // Restore user presence
    await prisma.user.update({
        where: { id: userId },
        data: { presenceStatus: "ONLINE", lastSeenAt: new Date() }
    });

    return { message: "Left meeting successfully" };
};

export const raiseHand = async (meetingId: string, userId: string) => {
    return prisma.meetingHandRaise.create({
        data: {
            meetingId,
            userId,
            isLowered: false
        }
    });
};

export const lowerHand = async (meetingId: string, userId: string) => {
    return prisma.meetingHandRaise.updateMany({
        where: { meetingId, userId, isLowered: false },
        data: { isLowered: true }
    });
};

export const getHandRaises = async (meetingId: string) => {
    return prisma.meetingHandRaise.findMany({
        where: { meetingId, isLowered: false },
        include: { user: { select: { id: true, profile: { select: { fullName: true } } } } },
        orderBy: { raisedAt: 'asc' }
    });
};

export const createLivePoll = async (meetingId: string, creatorId: string, data: any) => {
    return prisma.meetingPoll.create({
        data: {
            meetingId,
            creatorId,
            question: data.question,
            options: data.options,
            correctAnswer: data.correctAnswer
        }
    });
};

export const voteLivePoll = async (pollId: string, userId: string, selectedOption: string) => {
    return prisma.meetingPollVote.upsert({
        where: { pollId_userId: { pollId, userId } },
        update: { selectedOption, votedAt: new Date() },
        create: { pollId, userId, selectedOption }
    });
};

export const getPollResults = async (pollId: string) => {
    const poll = await prisma.meetingPoll.findUnique({
        where: { id: pollId },
        include: { votes: true }
    });
    if (!poll) throw new Error("Poll not found");

    const totalVotes = poll.votes.length;
    const distribution: Record<string, number> = {};
    const options = poll.options as string[];

    for (const opt of options) {
        distribution[opt] = 0;
    }
    for (const v of poll.votes) {
        if (distribution[v.selectedOption] !== undefined) {
            distribution[v.selectedOption]++;
        }
    }

    return {
        pollId: poll.id,
        question: poll.question,
        totalVotes,
        distribution,
        correctAnswer: poll.correctAnswer
    };
};

export const moderateMeeting = async (meetingId: string, hostId: string, data: any) => {
    const meeting = await prisma.teamMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting || meeting.hostId !== hostId) throw new Error("Only host can moderate meeting");

    return prisma.teamMeeting.update({
        where: { id: meetingId },
        data: {
            isMuteForced: data.isMuteForced !== undefined ? data.isMuteForced : undefined,
            activePresenterId: data.activePresenterId !== undefined ? data.activePresenterId : undefined,
            breakoutRooms: data.breakoutRooms !== undefined ? data.breakoutRooms : undefined
        }
    });
};

export const updateWhiteboard = async (meetingId: string, whiteboardData: any) => {
    return prisma.teamMeeting.update({
        where: { id: meetingId },
        data: { whiteboardData }
    });
};

// =============================================================================
// 3. NHẮN TIN THỜI GIAN THỰC (REAL-TIME CHAT & MESSAGING)
// =============================================================================

export const updatePresence = async (userId: string, presenceStatus: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { presenceStatus, lastSeenAt: new Date() }
    });
};

export const getOrCreateDirectConversation = async (userId: string, targetUserId: string) => {
    // Check if 1-1 conversation already exists between userId and targetUserId
    const existing = await prisma.directConversation.findFirst({
        where: {
            type: "DIRECT",
            AND: [
                { participants: { some: { userId } } },
                { participants: { some: { userId: targetUserId } } }
            ]
        },
        include: {
            participants: {
                include: { user: { select: { id: true, email: true, presenceStatus: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
            }
        }
    });

    if (existing) return existing;

    return prisma.directConversation.create({
        data: {
            type: "DIRECT",
            participants: {
                create: [
                    { userId },
                    { userId: targetUserId }
                ]
            }
        },
        include: {
            participants: {
                include: { user: { select: { id: true, email: true, presenceStatus: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
            }
        }
    });
};

export const createGroupConversation = async (userId: string, participantIds: string[], name: string) => {
    const allUserIds = Array.from(new Set([userId, ...participantIds]));
    return prisma.directConversation.create({
        data: {
            type: "GROUP",
            name,
            participants: {
                create: allUserIds.map(uid => ({ userId: uid }))
            }
        },
        include: {
            participants: {
                include: { user: { select: { id: true, email: true, presenceStatus: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
            }
        }
    });
};

export const getMyConversations = async (userId: string) => {
    const convos = await prisma.directConversation.findMany({
        where: {
            participants: { some: { userId } }
        },
        include: {
            participants: {
                include: { user: { select: { id: true, email: true, presenceStatus: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    return convos.map((c: any) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        participants: c.participants,
        lastMessage: c.messages?.[0] || null,
        updatedAt: c.updatedAt
    }));
};

export const sendDirectMessage = async (senderId: string, conversationId: string, data: any) => {
    return prisma.$transaction(async (tx) => {
        const msg = await tx.directMessage.create({
            data: {
                conversationId,
                senderId,
                content: data.content,
                codeSnippet: data.codeSnippet,
                attachments: data.attachments,
                replyToId: data.replyToId,
                mentions: data.mentions
            },
            include: {
                sender: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } }
            }
        });

        await tx.directConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        return msg;
    });
};

export const getDirectMessages = async (conversationId: string, limit: number = 50) => {
    return prisma.directMessage.findMany({
        where: { conversationId },
        include: {
            sender: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } }
        },
        orderBy: { createdAt: 'asc' },
        take: limit
    });
};

export const sendChannelMessage = async (senderId: string, channelId: string, data: any) => {
    const channel = await prisma.teamChannel.findUnique({
        where: { id: channelId },
        include: { team: { include: { members: true } } }
    });
    if (!channel) throw new Error("Channel not found");

    // If channel is announcement only and not a reply in thread, only OWNER/MODERATOR can post
    if (channel.isAnnouncementOnly && !data.replyToId) {
        const member = channel.team.members.find(m => m.userId === senderId);
        if (!member || (member.role !== "OWNER" && member.role !== "MODERATOR")) {
            throw new Error("Kênh này được cấu hình chỉ Giảng viên mới được đăng thông báo mới. Bạn chỉ có thể bình luận vào luồng bài đăng!");
        }
    }

    return prisma.$transaction(async (tx) => {
        const msg = await tx.teamMessage.create({
            data: {
                channelId,
                senderId,
                content: data.content,
                codeSnippet: data.codeSnippet,
                attachments: data.attachments,
                replyToId: data.replyToId,
                mentions: data.mentions
            },
            include: {
                sender: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } }
            }
        });

        // Activity Feed for mentions
        if (data.mentions && Array.isArray(data.mentions)) {
            for (const uid of data.mentions) {
                if (uid !== senderId) {
                    await tx.activityFeedItem.create({
                        data: {
                            userId: uid,
                            title: `Bạn được nhắc đến trong kênh ${channel.displayName}`,
                            content: data.content.substring(0, 100),
                            type: "MENTION",
                            teamId: channel.teamId,
                            channelId: channel.id
                        }
                    });
                }
            }
        }

        return msg;
    });
};

export const getChannelMessages = async (channelId: string, limit: number = 50) => {
    return prisma.teamMessage.findMany({
        where: { channelId },
        include: {
            sender: { select: { id: true, email: true, profile: { select: { fullName: true, avatarUrl: true } } } }
        },
        orderBy: { createdAt: 'asc' },
        take: limit
    });
};

export const reactToMessage = async (userId: string, messageId: string, isChannelMessage: boolean, reaction: string) => {
    if (isChannelMessage) {
        const msg = await prisma.teamMessage.findUnique({ where: { id: messageId } });
        if (!msg) throw new Error("Message not found");

        const reactions = (msg.reactions as Record<string, string[]>) || {};
        const userList = reactions[reaction] || [];
        const hasReacted = userList.includes(userId);

        if (hasReacted) {
            reactions[reaction] = userList.filter(id => id !== userId);
        } else {
            reactions[reaction] = [...userList, userId];
        }

        return prisma.teamMessage.update({
            where: { id: messageId },
            data: { reactions }
        });
    } else {
        const msg = await prisma.directMessage.findUnique({ where: { id: messageId } });
        if (!msg) throw new Error("Message not found");

        const reactions = (msg.reactions as Record<string, string[]>) || {};
        const userList = reactions[reaction] || [];
        const hasReacted = userList.includes(userId);

        if (hasReacted) {
            reactions[reaction] = userList.filter(id => id !== userId);
        } else {
            reactions[reaction] = [...userList, userId];
        }

        return prisma.directMessage.update({
            where: { id: messageId },
            data: { reactions }
        });
    }
};

export const pinMessage = async (messageId: string, isChannelMessage: boolean, isPinned: boolean) => {
    if (isChannelMessage) {
        return prisma.teamMessage.update({
            where: { id: messageId },
            data: { isPinned }
        });
    } else {
        return prisma.directMessage.update({
            where: { id: messageId },
            data: { isPinned }
        });
    }
};

// =============================================================================
// 4. GHI HÌNH BUỔI HỌC & ĐIỂM DANH TỰ ĐỘNG (RECORDING & AUTO-ATTENDANCE)
// =============================================================================

export const endMeetingAndProcessAttendance = async (meetingId: string, hostId: string, data: any) => {
    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        include: {
            team: true,
            attendances: { include: { student: true } }
        }
    });

    if (!meeting) throw new Error("Meeting not found");
    if (meeting.hostId !== hostId) throw new Error("Only host can end meeting");

    const now = new Date();
    const actualStartTime = meeting.actualStartTime || meeting.startTime;
    const meetingDuration = Math.max(1, Math.round((now.getTime() - new Date(actualStartTime).getTime()) / 60000));

    return prisma.$transaction(async (tx) => {
        // 1. Update Meeting Status & Recording
        const updatedMeeting = await tx.teamMeeting.update({
            where: { id: meetingId },
            data: {
                status: "ENDED",
                actualEndTime: now,
                recordingUrl: data.recordingUrl,
                syncedToLms: !!data.recordingUrl,
                syncedToErpAttendance: true
            }
        });

        // 2. Post Recording in Channel Chat
        if (meeting.channelId && data.recordingUrl) {
            await tx.teamMessage.create({
                data: {
                    channelId: meeting.channelId,
                    senderId: hostId,
                    content: `📹 **Video ghi hình buổi học đã sẵn sàng:** [Xem lại buổi học: ${meeting.title}](${data.recordingUrl})`,
                    attachments: [{ name: `Recording_${meeting.title}.mp4`, url: data.recordingUrl, type: "VIDEO" }]
                }
            });
        }

        // 3. Auto sync video to LMS Module if linked to an ERP Course Class
        if (meeting.team?.classId && data.recordingUrl) {
            const targetWeek = data.targetLmsWeek || 1;
            const lmsModule = await tx.lMSModule.findFirst({
                where: { classId: meeting.team.classId, week: targetWeek }
            });

            if (lmsModule) {
                await tx.lMSMaterial.create({
                    data: {
                        moduleId: lmsModule.id,
                        title: `Ghi hình buổi học trực tuyến: ${meeting.title}`,
                        type: "VIDEO",
                        url: data.recordingUrl,
                        description: `Video ghi hình lớp học online ngày ${now.toLocaleDateString('vi-VN')}`
                    }
                });
            }
        }

        // 4. Auto-Attendance: Classify status and push to ERP Attendance
        const logs = await tx.meetingAttendanceLog.findMany({
            where: { meetingId }
        });

        // Find matching ERP Schedule for today
        let scheduleId: string | null = null;
        if (meeting.team?.classId) {
            const schedule = await tx.schedule.findFirst({
                where: { classId: meeting.team.classId }
            });
            if (schedule) scheduleId = schedule.id;
        }

        for (const log of logs) {
            // Duration calculation
            let status = "PRESENT";
            const attendedRatio = log.totalDurationMinutes / meetingDuration;

            if (attendedRatio < 0.5) {
                status = "ABSENT";
            } else if (attendedRatio < 0.8) {
                status = "LATE";
            }

            // Update log
            await tx.meetingAttendanceLog.update({
                where: { id: log.id },
                data: { status }
            });

            // Push to ERP Attendance table if studentId & scheduleId exist
            if (log.studentId && scheduleId) {
                await tx.attendance.upsert({
                    where: { scheduleId_studentId: { scheduleId, studentId: log.studentId } },
                    update: {
                        status: status as any,
                        notes: `Tự động điểm danh qua MS Teams (${log.totalDurationMinutes}/${meetingDuration} phút)`
                    },
                    create: {
                        scheduleId,
                        studentId: log.studentId,
                        status: status as any,
                        notes: `Tự động điểm danh qua MS Teams (${log.totalDurationMinutes}/${meetingDuration} phút)`
                    }
                });
            }
        }

        return {
            meeting: updatedMeeting,
            meetingDurationMinutes: meetingDuration,
            attendanceLogsCount: logs.length,
            message: "Buổi học kết thúc. Đã xuất báo cáo điểm danh và đồng bộ tự động sang ERP & LMS!"
        };
    });
};

export const getMeetingAttendanceReport = async (meetingId: string) => {
    const meeting = await prisma.teamMeeting.findUnique({
        where: { id: meetingId },
        include: {
            attendances: {
                include: {
                    user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
                    student: { select: { studentCode: true } }
                }
            }
        }
    });

    if (!meeting) throw new Error("Meeting not found");

    const actualStartTime = meeting.actualStartTime || meeting.startTime;
    const actualEndTime = meeting.actualEndTime || new Date();
    const durationMinutes = Math.max(1, Math.round((actualEndTime.getTime() - new Date(actualStartTime).getTime()) / 60000));

    return {
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        durationMinutes,
        recordingUrl: meeting.recordingUrl,
        attendances: meeting.attendances.map(a => ({
            userId: a.userId,
            fullName: a.user.profile?.fullName,
            studentCode: a.student?.studentCode || "N/A",
            joinedAt: a.joinedAt,
            leftAt: a.leftAt,
            totalDurationMinutes: a.totalDurationMinutes,
            presencePercent: Math.min(100, Math.round((a.totalDurationMinutes / durationMinutes) * 100)),
            status: a.status
        }))
    };
};

// =============================================================================
// 5. KHÔNG GIAN LÀM VIỆC NHÓM & TỆP (SHARED FILES & KANBAN TASKS)
// =============================================================================

export const getChannelFiles = async (channelId: string) => {
    return prisma.teamFile.findMany({
        where: { channelId },
        include: {
            uploader: { select: { id: true, email: true, profile: { select: { fullName: true } } } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const uploadChannelFile = async (channelId: string, uploaderId: string, data: any) => {
    return prisma.teamFile.create({
        data: {
            channelId,
            uploaderId,
            name: data.name,
            url: data.url,
            sizeBytes: data.sizeBytes,
            mimeType: data.mimeType,
            folder: data.folder || "General"
        }
    });
};

export const createTask = async (channelId: string, creatorId: string, data: any) => {
    return prisma.$transaction(async (tx) => {
        const task = await tx.teamTask.create({
            data: {
                channelId,
                creatorId,
                title: data.title,
                description: data.description,
                status: data.status || "TODO",
                priority: data.priority || "MEDIUM",
                assigneeId: data.assigneeId,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined
            },
            include: {
                assignee: { select: { id: true, profile: { select: { fullName: true } } } },
                creator: { select: { id: true, profile: { select: { fullName: true } } } }
            }
        });

        if (data.assigneeId && data.assigneeId !== creatorId) {
            await tx.activityFeedItem.create({
                data: {
                    userId: data.assigneeId,
                    title: `Bạn được giao công việc mới`,
                    content: `Công việc: "${data.title}" trong kênh`,
                    type: "TASK_ASSIGNED",
                    channelId
                }
            });
        }

        return task;
    });
};

export const getChannelTasks = async (channelId: string) => {
    const tasks = await prisma.teamTask.findMany({
        where: { channelId },
        include: {
            assignee: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            creator: { select: { id: true, profile: { select: { fullName: true } } } }
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    // Group by status for Kanban Board
    const kanban = {
        TODO: tasks.filter(t => t.status === "TODO"),
        IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
        REVIEW: tasks.filter(t => t.status === "REVIEW"),
        DONE: tasks.filter(t => t.status === "DONE")
    };

    return kanban;
};

export const updateTask = async (taskId: string, data: any) => {
    return prisma.teamTask.update({
        where: { id: taskId },
        data: {
            ...data,
            dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined
        },
        include: {
            assignee: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } }
        }
    });
};

export const deleteTask = async (taskId: string) => {
    return prisma.teamTask.delete({ where: { id: taskId } });
};

// =============================================================================
// 6. LỊCH HỌC TRỰC TUYẾN & ACTIVITY FEED (CALENDAR & NOTIFICATIONS)
// =============================================================================

export const getUnifiedCalendar = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            student: true,
            teacher: true
        }
    });

    const events: any[] = [];

    // 1. Online meetings from user's teams
    const meetings = await prisma.teamMeeting.findMany({
        where: {
            OR: [
                { hostId: userId },
                { team: { members: { some: { userId } } } }
            ]
        },
        include: {
            team: true,
            channel: true,
            _count: { select: { attendances: true } }
        },
        orderBy: { startTime: 'asc' }
    });

    for (const m of meetings) {
        events.push({
            id: m.id,
            type: "ONLINE_CLASS",
            title: m.title,
            teamName: m.team?.name,
            channelName: m.channel?.displayName,
            startTime: m.startTime,
            endTime: m.endTime,
            meetingUrl: m.meetingUrl,
            status: m.status, // LIVE -> shows "Join Now"
            participantsCount: m._count.attendances
        });
    }

    // 2. Class schedules from ERP if student or teacher
    if (user?.student) {
        const enrollments = await prisma.classStudent.findMany({
            where: { studentId: user.student.id, registrationStatus: "ENROLLED" },
            include: { class: { include: { course: true, schedules: true } } }
        });

        for (const enr of enrollments) {
            for (const sc of enr.class.schedules) {
                events.push({
                    type: "IN_PERSON_SCHEDULE",
                    title: `Lịch học: ${enr.class.course.name}`,
                    date: sc.date,
                    shift: sc.shift,
                    room: sc.room
                });
            }
        }
    }

    // 3. Office Hour Appointments
    const appointments = await prisma.officeHourAppointment.findMany({
        where: {
            OR: [
                { student: { userId } },
                { teacher: { userId } }
            ]
        },
        include: {
            student: { include: { user: { include: { profile: true } } } },
            teacher: { include: { user: { include: { profile: true } } } }
        }
    });

    for (const appt of appointments) {
        events.push({
            id: appt.id,
            type: "APPOINTMENT",
            title: `Tư vấn 1-1: ${appt.title}`,
            topic: appt.topic,
            date: appt.appointmentDate,
            time: `${appt.startTime} - ${appt.endTime}`,
            status: appt.status,
            meetingUrl: appt.meetingUrl,
            withUser: user?.student ? appt.teacher.user.profile?.fullName : appt.student.user.profile?.fullName
        });
    }

    return events;
};

export const bookOfficeHourAppointment = async (studentUserId: string, data: any) => {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) throw new Error("Only students can book appointments");

    return prisma.$transaction(async (tx) => {
        const appt = await tx.officeHourAppointment.create({
            data: {
                studentId: student.id,
                teacherId: data.teacherId,
                title: data.title,
                topic: data.topic,
                appointmentDate: new Date(data.appointmentDate),
                startTime: data.startTime,
                endTime: data.endTime,
                notes: data.notes,
                status: "PENDING"
            }
        });

        const teacher = await tx.teacher.findUnique({ where: { id: data.teacherId } });
        if (teacher) {
            await tx.activityFeedItem.create({
                data: {
                    userId: teacher.userId,
                    title: "Yêu cầu hẹn tư vấn 1-1 mới",
                    content: `Sinh viên đặt lịch hẹn: "${data.title}" vào ngày ${data.appointmentDate}`,
                    type: "APPOINTMENT"
                }
            });
        }

        return appt;
    });
};

export const respondToAppointment = async (appointmentId: string, teacherUserId: string, status: string, meetingUrl?: string, notes?: string) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUserId } });
    if (!teacher) throw new Error("Only teachers can respond to appointments");

    const appt = await prisma.officeHourAppointment.findUnique({
        where: { id: appointmentId },
        include: { student: true }
    });
    if (!appt || appt.teacherId !== teacher.id) throw new Error("Unauthorized");

    const updated = await prisma.officeHourAppointment.update({
        where: { id: appointmentId },
        data: {
            status,
            meetingUrl: meetingUrl || appt.meetingUrl,
            notes: notes || appt.notes
        }
    });

    // Notify student
    await prisma.activityFeedItem.create({
        data: {
            userId: appt.student.userId,
            title: `Lịch hẹn tư vấn đã được cập nhật: ${status}`,
            content: `Giảng viên đã phản hồi yêu cầu hẹn tư vấn "${appt.title}"`,
            type: "APPOINTMENT"
        }
    });

    return updated;
};

export const getMyAppointments = async (userId: string) => {
    return prisma.officeHourAppointment.findMany({
        where: {
            OR: [
                { student: { userId } },
                { teacher: { userId } }
            ]
        },
        include: {
            student: { include: { user: { include: { profile: true } } } },
            teacher: { include: { user: { include: { profile: true } } } }
        },
        orderBy: { appointmentDate: 'desc' }
    });
};

export const getActivityFeed = async (userId: string) => {
    return prisma.activityFeedItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
};

export const markActivityFeedRead = async (itemId: string, userId: string) => {
    return prisma.activityFeedItem.update({
        where: { id: itemId },
        data: { isRead: true }
    });
};
