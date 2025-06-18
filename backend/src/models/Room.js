import mongoose from "mongoose";
import { stringify } from "uuid";

const newRoomSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
     creator:{
        type:mongoose.Types.ObjectId,
        ref:'User'
    },
    members:{
        type:[
            {
                type:mongoose.Types.ObjectId,
                ref:'User'
            }
        ],
        default:[]
    },
    currentCode:{
        type:String,
        default:"//start your code here"
    },
    language:{
        type:String,
        default:"cpp"
    }
},{timestamps:true});



newRoomSchema.pre('save', function (next) {
    if (this.isNew) { 
        this.members = [this.creator];
    }
    next();
});


export default mongoose.model("Room",newRoomSchema);

