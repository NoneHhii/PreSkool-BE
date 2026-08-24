import { Router } from "express";
import { registerUser } from "../../controllers/auth/user.controller.js";
import { login } from "../../controllers/auth/auth.controller.ts";

const router = Router();

router.post('/register', registerUser);
router.post('/login', login);

export default router;