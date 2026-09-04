import express from "express";
import cors from "cors";
import authRoute from "./src/routes/auth/auth.route.ts"
import userRoute from "./src/modules/user/user.route.ts"

import academicRoute from "./src/modules/academic/academic.route.ts"

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
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

export default app;