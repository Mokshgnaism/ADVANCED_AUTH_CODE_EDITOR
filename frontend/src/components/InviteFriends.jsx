import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getUserFriends, sendRoomInvite } from "../lib/api";

export default function InviteFriends({ roomId }) {
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["UserFriends"],
    queryFn: getUserFriends,
  });

  const { mutate: inviteFriend } = useMutation({
    mutationFn: ({ friendId }) => sendRoomInvite({ roomId, friendId }),
    onSuccess: () => alert("Invitation sent!"),
  });

  return (
    <div className="border rounded-lg p-4 shadow-md bg-white dark:bg-gray-900">
      <h3 className="text-lg font-semibold mb-2">Invite Friends</h3>
      <div className="overflow-y-auto max-h-64 space-y-2">
        {isLoading ? (
          <p>Loading friends...</p>
        ) : friends.length === 0 ? (
          <p>No friends found.</p>
        ) : (
          friends.map((friend) => (
            <div
              key={friend._id}
              className="flex justify-between items-center p-2 border-b"
            >
              <span>{friend.name}</span>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => inviteFriend({ friendId: friend._id })}
              >
                Invite
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
