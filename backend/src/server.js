import express from "express";
import cookieParser from 'cookie-parser';
const app = express();
app.use(express.json());
app.use(cookieParser());
import { dbConnect } from "./config/dbConnect";
import redis from "./config/dbConnect";
import authRoutes from "./routes/authRoutes";
dbConnect();
app.use("/api/auth",authRoutes);

const port = process.env.PORT;

app.listen(port,()=>console.log(`server running on ${port}`));
