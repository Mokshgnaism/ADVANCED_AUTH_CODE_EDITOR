import User from "../models/User.js"
import Request from "../models/Request.js"
import Invite from "../models/RoomInvitatio.js";
import ChatMessage from "../models/chatMessage.js";
import { getRoomId } from "../utils/getRoomId.js";
import Room from "../models/Room.js";
import mongoose from "mongoose";

export async function sendFriendRequest(req, res) {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender or receiver ID is missing" });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "Sender or receiver not found" });
    }

    const existingRequest = await Request.find({
      $or: [
        { sender: senderId, receiver: receiver._id },
        { sender: receiver._id, receiver: senderId }
      ]
    });
    if(existingRequest){
      console.log("request found...")
      console.log(existingRequest);
    }
    
    if (existingRequest.length > 0) {
      return res.status(409).json({ message: "Friend request already exists" });
    }

    const newRequest = await Request.create({
      sender: senderId,
      receiver: receiverId
    });
    console.log(newRequest);

    return res.status(200).json({ message: "Friend request sent", request: newRequest });

  } catch (e) {
    console.error("SendFriendRequest Error:", e);
    return res.status(500).json({ message: "Internal server error", error: e });
  }
}


export async function acceptFriendRequest(req, res) {
  try {
    const { friendRequestId } = req.body;
    console.log("accept request hit ");
    const friendRequest = await Request.findById(friendRequestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    
    const senderId = friendRequest.sender;
    const receiverId = friendRequest.receiver;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    if (!sender || !receiver) {
      return res.status(502).json({ message: "Either the sender or the receiver is not present" });
    }

    // Add each other to friends list if not already added
    if (!sender.friends.includes(receiverId)) {
      sender.friends.push(receiverId);
    }

    if (!receiver.friends.includes(senderId)) {
      receiver.friends.push(senderId);
    }
    await sender.save();
    await receiver.save();
    await Request.findByIdAndDelete(friendRequestId);

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error", error: e });
  }
}


export async function getOutGoingFriendRequests(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const requests = await Request.find({ sender: user._id })
      .populate("receiver", "name");

      console.log("printing incoming requests : ");
      console.log(requests);

    return res.status(200).json({ message: "Successfully fetched the requests", requests });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error", error: e });
  }
}



export async function declineFriendRequest(req,res) {
    try {
        const senderId = req.user._id;
        const {receiverId} = req.body;
        const deleteResult = await Request.deleteOne({ sender: senderId, receiver: receiverId });

    if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ message: "Friend request not found." });
    }
    return res.status(200).json({message:"friend request declined "});
    } catch (e) {
        console.log(e);
        return res.status(500).json({message:"internal server error",error:e});
    }
}

export async function getFriendRequests(req, res) {
  try {
    console.log("hit the get friend reqs...")
    const requests = await Request.find({
      receiver: req.user._id
    }).populate('sender', 'name'); // Only populate sender's name
    console.log(requests);
    

    return res.status(200).json({
      message: "found requests",
      requests
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "internal server error", error: e });
  }
}



export async function getSuggestions(req,res){
    try {
        console.log("tried to hit the get suggestiosn api ");
        const Friends = req.user.friends;
        const excludeids = [...Friends,req.user._id];
        let query = {
            _id:{$nin:excludeids}
        }
        const searchText = "";
        

        if(searchText!==""){
            query = {
                $and:[
                    { _id:{$nin:excludeids}},
                    {
                        $or : [
                         {name:{$regex:searchText,$options:"i"}},
                         {email:{$regex:searchText,$options:"i"}},
                        ]
                    }
                ]
            }
        }

        const suggestedUsers = await User.find(query).limit(20);
        return res.status(200).json({message:"success finding suggestions",suggestions:suggestedUsers});
    } catch (e) {
        console.log(e);
        return res.status(500).json({message:"internal server error",error:e});
    }
}



export async function getFriends(req,res){
    try {
        const userWithFriends = await User.findById(req.user._id)
  .populate({
    path: 'friends',
    select: 'name'
  });
  console.log(userWithFriends)

const friends = userWithFriends.friends;
  return res.status(200).json({friends,message:"success fetching friends"});
    } catch (e) {
        console.log(e);
        return res.status(500).json({message:"internal server error",error:e});
    }
}


export async function getRoomInvitations(req, res) {
  try {
    const receiver = req.user._id;
    console.log("hit the my invites route");
    const invitations = await Invite.find({
      receiver,
      expiresAt: { $gt: Date.now() }
    })
      .populate({ path: "sender", select: "name email" })
      .populate({ path: "roomId", select: "title language" }); 

    return res.status(200).json({
      message: "found the invites",
      invitations
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "internal server error",
      error: e.message
    });
  }
}

export async function createRoom(req, res) {
  try {
    const { title, language } = req.body;
    const creator = req.user._id;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const room = new Room({ title, creator, language });
    await room.save();

    return res.status(201).json({ message: "Room created", room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}


export async function getMyRooms(req, res) {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({ creator: userId }).sort({ updatedAt: -1 });

    return res.status(200).json({
      message: "Rooms created by you",
      rooms
    });
  } catch (err) {
    console.error("Error in getMyRooms:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
}


export async function getPastRooms(req, res) {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({
      members: userId,
      creator: { $ne: userId }
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      message: "Rooms you're a part of but didn't create",
      rooms
    });
  } catch (err) {
    console.error("Error in getPastRooms:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
}

export async function deleteRoom(req, res) {
  try {
    const userId = req.user._id;
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this room" });
    }
    await Room.findByIdAndDelete(roomId);

    await Invite.deleteMany({ roomId });

    return res.status(200).json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}


export async function sendRoomInvitation(req,res) {
    try {
        console.log("hit the room invite api ");
        const sender = req.user._id;
        const {friendId,roomId} = req.body;
        const receiver = new mongoose.Types.ObjectId(friendId.toString());
        console.log(receiver);
        console.log(sender);
        
        if(!sender||!receiver||!roomId){
            return res.status(502).json({message:"missing fields present"});
        }

        const existingInvite = await Invite.findOne({
            sender,receiver,roomId
        })

        if(existingInvite &&existingInvite.expiresAt<Date.now()){
            await Invite.findByIdAndDelete(existingInvite._id);
        }
        else if(existingInvite){
           console.log("already existing invite...");
            return res.status(202).json({message:"invite exists"});
        }

        const newInvite = Invite.create(({
            sender,receiver,roomId
        }));
        return res.status(200).json({message:"success",newInvite});
    } catch (e) {
        console.log(e);
        return res.status(500).json({message:"internal server error",error:e});
    }
}


export const loadChatBetweenUsers = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({ error: "Both userId1 and userId2 are required" });
    }

    const roomId = getRoomId(userId1, userId2);
    let messages = await ChatMessage.find({ roomId }).sort({ timestamp: 1 }).exec();
    if (messages.length === 0) {
      const sysMessage = await ChatMessage.create({
        roomId,
        senderId: userId1,
        receiverId: userId2,
        content: "Chat started",
        status: "sent"
      });
      messages = [sysMessage];
    }
    res.status(200).json({ roomId, messages });
  } catch (err) {
    console.error("Error loading chat:", err);
    res.status(500).json({ error: "Failed to load chat" });
  }
};

