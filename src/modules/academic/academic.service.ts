import prisma from "../../config/prisma.ts";

// Faculty
export const getFaculties = async () => {
    return prisma.faculty.findMany({
        include: { majors: true }
    });
};

export const createFaculty = async (data: any) => {
    return prisma.faculty.create({
        data,
    });
};

// Major
export const getMajors = async () => {
    return prisma.major.findMany({
        include: { faculty: true }
    });
};

export const createMajor = async (data: any) => {
    return prisma.major.create({
        data,
    });
};

// Course
export const getCourses = async () => {
    return prisma.course.findMany({
        include: { prerequisites: true }
    });
};

export const createCourse = async (data: any) => {
    const { prerequisites, ...courseData } = data;
    return prisma.course.create({
        data: {
            ...courseData,
            prerequisites: prerequisites && prerequisites.length > 0 ? {
                connect: prerequisites.map((id: string) => ({ id }))
            } : undefined
        },
    });
};

// Class
export const getClasses = async () => {
    return prisma.class.findMany({
        include: {
            course: true,
            teacher: {
                include: { user: { include: { profile: true } } }
            },
            students: {
                include: { student: { include: { user: { include: { profile: true } } } } }
            }
        }
    });
};

export const createClass = async (data: any) => {
    return prisma.class.create({
        data,
    });
};

export const assignStudentsToClass = async (classId: string, studentIds: string[]) => {
    const dataToInsert = studentIds.map(studentId => ({
        classId,
        studentId
    }));
    
    await prisma.classStudent.createMany({
        data: dataToInsert,
        skipDuplicates: true // Ignore if already assigned
    });
    
    return { success: true, count: studentIds.length };
};

// Schedule
export const getSchedule = async (userId: string, role: string) => {
    // If student, get schedule of their classes
    if (role === "STUDENT") {
        const student = await prisma.student.findUnique({ where: { userId } });
        if (!student) throw new Error("Student not found");
        
        const classStudents = await prisma.classStudent.findMany({
            where: { studentId: student.id },
            select: { classId: true }
        });
        
        const classIds = classStudents.map((cs: { classId: string }) => cs.classId);
        
        return prisma.schedule.findMany({
            where: { classId: { in: classIds } },
            include: { class: { include: { course: true } } },
            orderBy: { date: 'asc' }
        });
    }
    
    // If teacher, get schedule of classes they teach
    if (role === "TEACHER") {
        const teacher = await prisma.teacher.findUnique({ where: { userId } });
        if (!teacher) throw new Error("Teacher not found");
        
        return prisma.schedule.findMany({
            where: { class: { teacherId: teacher.id } },
            include: { class: { include: { course: true } } },
            orderBy: { date: 'asc' }
        });
    }
    
    // If admin, return all or require specific filters. Returning all for now.
    return prisma.schedule.findMany({
        include: { class: { include: { course: true } } },
        orderBy: { date: 'asc' }
    });
};

export const addSchedule = async (data: any) => {
    return prisma.schedule.create({
        data: {
            classId: data.classId,
            date: new Date(data.date),
            shift: data.shift,
            room: data.room
        }
    });
};

// Attendance
export const markAttendance = async (data: any) => {
    return prisma.attendance.upsert({
        where: {
            scheduleId_studentId: {
                scheduleId: data.scheduleId,
                studentId: data.studentId
            }
        },
        update: {
            status: data.status,
            notes: data.notes
        },
        create: {
            scheduleId: data.scheduleId,
            studentId: data.studentId,
            status: data.status,
            notes: data.notes
        }
    });
};

export const getStudentAttendanceStats = async (studentId: string) => {
    const records = await prisma.attendance.findMany({
        where: { studentId }
    });
    
    const stats: Record<string, number> = {
        PRESENT: 0,
        ABSENT: 0,
        EXCUSED: 0,
        LATE: 0,
        total: records.length
    };
    
    records.forEach((record: any) => {
        stats[record.status]++;
    });
    
    return {
        stats,
        records
    };
};

// Utilities for UI Lookups
export const getStudents = async () => {
    return prisma.student.findMany({
        include: {
            user: {
                include: {
                    profile: true
                }
            }
        }
    });
};

export const getTeachers = async () => {
    return prisma.teacher.findMany({
        include: {
            user: {
                include: {
                    profile: true
                }
            }
        }
    });
};

export const getUnassignedStudents = async (cohort?: string, majorId?: string, courseId?: string) => {
    // Build where clause
    const where: any = {};
    if (cohort) where.cohort = cohort;
    if (majorId) where.majorId = majorId;
    
    // If courseId is provided, exclude students who are already in a class for this course
    if (courseId) {
        where.classes = {
            none: {
                class: {
                    courseId: courseId
                }
            }
        };
    } else {
        // If no courseId, exclude students who are in ANY class (for generic assignment)
        where.classes = {
            none: {}
        };
    }

    return prisma.student.findMany({
        where,
        include: {
            user: {
                include: {
                    profile: true
                }
            },
            major: true
        }
    });
};

export const autoAssignClasses = async (data: any) => {
    const { courseId, academicYear, semester, studentIds, numberOfClasses } = data;
    
    // 1. Get course to generate class names (e.g. CS101202601)
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error("Course not found");
    
    // Calculate year string for naming (e.g. "2026-2027" -> "2026")
    const yearPrefix = academicYear.substring(0, 4);

    // Get current max index for this course/year to avoid duplicate codes
    const existingClasses = await prisma.class.count({
        where: {
            courseId,
            academicYear
        }
    });

    const studentsPerClass = Math.ceil(studentIds.length / numberOfClasses);
    const createdClasses = [];
    let currentStudentIndex = 0;

    for (let i = 0; i < numberOfClasses; i++) {
        // Format index as 2 digits, e.g. 01, 02
        const classIndex = (existingClasses + i + 1).toString().padStart(2, '0');
        const classCode = `${course.code}${yearPrefix}${classIndex}`;
        
        // 2. Create class
        const newClass = await prisma.class.create({
            data: {
                code: classCode,
                courseId,
                academicYear,
                semester
            }
        });
        createdClasses.push(newClass);
        
        // 3. Assign students to this chunk
        const chunk = studentIds.slice(currentStudentIndex, currentStudentIndex + studentsPerClass);
        if (chunk.length > 0) {
            const dataToInsert = chunk.map((studentId: string) => ({
                classId: newClass.id,
                studentId
            }));
            
            await prisma.classStudent.createMany({
                data: dataToInsert
            });
        }
        currentStudentIndex += studentsPerClass;
    }
    
    return {
        message: "Auto assigned successfully",
        classesCreated: createdClasses.length,
        studentsAssigned: studentIds.length,
        classes: createdClasses
    };
};

// --- Homeroom Classes ---
export const getHomeroomClasses = async () => {
    return prisma.homeroomClass.findMany({
        include: {
            major: true,
            advisor: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            }
        }
    });
};

export const createHomeroomClass = async (data: any) => {
    return prisma.homeroomClass.create({
        data
    });
};

export const assignHomeroomToClass = async (courseClassId: string, homeroomClassId: string) => {
    // 1. Get all students from this homeroom class
    const homeroom = await prisma.homeroomClass.findUnique({
        where: { id: homeroomClassId },
        include: { students: true }
    });

    if (!homeroom) {
        throw new Error("Homeroom class not found");
    }

    // 2. Format data for bulk insert
    const studentIds = homeroom.students.map((s: any) => s.id);
    const dataToInsert = studentIds.map((studentId: string) => ({
        classId: courseClassId,
        studentId
    }));

    if (dataToInsert.length === 0) {
        return { message: "No students in this homeroom class to assign", assignedCount: 0 };
    }

    // 3. Insert ignoring duplicates (skipDuplicates not supported natively for all DBs in createMany, but Postgres handles it if we use standard insert, wait, we can just do createMany with skipDuplicates)
    const result = await prisma.classStudent.createMany({
        data: dataToInsert,
        skipDuplicates: true // Works on PostgreSQL and MySQL
    });

    return {
        message: `Assigned ${result.count} students from ${homeroom.name} to the course class`,
        assignedCount: result.count
    };
};

export const getUnassignedHomeroomStudents = async (cohort?: string, majorId?: string) => {
    const whereClause: any = {
        homeroomClassId: null, // Only students without a homeroom class
        role: "STUDENT"
    };

    if (cohort) whereClause.cohort = cohort;
    if (majorId) whereClause.majorId = majorId;

    return prisma.student.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    username: true,
                    email: true,
                    profile: {
                        select: { fullName: true }
                    }
                }
            }
        }
    });
};

export const autoAssignHomerooms = async (data: {
    majorId: string;
    cohort: string;
    studentIds: string[];
    numberOfClasses: number;
    prefix: string;
    suffix?: string;
}) => {
    const { majorId, cohort, studentIds, numberOfClasses, prefix, suffix } = data;
    
    if (studentIds.length === 0) throw new Error("No students provided");
    if (numberOfClasses <= 0) throw new Error("Number of classes must be greater than 0");

    const studentsPerClass = Math.ceil(studentIds.length / numberOfClasses);
    let currentStudentIndex = 0;
    const createdClasses = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < numberOfClasses; i++) {
        const char = alphabet[i % 26]; // A, B, C...
        const classCode = `${prefix}${char}${suffix || ""}`; // e.g. DHKTPM18A or DHKTPM18ATT
        const className = `Lớp ${classCode}`;

        // 1. Create Homeroom Class
        let homeroomClass = await prisma.homeroomClass.findUnique({ where: { code: classCode } });
        if (!homeroomClass) {
            homeroomClass = await prisma.homeroomClass.create({
                data: {
                    code: classCode,
                    name: className,
                    majorId,
                    cohort,
                }
            });
        }
        createdClasses.push(homeroomClass);
        
        // 2. Assign students to this chunk
        const chunk = studentIds.slice(currentStudentIndex, currentStudentIndex + studentsPerClass);
        if (chunk.length > 0) {
            await prisma.student.updateMany({
                where: {
                    id: { in: chunk }
                },
                data: {
                    homeroomClassId: homeroomClass.id
                }
            });
        }
        currentStudentIndex += studentsPerClass;
    }
    
    return {
        message: "Auto assigned homerooms successfully",
        classesCreated: createdClasses.length,
        studentsAssigned: studentIds.length,
        classes: createdClasses
    };
};

export const addBulkSchedule = async (data: {
    classId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    daysOfWeek: number[]; // 0 = Sunday, 1 = Monday...
    shift: string;
    room: string;
}) => {
    const { classId, startDate, endDate, daysOfWeek, shift, room } = data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Find class and teacher
    const classInfo = await prisma.class.findUnique({ where: { id: classId } });
    if (!classInfo) throw new Error("Class not found");

    const schedulesToCreate = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
        if (daysOfWeek.includes(currentDate.getDay())) {
            // Check for room conflict
            const existingRoomConflict = await prisma.schedule.findFirst({
                where: {
                    date: currentDate,
                    shift,
                    room
                }
            });
            if (existingRoomConflict) {
                throw new Error(`Phòng ${room} đã được đặt vào ngày ${currentDate.toISOString().split('T')[0]} trong ${shift}`);
            }

            // Check for teacher conflict if class has a teacher
            if (classInfo.teacherId) {
                const existingTeacherConflict = await prisma.schedule.findFirst({
                    where: {
                        date: currentDate,
                        shift,
                        class: {
                            teacherId: classInfo.teacherId
                        }
                    }
                });
                if (existingTeacherConflict) {
                    throw new Error(`Giáo viên đã có lịch dạy vào ngày ${currentDate.toISOString().split('T')[0]} trong ${shift}`);
                }
            }

            schedulesToCreate.push({
                classId,
                date: new Date(currentDate),
                shift,
                room
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (schedulesToCreate.length === 0) {
        throw new Error("Không có ngày nào phù hợp với quy tắc chu kỳ trong khoảng thời gian này.");
    }

    // Insert all
    const result = await prisma.schedule.createMany({
        data: schedulesToCreate
    });

    return {
        message: `Đã tạo thành công ${result.count} buổi học`,
        count: result.count
    };
};

export const getAvailableClasses = async (academicYear: string, semester: number, courseId?: string) => {
    const where: any = {
        academicYear,
        semester
    };
    if (courseId) where.courseId = courseId;
    
    return prisma.class.findMany({
        where,
        include: {
            course: true,
            teacher: {
                include: {
                    user: { select: { username: true, profile: { select: { fullName: true } } } }
                }
            },
            schedules: {
                orderBy: { date: 'asc' }
            },
            _count: {
                select: { students: true }
            }
        }
    });
};

export const enrollClass = async (studentId: string, classId: string) => {
    // 1. Check if class exists
    const targetClass = await prisma.class.findUnique({
        where: { id: classId },
        include: { schedules: true }
    });
    if (!targetClass) throw new Error("Không tìm thấy Lớp học phần");

    // 2. Check if student already enrolled
    const existingEnrollment = await prisma.classStudent.findUnique({
        where: {
            classId_studentId: { classId, studentId }
        }
    });
    if (existingEnrollment) throw new Error("Bạn đã đăng ký lớp học này rồi");

    // 3. Check for schedule overlaps
    // Get all current classes for this student in the same semester
    const currentClasses = await prisma.classStudent.findMany({
        where: {
            studentId,
            class: {
                academicYear: targetClass.academicYear,
                semester: targetClass.semester
            }
        },
        include: {
            class: {
                include: { schedules: true }
            }
        }
    });

    // Map busy slots (Date | Shift)
    const busySlots = new Set<string>();
    for (const enrollment of currentClasses) {
        for (const schedule of enrollment.class.schedules) {
            busySlots.add(`${schedule.date.toISOString().split('T')[0]}|${schedule.shift}`);
        }
    }

    // Check target class schedules
    for (const targetSchedule of targetClass.schedules) {
        const slotKey = `${targetSchedule.date.toISOString().split('T')[0]}|${targetSchedule.shift}`;
        if (busySlots.has(slotKey)) {
            throw new Error(`Phát hiện trùng lịch học: Ngày ${targetSchedule.date.toISOString().split('T')[0]} - ${targetSchedule.shift}`);
        }
    }

    // 4. Enroll
    return prisma.classStudent.create({
        data: {
            classId,
            studentId
        }
    });
};

export const unenrollClass = async (studentId: string, classId: string) => {
    const existingEnrollment = await prisma.classStudent.findUnique({
        where: {
            classId_studentId: { classId, studentId }
        }
    });
    if (!existingEnrollment) throw new Error("Bạn chưa đăng ký lớp này");

    return prisma.classStudent.delete({
        where: {
            classId_studentId: { classId, studentId }
        }
    });
};
