import mongoose from "mongoose";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redis = createClient();

redis.on("error", (error) => {
    console.error("Redis Error:", error);
});

export async function dbConnect() {
    try {
        const CONNECTION_STRING = process.env.CONNECTION_STRING;

        const connect = await mongoose.connect(CONNECTION_STRING);
        console.log("MongoDB connected:", connect.connection.host, connect.connection.name);

        await redis.connect();
        console.log("Redis connected");
    } catch (e) {
        console.error("Connection error:", e);
        process.exit(1);
    }
}

export default redis;
