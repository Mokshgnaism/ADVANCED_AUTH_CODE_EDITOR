import nodemailer from "nodemailer";
import User from "../models/User.js";
import redis from "../config/dbConnect.js";
import bcrypt from "bcryptjs";

const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user,
        pass
    }
});

export async function sendOtp(obj) {
    try {
        const {email} = obj;
        const currentUser = await User.findOne({email});
        if(!currentUser){
            return false;
        }
        const otp = Math.floor(100000+Math.random()*900000);
        console.log(otp);
        const stringotp = otp.toString();
        const hashedOtp = await bcrypt.hash(stringotp,10);

        await redis.del(`otp:${email}`);

        const otpModel = {
            hashedOtp,
            attempts:3
        }
        await redis.setEx(`otp:${email}`,10*60,JSON.stringify(otpModel));

        const sent = await transporter.sendMail({
            from:`"COLLAB EDITOR" <${user}>`,
            to:email,
            subject:"your editor otp",
            text :`${otp}`,
            html:  `<h1>${otp}</h1>`
        })

        if(sent){
            return 1;
        }else{
            return 0;
        }
    } catch (e) {
        console.error(e);
        return -1;
    }
}

export async function verifyOtp(obj) {
    try {
        const {email,otp} = obj;
        const currentUser = await User.findOne({email});
        if(!currentUser){
            return -3;//signalling no user must not be occuring 
        }
        const otpModel = await JSON.parse(await redis.get(`otp:${email}`));

        if(!otpModel){
            return -2;//signalling no otp found 
        }

        await redis.del(`otp:${email}`);

        if(otpModel.attempts<0){
            return -1;//signalling otp attempts exceeded
        }

        const hashedOtp = otpModel.hashedOtp;
        const match = await bcrypt.compare(otp,hashedOtp);

        if(match){
            return 1;//signalling ok
        }

        const newAttemps = otpModel.attempts-1;

        if(!match){
            const newOtpModel = {
                hashedOtp,
                attempts : newAttemps,
            }
            await redis.setEx(`otp:${email}`,2*60,JSON.stringify(newOtpModel));
            return 0 ; //signalling wrong otp .
        }
    } catch (e) {
        console.error(e);
        return -5;
    }
}