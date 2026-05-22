import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import {
  getNotifications,
  markAllRead,
  type AppNotification,
} from '../../services/notifications';
import { showError } from '../../services/toast';

const TYPE_LABELS: Record<string, string> = {
  friend_request: 'sent you a friend request',
  friend_accepted: 'accepted your friend request',
  reaction_received: 'reacted to your workout',
};

const TYPE_ICONS: Record<string, string> = {
  friend_request: 'person-add-outline',
  friend_accepted: 'people-outline',
  reaction_received: 'heart-outline',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await getNotifications();
      // Preserve existing notifications if a refresh came back empty due to
      // a network blip (apiFetch returns [] after retries exhausted).
      if (data.length > 0 || items.length === 0) setItems(data);
    } catch (err: any) {
      // Service no longer throws on transient failure — this catches genuine bugs
      console.warn('Notifications load error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // Mark-all-read is best-effort — a failure here shouldn't surface as
    // "Could not load notifications" since the list already loaded fine.
    try {
      await markAllRead();
    } catch { /* silently ignore — we'll try again next time */ }
  };

  useFocusEffect(
    useCallback(() => { load(); }, []),
  );

  const renderItem = ({ item }: { item: AppNotification }) => {
    const icon = TYPE_ICONS[item.type] ?? 'notifications-outline';
    const label = TYPE_LABELS[item.type] ?? item.type;
    const emoji = item.type === 'reaction_received' ? item.meta?.emoji : null;

    return (
      <View
        className={`flex-row items-center px-4 py-3 border-b border-gray-50 ${
          !item.is_read ? 'bg-violet-50' : 'bg-white'
        }`}
      >
        {item.actor ? (
          <Avatar
            profilePictureUrl={item.actor.profile_picture_url}
            name={item.actor.username}
            size={44}
          />
        ) : (
          <View className="w-11 h-11 rounded-full bg-violet-100 items-center justify-center">
            <Ionicons name={icon as any} size={20} color="#7c3aed" />
          </View>
        )}

        <View className="flex-1 ml-3">
          <Text className="text-sm text-gray-800">
            {item.actor ? (
              <Text className="font-bold">@{item.actor.username} </Text>
            ) : null}
            <Text>{label}</Text>
            {emoji ? <Text> {emoji}</Text> : null}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">{timeAgo(item.created_at)}</Text>
        </View>

        {!item.is_read && (
          <View className="w-2 h-2 rounded-full bg-violet-600 ml-2" />
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-violet-700"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text className="flex-1 text-white text-xl font-extrabold">Notifications</Text>
          <Pressable onPress={() => load(true)}>
            <Ionicons name="checkmark-done-outline" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor="#7c3aed"
            />
          }
          ListEmptyComponent={
            <View className="items-center py-20 px-8">
              <Ionicons name="notifications-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 text-center mt-4">No notifications yet</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
