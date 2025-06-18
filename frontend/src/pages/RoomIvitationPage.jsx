import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
    getOutgoingFriendReqs,
    getRecommendedUsers,
    getUserFriends,
    sendFriendRequest,
    createRoom,
    getUserRooms,
    deleteMyRoom,
    getRoomInvites
} from "../lib/api";
import { Link } from "react-router";
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon } from "lucide-react";



import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import RoomCard from "../components/RoomCard";
const RoomInvitationPage = () => {
    const queryClient = useQueryClient();

    const { data: invitations = [], isLoading: loadingRooms } = useQuery({
        queryKey: ["RoomInvites"],
        queryFn: getRoomInvites,
    });


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto space-y-10">


                {loadingRooms ? (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-lg" />
                    </div>
                ) : invitations.length === 0 ? (
                    <NoFriendsFound />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {invitations.map((invitation) => (
                            <div key={invitation.roomId._id} className="space-y-2">
                                <RoomCard room={invitation.roomId} />
                                <div className="text-sm text-gray-600">
                                    Invited by: {invitation.sender.name}
                                </div>
                            </div>
                        ))}

                    </div>
                )}

                {/* add a buttoon where the user enters the room id to join  */}

            </div>
        </div>
    );
};

export default RoomInvitationPage;
