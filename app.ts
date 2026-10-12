import express from "express";
import cors from "cors";
import authRoute from "./src/routes/auth/auth.route.ts"
import userRoute from "./src/modules/user/user.route.ts"

import academicRoute from "./src/modules/academic/academic.route.ts"
import studentRoute from "./src/modules/student/student.route.ts"
import registrationRoute from "./src/modules/registration/registration.route.ts"
import examinationRoute from "./src/modules/examination/examination.route.ts"
import financeRoute from "./src/modules/finance/finance.route.ts"
import affairsRoute from "./src/modules/affairs/affairs.route.ts"
import teacherRoute from "./src/modules/teacher/teacher.route.ts"
import lmsRoute from "./src/modules/lms/lms.route.ts"
import advisorRoute from "./src/modules/advisor/advisor.route.ts"

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        return callback(null, true); // Allow all origins for now to prevent CORS issues
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
    res.json({
        message: "Preskool API is running"
    });
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/v1/academic", academicRoute);
app.use("/api/v1/students", studentRoute);
app.use("/api/v1/registration", registrationRoute);
app.use("/api/v1/examination", examinationRoute);
app.use("/api/v1/finance", financeRoute);
app.use("/api/v1/affairs", affairsRoute);
app.use("/api/v1/teacher", teacherRoute);
app.use("/api/v1/lms", lmsRoute);
app.use("/api/v1/advisor", advisorRoute);

export default app;