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
export const getStudents = async (homeroomClassId?: string) => {
    return prisma.student.findMany({
        where: homeroomClassId ? { homeroomClassId } : undefined,
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
            },
            _count: {
                select: {
                    students: true
                }
            }
        },
        orderBy: {
            code: 'asc'
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
        user: { role: "STUDENT" }
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

    const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: { user: { include: { profile: true } } }
    });

    // 1. Sort students by First Name (A-Z)
    students.sort((a, b) => {
        const nameA = a.user.profile?.fullName || "";
        const nameB = b.user.profile?.fullName || "";
        const partsA = nameA.trim().split(" ");
        const partsB = nameB.trim().split(" ");
        const firstNameA = partsA.pop() || "";
        const firstNameB = partsB.pop() || "";
        if (firstNameA !== firstNameB) return firstNameA.localeCompare(firstNameB, "vi");
        return nameA.localeCompare(nameB, "vi");
    });

    const sortedStudentIds = students.map(s => s.id);

    const studentsPerClass = Math.ceil(sortedStudentIds.length / numberOfClasses);
    let currentStudentIndex = 0;
    const createdClasses = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // 2. Fetch Curriculum for Semester 1 Mapping
    let curriculum = await prisma.curriculum.findUnique({
        where: { majorId_cohort: { majorId, cohort } },
        include: { courses: { where: { semester: 1, isRequired: true }, include: { course: true } } }
    });
    if (!curriculum) {
        const altCohort = cohort.startsWith("K") ? cohort.substring(1) : `K${cohort}`;
        curriculum = await prisma.curriculum.findUnique({
            where: { majorId_cohort: { majorId, cohort: altCohort } },
            include: { courses: { where: { semester: 1, isRequired: true }, include: { course: true } } }
        });
    }

    const academicYear = new Date().getFullYear() + "-" + (new Date().getFullYear() + 1);

    for (let i = 0; i < numberOfClasses; i++) {
        const char = alphabet[i % 26];
        const classCode = `${prefix}${char}${suffix || ""}`;
        const className = `Lớp ${classCode}`;

        // 3. Create Homeroom Class
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
        
        // 4. Assign students to this chunk
        const chunk = sortedStudentIds.slice(currentStudentIndex, currentStudentIndex + studentsPerClass);
        if (chunk.length > 0) {
            await prisma.student.updateMany({
                where: { id: { in: chunk } },
                data: { homeroomClassId: homeroomClass.id }
            });

            // 5. Clone Course Classes, Auto-Enroll, Generate Schedules & Initialize LMS
            if (curriculum && curriculum.courses.length > 0) {
                const classIdsToEnroll: string[] = [];

                for (let cIdx = 0; cIdx < curriculum.courses.length; cIdx++) {
                    const currCourse = curriculum.courses[cIdx];
                    const courseClassCode = `${currCourse.course.code}_${classCode}`;
                    let courseClass = await prisma.class.findUnique({ where: { code: courseClassCode } });
                    
                    if (!courseClass) {
                        courseClass = await prisma.class.create({
                            data: {
                                code: courseClassCode,
                                courseId: currCourse.courseId,
                                academicYear,
                                semester: 1,
                                minCapacity: 20,
                                maxCapacity: 60,
                                status: "OPEN"
                            }
                        });
                    }
                    classIdsToEnroll.push(courseClass.id);

                    // 5a. Auto-Generate 10 Weeks Schedule (Thời khóa biểu kỳ 1)
                    const existingSchedules = await prisma.schedule.count({ where: { classId: courseClass.id } });
                    if (existingSchedules === 0) {
                        const daysOfWeekOffset = (cIdx % 5) + 1; // 1 = Monday ... 5 = Friday
                        const shifts = [
                            "Sáng (Ca 1: 07:30 - 09:30)",
                            "Sáng (Ca 2: 09:45 - 11:45)",
                            "Chiều (Ca 3: 13:00 - 15:00)",
                            "Chiều (Ca 4: 15:15 - 17:15)"
                        ];
                        const rooms = [
                            "Phòng A101",
                            "Phòng A102",
                            "Phòng B201",
                            "Phòng B202",
                            "Lab CNTT 01",
                            "Lab CNTT 02",
                            "Hội trường C1"
                        ];
                        const assignedShift = shifts[(i + cIdx) % shifts.length];
                        const assignedRoom = rooms[(i * 2 + cIdx) % rooms.length];

                        const startDate = new Date();
                        const currentDay = startDate.getDay();
                        let daysUntilTarget = daysOfWeekOffset - currentDay;
                        if (daysUntilTarget <= 0) daysUntilTarget += 7;

                        const firstSessionDate = new Date(startDate);
                        firstSessionDate.setDate(startDate.getDate() + daysUntilTarget);

                        const scheduleRecords = [];
                        for (let week = 0; week < 10; week++) {
                            const sessionDate = new Date(firstSessionDate);
                            sessionDate.setDate(firstSessionDate.getDate() + week * 7);
                            scheduleRecords.push({
                                classId: courseClass.id,
                                date: sessionDate,
                                shift: assignedShift,
                                room: assignedRoom
                            });
                        }

                        if (scheduleRecords.length > 0) {
                            await prisma.schedule.createMany({
                                data: scheduleRecords
                            });
                        }
                    }

                    // 5b. Auto-Initialize LMS Modules, Materials & Assignments (Không gian LMS)
                    const existingModules = await prisma.lMSModule.count({ where: { classId: courseClass.id } });
                    if (existingModules === 0) {
                        await prisma.lMSModule.create({
                            data: {
                                classId: courseClass.id,
                                title: `Tuần 1: Giới thiệu & Đề cương môn ${currCourse.course.name}`,
                                week: 1,
                                order: 1,
                                materials: {
                                    create: [
                                        {
                                            title: `Đề cương chi tiết học phần ${currCourse.course.code}.pdf`,
                                            type: "PDF",
                                            url: "https://preskool.edu.vn/materials/de-cuong.pdf"
                                        },
                                        {
                                            title: `Slide bài giảng Tuần 1: Tổng quan môn học`,
                                            type: "PDF",
                                            url: "https://preskool.edu.vn/materials/slide-tuan-1.pdf"
                                        },
                                        {
                                            title: `Video bài giảng khai giảng môn học`,
                                            type: "VIDEO",
                                            url: "https://preskool.edu.vn/videos/intro.mp4"
                                        }
                                    ]
                                }
                            }
                        });

                        await prisma.lMSModule.create({
                            data: {
                                classId: courseClass.id,
                                title: `Tuần 2: Kiến thức nền tảng & Tài liệu trọng tâm`,
                                week: 2,
                                order: 2,
                                materials: {
                                    create: [
                                        {
                                            title: `Slide bài giảng Tuần 2: Lý thuyết cơ sở`,
                                            type: "PDF",
                                            url: "https://preskool.edu.vn/materials/slide-tuan-2.pdf"
                                        },
                                        {
                                            title: `Tài liệu nghiên cứu mở rộng & Case study`,
                                            type: "LINK",
                                            url: "https://preskool.edu.vn/resources/case-study"
                                        }
                                    ]
                                }
                            }
                        });

                        await prisma.lMSModule.create({
                            data: {
                                classId: courseClass.id,
                                title: `Tuần 3: Bài tập thực hành & Hướng dẫn Lab`,
                                week: 3,
                                order: 3,
                                materials: {
                                    create: [
                                        {
                                            title: `Hướng dẫn thực hành Lab Tuần 3`,
                                            type: "PDF",
                                            url: "https://preskool.edu.vn/materials/lab-tuan-3.pdf"
                                        }
                                    ]
                                }
                            }
                        });

                        const deadline = new Date();
                        deadline.setDate(deadline.getDate() + 14);
                        await prisma.assignment.create({
                            data: {
                                classId: courseClass.id,
                                title: `Bài tập Khởi động Tuần 1 - ${currCourse.course.name}`,
                                description: `Sinh viên đọc tài liệu Tuần 1 và hoàn thành bài thu hoạch/khảo sát đầu khóa trước thời hạn.`,
                                deadline,
                                allowLate: true,
                                isGroup: false
                            }
                        });
                    }
                }

                // Hard Allocation (Ghi danh cứng)
                const enrollments = [];
                for (const studentId of chunk) {
                    for (const clsId of classIdsToEnroll) {
                        enrollments.push({
                            studentId,
                            classId: clsId,
                            registrationStatus: "ENROLLED" as any,
                            isManualOverride: true
                        });
                    }
                }

                await prisma.classStudent.createMany({
                    data: enrollments,
                    skipDuplicates: true
                });
            }
        }
        currentStudentIndex += studentsPerClass;
    }
    
    return {
        message: "Auto assigned homerooms successfully",
        classesCreated: createdClasses.length,
        studentsAssigned: studentIds.length,
        classes: createdClasses,
        curriculumCoursesCloned: curriculum ? curriculum.courses.length : 0,
        courses: curriculum ? curriculum.courses.map(c => ({ code: c.course.code, name: c.course.name, credits: c.course.credits })) : []
    };
};


export const autoAssignAllFreshmen = async (cohortFilter?: string) => {
    // 1. Find all unassigned freshmen
    const whereClause: any = { homeroomClassId: null };
    if (cohortFilter && cohortFilter.trim()) {
        const alt = cohortFilter.startsWith("K") ? cohortFilter.substring(1) : "K" + cohortFilter;
        whereClause.cohort = { in: [cohortFilter, alt] };
    }

    const unassignedStudents = await prisma.student.findMany({
        where: whereClause,
        include: { user: { include: { profile: true } } }
    });

    if (unassignedStudents.length === 0) {
        return {
            message: "Không tìm thấy tân sinh viên nào chưa có lớp sinh hoạt.",
            totalStudents: 0,
            classesCreated: 0,
            totalCourseClassesCreated: 0,
            details: []
        };
    }

    // 2. Load all majors
    const majors = await prisma.major.findMany();
    const majorMap = new Map(majors.map(m => [m.id, m]));

    const MAJOR_PREFIX_MAP: Record<string, string> = {
        "7480201": "CNTT",
        "7480103": "KTPM",
        "7480202": "ATTT",
        "7480107": "KHDL",
        "7480104": "HTTT",
        "7480102": "MMT",
        "7340101": "QTKD",
        "7340115": "MKT",
        "7340120": "KDQT",
        "7340122": "TMDT",
        "7340201": "TCNH",
        "7340301": "KT",
        "7340302": "KTOAN",
        "7220201": "NNA",
        "7220204": "NNTQ",
        "7510301": "DDT",
        "7510303": "TDH"
    };

    // 3. Group students by majorId
    const groupsByMajor = new Map<string, typeof unassignedStudents>();
    for (const s of unassignedStudents) {
        if (!s.majorId) continue;
        if (!groupsByMajor.has(s.majorId)) {
            groupsByMajor.set(s.majorId, []);
        }
        groupsByMajor.get(s.majorId)!.push(s);
    }

    let totalClassesCreated = 0;
    let totalCurriculumCoursesCloned = 0;
    const details = [];

    // 4. For each major group, run the all-in-one autoAssignHomerooms
    for (const [majorId, group] of groupsByMajor.entries()) {
        const major = majorMap.get(majorId);
        const majorCode = major?.code || "";
        const studentCohort = group[0]?.cohort || cohortFilter || "1";
        const shortAcronym = MAJOR_PREFIX_MAP[majorCode] || (majorCode.startsWith("7") ? "CN" + majorCode.substring(3) : majorCode);
        const prefix = shortAcronym + studentCohort;
        
        // Target ~35 students per class (if >35 then 2 classes)
        const numberOfClasses = Math.max(1, Math.ceil(group.length / 35));
        const studentIds = group.map(s => s.id);

        const assignRes = await autoAssignHomerooms({
            majorId,
            cohort: studentCohort,
            studentIds,
            numberOfClasses,
            prefix
        });

        totalClassesCreated += assignRes.classesCreated;
        totalCurriculumCoursesCloned += (assignRes.curriculumCoursesCloned * assignRes.classesCreated);

        details.push({
            majorName: major?.name || majorCode,
            majorCode,
            prefix,
            cohort: studentCohort,
            studentsCount: studentIds.length,
            classesCreated: assignRes.classesCreated,
            curriculumCoursesPerClass: assignRes.curriculumCoursesCloned
        });
    }

    return {
        message: "Đã phân lớp và tự động ghi danh toàn diện cho " + unassignedStudents.length + " tân sinh viên!",
        totalStudents: unassignedStudents.length,
        classesCreated: totalClassesCreated,
        totalCourseClassesCreated: totalCurriculumCoursesCloned,
        details
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
