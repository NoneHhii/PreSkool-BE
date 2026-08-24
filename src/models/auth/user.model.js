import mongoose, {Schema} from "mongoose";

const UserSchema = new Schema (
    {
        // userCode: {
        //     type: String,
        //     required: true,
        //     unique: true,
        //     trim: true,
        // },

        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minLength: 1,
            maxLength: 30
        },

        password: {
            type: String,
            required: true,
            minLength: 6,
            maxLength: 50,

        },

        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            sparse: true
        },

        role: {
            type: String,
            required: true,
            enum: [
                "ADMIN",
                "TEACHER",
                "STUDENT"
            ]
        },

        avatar: String,

        phone: String,

        status: {
            type: String,
            enum: [
                "ACTIVE",
                "INACTIVE",
                "SUSPENDED"
            ],
            default: "ACTIVE"
        },

        
    },
    {
        timestamps: true
    },
);

export const User = mongoose.model("User", UserSchema);