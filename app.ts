import express from "express";
import cors from "cors";
import authRoute from "./src/routes/auth/auth.route.ts"
import userRoute from "./src/modules/user/user.route.ts"

import academicRoute from "./src/modules/academic/academic.route.ts"

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

export default app;