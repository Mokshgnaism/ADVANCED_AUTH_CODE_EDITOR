import express from "express";
import { protectRoute } from "../middleWare/authMiddleWare.js";
import { acceptFriendRequest, createRoom, declineFriendRequest, deleteRoom, getFriendRequests, getFriends, getMyRooms, getOutGoingFriendRequests, getPastRooms, getRoomInvitations, getSuggestions, loadChatBetweenUsers, sendFriendRequest, sendRoomInvitation } from "../controllers/userController.js";
const router = express.Router();
router.use(protectRoute);


router.post('/send-friend-request',sendFriendRequest);
router.post('/accept-friend-request',acceptFriendRequest);
router.post('/get-friend-requests',getFriendRequests);
router.post('/get-friends',getFriends);
router.post('/decline-friend-request',declineFriendRequest);
router.post("/outgoing-friend-requests",getOutGoingFriendRequests);

router.post('/getsuggestions',getSuggestions);


router.post('/get-room-invites',getRoomInvitations);
router.post('/send-room-invite',sendRoomInvitation);

router.post("/get-my-rooms",getMyRooms);
router.post("/pastRooms",getPastRooms);
router.post("/create-room",createRoom);
router.post("/deleteRoom",deleteRoom);


router.post("/getUserChat",loadChatBetweenUsers);
export default router;