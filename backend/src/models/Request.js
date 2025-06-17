import mongoose from "mongoose";
import User from "./User.js";
const newRequestSchema = mongoose.Schema({
    sender:{
        type:mongoose.Types.ObjectId,
        ref: 'User',
        required:true
    },
    receiver:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true,
    },
});

const Request = mongoose.model('Request',newRequestSchema);
export default Request;
