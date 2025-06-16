import bcrypt from "bcryptjs";
import redis from "../config/dbConnect";
import User from "../models/User";
import jwt, { decode } from "jsonwebtoken";
const accessSecret = process.env.ACCESS_SECRET;
const refreshSecret = process.env.REFRESH_SECRET;
//for refresh token 1 
const COOKIE_OPTIONS_1 = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

//for access token 2
const COOKIE_OPTIONS_2 = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000
};

export async function protectRoute(req, res, next) {
    try {
        const { fingerprint } = req.body;
        const accessToken = req.cookies.accessToken;

        if (accessToken) {
            let decoded;
            try {
                decoded = jwt.verify(accessToken, accessSecret);
                const user = await User.findById(decoded.userId);

                const fingerp = decoded.browserFingerPrint;
                const fingerPrintMatch = fingerp == fingerprint;

                if (!fingerPrintMatch) {
                    res.clearCookie("accessToken", COOKIE_OPTIONS_2);
                    res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
                    return res.status(403).json({ message: "this token was not meant for the browser you are using.... logging out" });
                }
                req.user = user;
                return next();
            } catch (e) {
             //do nothing and send forward ....
            }
        }

        await res.clearCookie("accessToken", COOKIE_OPTIONS_2);

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(403).json({ message: "user logged out" });
        }
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, refreshSecret);
            const sessionId = decoded.sessionId;
        const userId = decoded.userId;

        const sessions = await JSON.parse(await redis.get(userId));
        const session = sessions.find(s => s.sessionId === sessionId);
        

        if (!session) {
            res.clearCookie("accessToken", COOKIE_OPTIONS_2);
            res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
            return res.status(403).json({ message: "Invalid session. Logging out." });
        }
        const expiry = session.expiresAt;
        if (session.expiresAt <= Date.now()) {
            res.clearCookie("accessToken", COOKIE_OPTIONS_2);
            res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
            return res.status(403).json({ message: "session Timed out. Logging out." });
        }



        const hashedRefreshToken = session.hashedRefreshToken;
        const hashedFingerPrint = session.browserFingerPrint;

        const match1 = await bcrypt.compare(refreshToken, hashedRefreshToken);
        const match2 = await bcrypt.compare(fingerprint, hashedFingerPrint);
        const match3 = fingerprint == decoded.browserFingerPrint;

        //the refresh token stores plain fingerprint ... 
        //session stores the hashed fingerprint 
        //user sends plain 
        //so we match three things -> (plain==refreshtoken.plain), compare(plain,session),compare(refreshtoken.plain,sessionhash) but the third is not necessary. since one and two take care of the third
        //and the fourth is comparing the refreshtoken associated with the current session. 

        if (!match1 || !match2 || !match3) {
            res.clearCookie("accessToken", COOKIE_OPTIONS_2);
            res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
            return res.status(403).json({ message: "SCAM LOGIN DETECTED" });
        }



        let updatedSessions = sessions.filter(s => s.sessionId !== sessionId);

        const newAccessToken = jwt.sign(
            {
                userId,
                browserFingerPrint: fingerprint,
            },
            accessSecret,
            { expiresIn: "15m" }
        );

        res.cookie("accessToken", newAccessToken, COOKIE_OPTIONS_2);

        const newRefreshToken = jwt.sign({userId,browserFingerPrint:fingerprint,sessionId},refreshSecret,{expiresIn:"7d"});
        const newHashedRefreshToken = await bcrypt.hash(newRefreshToken,10);

        const currentSession={
            sessionId,
            hashedRefreshToken:newHashedRefreshToken,
            browserFingerPrint:hashedFingerPrint,
            expiresAt:expiry
        }

        res.cookie("refreshToken",newRefreshToken,COOKIE_OPTIONS_1);

        updatedSessions.push(currentSession);
        await redis.set(userId,JSON.stringify(updatedSessions)); 
        const user = await User.findById(userId);
        if(!user){
            //ippatidaka chesindi bokka...
            return res.status(404).json({message:"user not found"});
        }
        req.user = user;
        return next();
        } catch (e) {
            res.clearCookie("accessToken", COOKIE_OPTIONS_2);
            res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
            return res.status(403).json({ message: "user logged out" });
        }
        
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "internal server error", success: false, e: e.message, e });
    }
}