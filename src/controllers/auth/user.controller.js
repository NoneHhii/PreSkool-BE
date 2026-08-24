import { User } from "../../models/auth/user.model.js";

const registerUser = async (req, res) => {
    try {
        const {userCode, userName, password, email, role} = req.body;

        if(!userCode || !userName || !password || role) {
            return res.status(400).json({message: "All fields are require"});
        }

        const existing = await User.findOne({userCode: userCode.toLowerCase()});

        if(existing) {
            return res.status(400).json({message: "User aldready existing"});
        }

        const user = await User.create({
            userCode,
            password,
            userName,
            email: null,
            role: "admin"
        });

        res.status(201).json({
            message: "User registered",
            user: {id: user._id, email: user.email, username: user.userName, usercode: user.userCode, role: user.role}
        });
    } catch (error) {
        res.status(500).json({message: "Internal server error", error: error});
    }
} 


export {
    registerUser
}