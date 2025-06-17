import bcrypt from "bcryptjs";
import redis from "../config/dbConnect.js";
import User from "../models/User.js";
import jwt, { decode } from "jsonwebtoken";
import {v4} from "uuid";
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
        const { fingerPrint } = req.body;
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            res.clearCookie("accessToken", COOKIE_OPTIONS_2);
            res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
            return res.status(403).json({ message: "No refresh token found" });
        }

        if (accessToken) {
            try {
                console.log("Trying access token...");
                const decoded = jwt.verify(accessToken, accessSecret);
                const user = await User.findById(decoded.userId);
                const tokenFingerprint = decoded.browserFingerPrint;

                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                if (tokenFingerprint !== fingerPrint) {
                    console.log("Fingerprint mismatch in access token");

                    const decoded_refresh = jwt.verify(refreshToken, refreshSecret);
                    const sessionId = decoded_refresh.sessionId;

                    const redisData = await redis.get(user._id.toString());
                    if (redisData) {
                        const sessions = JSON.parse(redisData);
                        const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
                        await redis.set(user._id.toString(), JSON.stringify(updatedSessions));
                    }

                    res.clearCookie("accessToken", COOKIE_OPTIONS_2);
                    res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
                    return res.status(403).json({ message: "Token theft detected. Session removed." });
                }

                req.user = user;
                return next();
            } catch (e) {
                console.log("Access token invalid or expired, will try refresh...");
            }
        }

        try {
            console.log("Trying refresh token...");
            const decoded = jwt.verify(refreshToken, refreshSecret);
            const { userId, sessionId, browserFingerPrint: tokenFingerprint } = decoded;

            const redisData = await redis.get(userId);
            if (!redisData) {
                res.clearCookie("accessToken", COOKIE_OPTIONS_2);
                res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
                return res.status(403).json({ message: "No session found in Redis" });
            }

            const sessions = JSON.parse(redisData);
            const session = sessions.find(s => s.sessionId === sessionId);

            if (!session || session.expiresAt <= Date.now()) {
                res.clearCookie("accessToken", COOKIE_OPTIONS_2);
                res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
                return res.status(403).json({ message: "Invalid or expired session" });
            }

            const match1 = await bcrypt.compare(refreshToken, session.hashedRefreshToken);
            const match2 = await bcrypt.compare(fingerPrint, session.browserFingerPrint);
            const match3 = fingerPrint === tokenFingerprint;

            if (!match1 || !match2 || !match3) {
                const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
                await redis.set(userId, JSON.stringify(updatedSessions));
                
                res.clearCookie("accessToken", COOKIE_OPTIONS_2);
                res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
                return res.status(403).json({ message: "SCAM LOGIN DETECTED" });
            }

            const newSessionId = v4();

            const newAccessToken = jwt.sign({ userId, browserFingerPrint: fingerPrint }, accessSecret, { expiresIn: "15m" });
            const newRefreshToken = jwt.sign({ userId, browserFingerPrint: fingerPrint, sessionId:newSessionId }, refreshSecret, { expiresIn: "7d" });

            const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
            
            const updatedSession = {
                sessionId : newSessionId,
                hashedRefreshToken: newHashedRefreshToken,
                browserFingerPrint: session.browserFingerPrint,
                expiresAt: session.expiresAt
            };

            const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
            updatedSessions.push(updatedSession);

            await redis.set(userId, JSON.stringify(updatedSessions));
            res.cookie("accessToken", newAccessToken, COOKIE_OPTIONS_2);
            res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS_1);

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            req.user = user;
            return next();
        } catch (e) {
            console.log("Refresh token verification failed:", e.message);
            res.clearCookie("accessToken", COOKIE_OPTIONS_2);
            res.clearCookie("refreshToken", COOKIE_OPTIONS_1);
            return res.status(403).json({ message: "User logged out. Refresh token invalid." });
        }
    } catch (e) {
        console.error("Unexpected error:", e.message);
        res.status(500).json({ message: "Internal server error", success: false });
    }
}
