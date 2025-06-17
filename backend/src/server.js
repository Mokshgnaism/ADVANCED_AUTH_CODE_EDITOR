import express from "express";
import cookieParser from 'cookie-parser';
const app = express();
import dotenv from "dotenv";
dotenv.config();
app.use(express.json());
import cors from "cors";
app.use(cookieParser());
import { dbConnect } from "./config/dbConnect.js";
import redis from "./config/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"
dbConnect();


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
const port = process.env.PORT;

app.listen(port,()=>console.log(`server running on ${port}`));
