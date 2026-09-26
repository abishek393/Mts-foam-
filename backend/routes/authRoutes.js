import express from "express";
import {
    register,
    verifyRegistration,
    resendRegistrationCode,
    login,
    getMe,
    googleLogin,
    googleStatus,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// POST   /api/auth/register  - Start registration; emails a verification code
router.post("/register", register);

// POST   /api/auth/register/verify - Confirm the emailed code, create account
router.post("/register/verify", verifyRegistration);

// POST   /api/auth/register/resend - Send a fresh code for a pending signup
router.post("/register/resend", resendRegistrationCode);

// POST   /api/auth/login     - Login (all roles)
router.post("/login", login);

// POST   /api/auth/google    - Sign in or register with a Google ID token
router.post("/google", googleLogin);

// GET    /api/auth/google/status - Whether Google sign-in is configured
router.get("/google/status", googleStatus);

// GET    /api/auth/me        - Get current user profile (protected)
router.get("/me", authenticate, getMe);

export default router;
