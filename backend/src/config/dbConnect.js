import mongoose from "mongoose";
import {createClient} from "redis";
const redis = createClient();
redis.on("error",(error)=>{console.log(error)});
await redis.connect();
console.log("redis connected ...");
export async function dbConnect() {
    try {
        const CONNECTION_STRING = process.env.CONNECTION_STRING;
        const connect = await mongoose.connect(CONNECTION_STRING);
        console.log(connect.connection.host);
        console.log(connect.connection.name);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
export default redis;
