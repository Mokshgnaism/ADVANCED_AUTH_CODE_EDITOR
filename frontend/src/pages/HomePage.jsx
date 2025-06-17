import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  createRoom,
  getUserRooms,
  deleteMyRoom
} from "../lib/api";
import { Link } from "react-router";
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon } from "lucide-react";



import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import RoomCard from "../components/RoomCard";
const HomePage = () => {
  const queryClient = useQueryClient();
  const [roomTitle, setRoomTitle] = useState("");
const [roomLanguage, setRoomLanguage] = useState("");

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ["MyRooms"],
    queryFn: getUserRooms,
  });

  const { mutate: createRoomMutation, isPending: creatingRoom } = useMutation({
    mutationFn: createRoom,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["MyRooms"] }) }
  });;
  const { mutate: deleteRoomMutation, isPending: deletingRoom } = useMutation({
    mutationFn: deleteMyRoom,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["MyRooms"] }) }
  });;

  const handleCreate = async (e, title, language) => {
    e.preventDefault();
    createRoomMutation({ title, language });
  }
  const handleDelete = async (e, roomID) => {
    e.preventDefault();
    deleteRoomMutation(roomID);
  }





  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Rooms</h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Room requests
          </Link>
        </div>

        {loadingRooms ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : rooms.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}

        <form
        

          onSubmit={(e) => handleCreate(e, roomTitle, roomLanguage)}
          className="flex flex-col gap-4 max-w-md"
        >
          <input
            type="text"
            className="input input-bordered"
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
            placeholder="Enter room title"
            required
          />

          <select
            className="select select-bordered"
            value={roomLanguage}
            onChange={(e) => setRoomLanguage(e.target.value)}
          >
            <option disabled value="">
              Select language
            </option>
            <option value="C++">C++</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
          </select>

          <button type="submit" className="btn btn-primary" disabled={creatingRoom}>
            {creatingRoom ? "Creating..." : "Create Room"}
          </button>
        </form>




      </div>
    </div>
  );
};

export default HomePage;
