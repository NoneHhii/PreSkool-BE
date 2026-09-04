import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.ts";
import { requireRole } from "../../middleware/role.middleware.ts";
import * as academicController from "./academic.controller.ts";

const router = Router();

// Middleware to ensure user is authenticated
router.use(authenticate);

// Faculties
router.get("/faculties", academicController.getFaculties);
router.post("/faculties", requireRole("ADMIN"), academicController.createFaculty);

// Majors
router.get("/majors", academicController.getMajors);
router.post("/majors", requireRole("ADMIN"), academicController.createMajor);

// Courses
router.get("/courses", academicController.getCourses);
router.post("/courses", requireRole("ADMIN"), academicController.createCourse);

// Classes
router.get("/classes", academicController.getClasses);
router.post("/classes", requireRole("ADMIN"), academicController.createClass);
router.post("/classes/auto-assign", requireRole("ADMIN"), academicController.autoAssignClasses);
router.post("/classes/:id/assign-students", requireRole("ADMIN"), academicController.assignStudentsToClass);
router.post("/classes/:id/assign-homeroom", requireRole("ADMIN"), academicController.assignHomeroomToClass);

// Homeroom Classes
router.get("/homerooms", academicController.getHomeroomClasses);
router.post("/homerooms", requireRole("ADMIN"), academicController.createHomeroomClass);
router.post("/homerooms/auto-assign", requireRole("ADMIN"), academicController.autoAssignHomerooms);

// Schedule
router.get("/schedule", academicController.getSchedule);
router.post("/schedule", requireRole("ADMIN"), academicController.addSchedule);
router.post("/schedule/bulk", requireRole("ADMIN"), academicController.addBulkSchedule);

// Course Registration (Sinh viên)
router.get("/classes/available", academicController.getAvailableClasses);
router.post("/classes/:id/enroll", requireRole("STUDENT"), academicController.enrollClass);
router.delete("/classes/:id/unenroll", requireRole("STUDENT"), academicController.unenrollClass);

// Attendance
router.post("/attendance", requireRole("TEACHER", "ADMIN"), academicController.markAttendance);
router.get("/attendance/student/:id", academicController.getStudentAttendanceStats);

// UI Lookups
router.get("/students/unassigned-homeroom", requireRole("ADMIN", "TEACHER"), academicController.getUnassignedHomeroomStudents);
router.get("/students/unassigned", requireRole("ADMIN", "TEACHER"), academicController.getUnassignedStudents);
router.get("/students", requireRole("ADMIN", "TEACHER"), academicController.getStudents);
router.get("/teachers", requireRole("ADMIN"), academicController.getTeachers);

export default router;
