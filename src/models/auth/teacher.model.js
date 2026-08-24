import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    employeeCode: {
        type: String,
        unique: true,
        required: true,

    },

    fullName: {
        type: String,
        required: true,
    },

    dateOfBirth: Date,
})