import z from "zod";

export const createFacultySchema = z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    description: z.string().optional(),
});

export const createMajorSchema = z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    facultyId: z.string().uuid(),
});

export const createCourseSchema = z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    credits: z.number().int().min(1),
    description: z.string().optional(),
    prerequisites: z.array(z.string().uuid()).optional(),
});

export const autoAssignClassesSchema = z.object({
    courseId: z.string().uuid(),
    academicYear: z.string().min(4),
    semester: z.number().int().min(1).max(3),
    studentIds: z.array(z.string().uuid()).min(1),
    numberOfClasses: z.number().int().min(1),
});

export const createHomeroomClassSchema = z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    majorId: z.string().uuid(),
    cohort: z.string().min(2),
    advisorId: z.string().uuid().optional(),
});

export const assignHomeroomSchema = z.object({
    homeroomClassId: z.string().uuid(),
});

export const createClassSchema = z.object({
    code: z.string().min(2),
    courseId: z.string().uuid(),
    teacherId: z.string().uuid().optional(),
    academicYear: z.string().min(4),
    semester: z.number().int().min(1).max(3),
});

export const assignStudentsSchema = z.object({
    studentIds: z.array(z.string().uuid()).min(1),
});

export const addScheduleSchema = z.object({
    classId: z.string().uuid(),
    date: z.string(), // ISO date string
    shift: z.string().min(1),
    room: z.string().min(1),
});

export const markAttendanceSchema = z.object({
    scheduleId: z.string().uuid(),
    studentId: z.string().uuid(),
    status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]),
    notes: z.string().optional(),
});

export const autoAssignHomeroomsSchema = z.object({
    majorId: z.string().uuid(),
    cohort: z.string().min(2),
    studentIds: z.array(z.string().uuid()).min(1),
    numberOfClasses: z.number().int().min(1),
    prefix: z.string().min(2),
    suffix: z.string().optional(),
});

export const addBulkScheduleSchema = z.object({
    classId: z.string().uuid(),
    startDate: z.string(), // YYYY-MM-DD
    endDate: z.string(), // YYYY-MM-DD
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
    shift: z.string().min(1),
    room: z.string().min(1),
});
