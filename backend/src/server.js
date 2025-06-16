import express from "express";
import cookieParser from 'cookie-parser';
const app = express();
import dotenv from "dotenv";
dotenv.config();
app.use(express.json());
app.use(cookieParser());
import { dbConnect } from "./config/dbConnect.js";
import redis from "./config/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
dbConnect();
app.use("/api/auth",authRoutes);

const port = process.env.PORT;

app.listen(port,()=>console.log(`server running on ${port}`));
