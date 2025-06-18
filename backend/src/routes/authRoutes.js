import express from "express";
import { login, logout, logoutAllSessions, resetPassword, sendotp, signUp, verifyEmail } from "../controllers/authController.js";
import { protectRoute } from "../middleWare/authMiddleWare.js";

const router = express.Router();

router.post("/signUp",signUp);
router.post("/login",login);
router.post("/verifyEmail",protectRoute,verifyEmail);
router.post("/resetPassword",resetPassword);
router.post("/logoutAllSessions",protectRoute,logoutAllSessions);
router.post("/logout",protectRoute,logout);
router.post("/sendOtp",sendotp);

router.post("/me",protectRoute, (req,res)=>{
    const user = req.user;
    if(!user){
        return res.status(401).json({message:"unauth",user:null});
    }
    if(user){
        return res.status(200).json({message:"user found",user});
    }
})

export default router;