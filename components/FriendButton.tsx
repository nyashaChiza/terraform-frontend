import React, { useState } from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FriendshipStatus } from '../services/friends';
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../services/friends';
import { showError, showSuccess } from '../services/toast';

type Props = {
  otherUserId: number;
  status: FriendshipStatus;
  friendshipId?: number;
  onStatusChange?: (newStatus: FriendshipStatus) => void;
};

export default function FriendButton({ otherUserId, status, friendshipId, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<FriendshipStatus>(status);
  const [currentFriendshipId, setCurrentFriendshipId] = useState(friendshipId);

  const update = (s: FriendshipStatus) => {
    setCurrentStatus(s);
    onStatusChange?.(s);
  };

  const handlePress = async () => {
    setLoading(true);
    try {
      if (currentStatus === 'none') {
        await sendFriendRequest(otherUserId);
        update('pending_sent');
        showSuccess('Request sent');
      } else if (currentStatus === 'pending_received' && currentFriendshipId != null) {
        await acceptFriendRequest(currentFriendshipId);
        update('friends');
        showSuccess('Friend added');
      } else if (currentStatus === 'friends') {
        await removeFriend(otherUserId);
        update('none');
        showSuccess('Friend removed');
      }
    } catch (err: any) {
      showError('Error', err?.message ?? 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === 'pending_sent') {
    return (
      <Pressable
        disabled
        className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border border-violet-300 bg-violet-50"
      >
        <Ionicons name="time-outline" size={14} color="#7c3aed" />
        <Text className="text-violet-600 text-sm font-semibold">Requested</Text>
      </Pressable>
    );
  }

  const configs: Record<Exclude<FriendshipStatus, 'pending_sent'>, { label: string; icon: string; classes: string; textClass: string }> = {
    none: {
      label: 'Add Friend',
      icon: 'person-add-outline',
      classes: 'bg-violet-700',
      textClass: 'text-white',
    },
    pending_received: {
      label: 'Accept',
      icon: 'checkmark-outline',
      classes: 'bg-green-600',
      textClass: 'text-white',
    },
    friends: {
      label: 'Friends',
      icon: 'people-outline',
      classes: 'border border-violet-300 bg-violet-50',
      textClass: 'text-violet-700',
    },
  };

  const cfg = configs[currentStatus as Exclude<FriendshipStatus, 'pending_sent'>];

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full ${cfg.classes}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={currentStatus === 'none' || currentStatus === 'pending_received' ? '#fff' : '#7c3aed'} />
      ) : (
        <>
          <Ionicons name={cfg.icon as any} size={14} color={currentStatus === 'none' || currentStatus === 'pending_received' ? '#fff' : '#7c3aed'} />
          <Text className={`text-sm font-semibold ${cfg.textClass}`}>{cfg.label}</Text>
        </>
      )}
    </Pressable>
  );
}
