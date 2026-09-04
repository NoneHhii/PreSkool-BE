import type { Request, Response } from "express";
import * as academicService from "./academic.service";
import * as validation from "./academic.validation";

// Faculties
export const getFaculties = async (req: Request, res: Response) => {
    try {
        const faculties = await academicService.getFaculties();
        return res.status(200).json({ message: "Success", data: faculties });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createFaculty = async (req: Request, res: Response) => {
    try {
        const result = validation.createFacultySchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const faculty = await academicService.createFaculty(result.data);
        return res.status(201).json({ message: "Faculty created", data: faculty });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// Majors
export const getMajors = async (req: Request, res: Response) => {
    try {
        const majors = await academicService.getMajors();
        return res.status(200).json({ message: "Success", data: majors });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createMajor = async (req: Request, res: Response) => {
    try {
        const result = validation.createMajorSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const major = await academicService.createMajor(result.data);
        return res.status(201).json({ message: "Major created", data: major });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// Courses
export const getCourses = async (req: Request, res: Response) => {
    try {
        const courses = await academicService.getCourses();
        return res.status(200).json({ message: "Success", data: courses });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createCourse = async (req: Request, res: Response) => {
    try {
        const result = validation.createCourseSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const course = await academicService.createCourse(result.data);
        return res.status(201).json({ message: "Course created", data: course });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// Classes
export const getClasses = async (req: Request, res: Response) => {
    try {
        const classes = await academicService.getClasses();
        return res.status(200).json({ message: "Success", data: classes });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createClass = async (req: Request, res: Response) => {
    try {
        const result = validation.createClassSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const newClass = await academicService.createClass(result.data);
        return res.status(201).json({ message: "Class created", data: newClass });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const assignStudentsToClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = validation.assignStudentsSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const assignResult = await academicService.assignStudentsToClass(id as string, result.data.studentIds);
        return res.status(200).json({ message: "Students assigned", data: assignResult });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// Schedule
export const getSchedule = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const schedules = await academicService.getSchedule(user.userId, user.role);
        return res.status(200).json({ message: "Success", data: schedules });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const addSchedule = async (req: Request, res: Response) => {
    try {
        const result = validation.addScheduleSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const schedule = await academicService.addSchedule(result.data);
        return res.status(201).json({ message: "Schedule added", data: schedule });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// Attendance
export const markAttendance = async (req: Request, res: Response) => {
    try {
        const result = validation.markAttendanceSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const attendance = await academicService.markAttendance(result.data);
        return res.status(200).json({ message: "Attendance marked", data: attendance });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getStudentAttendanceStats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Optionally verify if user has permission to view this student's stats
        const stats = await academicService.getStudentAttendanceStats(id as string);
        return res.status(200).json({ message: "Success", data: stats });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// Utilities for UI Lookups
export const getStudents = async (req: Request, res: Response) => {
    try {
        const students = await academicService.getStudents();
        return res.status(200).json({ message: "Success", data: students });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getTeachers = async (req: Request, res: Response) => {
    try {
        const teachers = await academicService.getTeachers();
        return res.status(200).json({ message: "Success", data: teachers });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getUnassignedStudents = async (req: Request, res: Response) => {
    try {
        const { cohort, majorId, courseId } = req.query;
        const students = await academicService.getUnassignedStudents(
            cohort as string,
            majorId as string,
            courseId as string
        );
        return res.status(200).json({ message: "Success", data: students });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const autoAssignClasses = async (req: Request, res: Response) => {
    try {
        const result = validation.autoAssignClassesSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const assignResult = await academicService.autoAssignClasses(result.data);
        return res.status(200).json({ message: "Success", data: assignResult });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

// Homeroom Classes
export const getHomeroomClasses = async (req: Request, res: Response) => {
    try {
        const homerooms = await academicService.getHomeroomClasses();
        return res.status(200).json({ message: "Success", data: homerooms });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const createHomeroomClass = async (req: Request, res: Response) => {
    try {
        const result = validation.createHomeroomClassSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const homeroom = await academicService.createHomeroomClass(result.data);
        return res.status(201).json({ message: "Homeroom created", data: homeroom });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const assignHomeroomToClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Course Class ID
        const result = validation.assignHomeroomSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const assignResult = await academicService.assignHomeroomToClass(id as string, result.data.homeroomClassId);
        return res.status(200).json({ message: "Success", data: assignResult });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getUnassignedHomeroomStudents = async (req: Request, res: Response) => {
    try {
        const { cohort, majorId } = req.query;
        const students = await academicService.getUnassignedHomeroomStudents(
            cohort as string,
            majorId as string
        );
        return res.status(200).json({ message: "Success", data: students });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const autoAssignHomerooms = async (req: Request, res: Response) => {
    try {
        const result = validation.autoAssignHomeroomsSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const assignResult = await academicService.autoAssignHomerooms(result.data);
        return res.status(200).json({ message: "Success", data: assignResult });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const addBulkSchedule = async (req: Request, res: Response) => {
    try {
        const result = validation.addBulkScheduleSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
        const scheduleResult = await academicService.addBulkSchedule(result.data);
        return res.status(201).json({ message: "Success", data: scheduleResult });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getAvailableClasses = async (req: Request, res: Response) => {
    try {
        const { academicYear, semester, courseId } = req.query;
        if (!academicYear || !semester) {
            return res.status(400).json({ message: "academicYear and semester are required" });
        }
        const classes = await academicService.getAvailableClasses(
            academicYear as string,
            parseInt(semester as string),
            courseId as string
        );
        return res.status(200).json({ message: "Success", data: classes });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const enrollClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // classId
        // Assuming studentId comes from the authenticated user (req.user)
        // Since we don't have req.user typed fully, we assume we find the student record.
        // Wait, req.user has id (userId). We need to get the Student record for this user.
        // For simplicity, if they pass studentId in body (for admin testing) or we extract from req.user
        
        let studentId = req.body.studentId;
        if (!studentId) {
            // Find student by userId
            // @ts-ignore
            const userId = req.user?.id;
            const student = await prisma.student.findUnique({ where: { userId } });
            if (!student) return res.status(403).json({ message: "Chỉ sinh viên mới được đăng ký môn học" });
            studentId = student.id;
        }

        const enrollment = await academicService.enrollClass(studentId, id as string);
        return res.status(201).json({ message: "Đăng ký thành công", data: enrollment });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const unenrollClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // classId
        
        let studentId = req.body.studentId;
        if (!studentId) {
            // @ts-ignore
            const userId = req.user?.id;
            const student = await prisma.student.findUnique({ where: { userId } });
            if (!student) return res.status(403).json({ message: "Chỉ sinh viên mới được rút môn học" });
            studentId = student.id;
        }

        const enrollment = await academicService.unenrollClass(studentId, id as string);
        return res.status(200).json({ message: "Rút môn học thành công", data: enrollment });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
