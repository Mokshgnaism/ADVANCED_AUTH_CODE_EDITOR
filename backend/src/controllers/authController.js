import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {v4} from "uuid";
import redis from "../config/dbConnect.js";
import mongoose from "mongoose";
import { sendOtp, verifyOtp } from "../utils/OtpServices.js";
const COOKIE_OPTIONS_1 = {
  httpOnly: true,
  secure: true,  
  sameSite: "lax",          
  maxAge: 7 * 24 * 60 * 60 * 1000 
};

const COOKIE_OPTIONS_2 = {
  httpOnly: true,
  secure: true,  
  sameSite: "lax",          
  maxAge: 15* 60 * 1000
};
        const accessSecret = process.env.ACCESS_SECRET;
        const refreshSecret = process.env.REFRESH_SECRET;

export async function signUp(req,res) {
    try {
        const {email,password,name,fingerPrint} = req.body;
        //finger print will be sent from the browser ... which is indeed somewhat secure 
        const hashed = await bcrypt.hash(password,10);
        const user = await User.findOne({email});
        if(user){
            return res.status(409).json({message:"email exists",success:false});
        }
        const newUser = await User.create({
            name,
            email,
            password:hashed
        });
        await sendOtp({email});
        
        const sessionId = v4();


        const hashedFingerPrint = await bcrypt.hash(fingerPrint.toString(),10);

        const accessToken = jwt.sign({userId:newUser._id,browserFingerPrint:fingerPrint},accessSecret,{expiresIn:"15m"});
        const refreshToken = jwt.sign({userId:newUser._id,browserFingerPrint:fingerPrint,sessionId},refreshSecret,{expiresIn:"7d"});

        
        const hashedRefreshToken = await bcrypt.hash(refreshToken.toString(),10);

        const sessions = [{
            sessionId,
            hashedRefreshToken,
            browserFingerPrint:hashedFingerPrint,
            expiresAt:Date.now()+7*24*60*60*1000
        }];

        await redis.set(newUser._id.toString(),JSON.stringify(sessions));

        res.cookie("accessToken",accessToken,COOKIE_OPTIONS_2);
        res.cookie("refreshToken",refreshToken,COOKIE_OPTIONS_1);

        const returnUser = await User.findById(newUser._id).select("-password");

        return res.status(201).json({message:"successfully created user",returnUser,success:true});
    } catch (e) {
        const email = req.body.email;
        await User.deleteOne({email});
        console.error(e);
        res.status(500).json({message:"internal server error",success:false,e:e.message,e});
    }
}



export async function login(req,res){
    try {
        const {email,password,fingerPrint} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"Email not found",success:false});
        }
        const hashed = user.password;
        const match = await bcrypt.compare(password,hashed);
        if(!match){
            return res.status(401).json({message:"wrong password",success:false});
        }

        if(!user.isVerified){
            await sendOtp({email});
        }

        const sessionId = v4();


        const hashedFingerPrint = await bcrypt.hash(fingerPrint,10);


        const accessToken = jwt.sign({userId:user._id,browserFingerPrint:fingerPrint},accessSecret,{expiresIn:"15m"});
        const refreshToken = jwt.sign({userId:user._id,browserFingerPrint:fingerPrint,sessionId},refreshSecret,{expiresIn:"7d"});

        

        const hashedRefreshToken = await bcrypt.hash(refreshToken.toString(),10);

        const sessionString = await redis.get(user._id.toString());
        let sessions = await JSON.parse(sessionString);

        const s1 = {
            sessionId,
            hashedRefreshToken,
            browserFingerPrint:hashedFingerPrint,
            expiresAt:Date.now()+7*24*60*60*1000
        }

        if(sessions){
            sessions.push(s1);
        }else{
            sessions = [s1];
        }
        
        

        await redis.set(user._id.toString(),JSON.stringify(sessions));

        res.cookie("accessToken",accessToken,COOKIE_OPTIONS_2);
        res.cookie("refreshToken",refreshToken,COOKIE_OPTIONS_1);

        const returnUser = await User.findById(user._id).select("-password");

        return res.status(200).json({message:"user logged in succesfully ",returnUser,success:true});

    } catch (e) {
        console.error(e);
        res.status(500).json({message:"internal server error",success:false,e:e.message,e});
    }
}

//we will protect this route.... and make sure it gets the user by itself and not by fetching ... 
export async function verifyEmail(req,res) {
    try {
        const user = req.user;
      
        const {email,otp} = req.body;
        if(!user){
            return res.status(401).json({message:"unoauthorised at verify email",success:false});
        }
        
        if(user.isVerified){
            return res.status(200).json({message:"already verified...",success:true});
        }

        const match = await verifyOtp({email,otp});

        if(match==1){
            await User.findByIdAndUpdate(user._id,{
                isVerified:true
            });
            return res.status(201).json({message:"succesfully verified the user ",success:true});
        }
        if(match==0){
            return res.status(403).json({message:"wrong otp found ...",success:false});
        }
        if(match == -2){
            return res.status(404).json({message:"otp not found or expired or attempts ran out",success:false});
        }
        if(match==-1){
            return res.status(403).json({message:"otp attempts ran out please send the otp again ...",success:false});
        }
        if(match==-5){
            return res.status(500).json({message:"internal server error",success:false});
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({message:"internal server error",success:false,e:e.message,e});
    }
}

export async function resetPassword(req,res) {
    try {
        const {email,otp,newPassword} = req.body;
        const user = await User.findOne({email});

        if(!email||!otp||!newPassword){
            return res.status(404).json({message:"email and otp are necessary..",success:false});
        }
        if(!user){
            return res.status(404).json({message:"no user found for this",success:false});
        }

        const match = await verifyOtp({email,otp});

        if(match==1){
            const newHashedPassword = await bcrypt.hash(newPassword.toString(),10);
            await User.findByIdAndUpdate(user._id,{
                password:newHashedPassword
            });
            return res.status(201).json({message:"succesfully chanfed the password ",success:true});
        }
        if(match==0){
            return res.status(403).json({message:"wrong otp found ...",success:false});
        }
        if(match == -2){
            return res.status(404).json({message:"otp not found or expired or attempts ran out",success:false});
        }
        if(match==-1){
            return res.status(403).json({message:"otp attempts ran out please send the otp again ...",success:false});
        }
        if(match==-5){
            return res.status(500).json({message:"internal server error",success:false});
        }

    } catch (e) {
        console.error(e);
        res.status(500).json({message:"internal server error",success:false,e:e.message,e});
    }
}

export async function logoutAllSessions(req,res){
    try {

        const user = req.user;
        if(!user){
            return res.status(404).json({message:"user not there with req",success:false});
        }
        const email = user.email;
        const otp = req.body.otp;
        const match = await verifyOtp({email,otp});


        if(match==1){
            res.clearCookie("accessToken",COOKIE_OPTIONS_2);
            res.clearCookie("refreshToken",COOKIE_OPTIONS_1);
            await redis.del(user._id);
            return res.status(200).json({message:"successfully deleted the sessions..."});
        }

        if(match==0){
            return res.status(403).json({message:"wrong otp found ...",success:false});
        }
        if(match == -2){
            return res.status(404).json({message:"otp not found or expired or attempts ran out",success:false});
        }
        if(match==-1){
            return res.status(403).json({message:"otp attempts ran out please send the otp again ...",success:false});
        }
        if(match==-5){
            return res.status(500).json({message:"internal server error",success:false});
        }

    } catch (e) {
          console.error(e);
          res.status(500).json({ message: "Internal server error", success: false, e: e.message });
    }
}

export async function logout(req,res) {
    try {
        const user = req.user;
        res.clearCookie("accessToken",COOKIE_OPTIONS_2);
        if(!user){
            res.clearCookie("refreshToken",COOKIE_OPTIONS_1);
            return res.status(200).json({message:"already logged out"});
        }

        const refreshToken = req.cookies.refreshToken;


        res.clearCookie("refreshToken",COOKIE_OPTIONS_1);

         let decoded;
        try {
            decoded = jwt.verify(refreshToken, refreshSecret);
        } catch (err) {
            return res.status(200).json({ message: "Invalid or expired token", success: true });
        }

        const sessions = await JSON.parse(await redis.get(user._id.toString()));

        if(!sessions){
             return res.status(200).json({ message: "Successfully logged out", success: true });
        }

        const updatedSessions = sessions.filter(s=>s.sessionId!=decoded.sessionId);

        await redis.set(user._id.toString(),JSON.stringify(updatedSessions));
        return res.status(200).json({ message: "Successfully logged out", success: true });
                                                                        
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error", success: false, e: e.message });
    }
}
export async function sendotp(req,res) {
    try {
       const {email} = req.body;
       const sent =  await sendOtp({email});
       if(sent==1){
        return res.status(201).json({message:"new otp sent",success:true});
       }
       if(sent==0||sent==-1){
        return res.status(500).json({message:"internal server errors"})
       }
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error", success: false, e: e.message });
    }
}
