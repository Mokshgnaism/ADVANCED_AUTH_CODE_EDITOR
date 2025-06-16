import express from "express";
import { login, logout, logoutAllSessions, resetPassword, sendotp, signUp, verifyEmail } from "../controllers/authController";
import { protectRoute } from "../middleWare/authMiddleWare.js";

const router = express.Router();

router.post("/signIn",signUp);
router.post("/login",login);
router.post("/verifyEmail",protectRoute,verifyEmail);
router.post("/resetPassword",resetPassword);
router.post("/logoutAllSessions",protectRoute,logoutAllSessions);
router.post("/logout",protectRoute,logout);
router.post("/sendOtp",sendotp);

export default router;