// models/Invite.js
import mongoose from "mongoose";

const newInviteSchema = mongoose.Schema({
  roomId: {
    type: mongoose.Types.ObjectId,
    ref: "Room", 
    required: true,
  },
  sender: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
    expires: 0,
  },
});

const Invite = mongoose.model("Invite", newInviteSchema);
export default Invite;
