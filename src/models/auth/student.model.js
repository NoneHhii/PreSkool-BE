import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({

    userUd: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    studentCode: {
        type: String,
        required: true,
        unique: true,
    },

    fullName: {
        type: String,
        required: true
    },

    dateOfBirth: Date,

    gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER"]
    },

    address: String,

    // classId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Class"
    // }
})