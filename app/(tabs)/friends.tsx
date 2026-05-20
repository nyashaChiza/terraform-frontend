import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import FriendButton from '../../components/FriendButton';
import FeedCard from '../../components/FeedCard';
import {
  searchUsers,
  getFriends,
  getIncomingRequests,
  getFriendshipStatus,
  acceptFriendRequest,
  declineFriendRequest,
  type PublicUser,
  type IncomingRequest,
  type FriendshipStatus,
} from '../../services/friends';
import { getFeed, type FeedSession } from '../../services/feed';
import { showError, showSuccess } from '../../services/toast';

type Tab = 'discover' | 'feed';

export default function FriendsTab() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  // ── Feed ──────────────────────────────────────────────────────────────────
  const [feed, setFeed] = useState<FeedSession[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);

  // ── Discover ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [searchStatuses, setSearchStatuses] = useState<
    Record<number, { status: FriendshipStatus; friendship_id?: number }>
  >({});
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);

  const loadFeed = async (quiet = false) => {
    if (!quiet) setFeedLoading(true);
    try {
      setFeed(await getFeed());
    } catch (err: any) {
      showError('Error', err?.message ?? 'Could not load feed');
    } finally {
      setFeedLoading(false);
      setFeedRefreshing(false);
    }
  };

  const loadDiscover = async () => {
    setFriendsLoading(true);
    try {
      const [f, inc] = await Promise.all([getFriends(), getIncomingRequests()]);
      setFriends(f);
      setIncoming(inc);
    } catch (err: any) {
      showError('Error', err?.message ?? 'Could not load friends');
    } finally {
      setFriendsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFeed();
      loadDiscover();
    }, []),
  );

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); setSearchStatuses({}); return; }
    setSearching(true);
    try {
      const results = await searchUsers(q);
      setSearchResults(results);
      // Fetch friendship status for each result (so button shows correct state)
      const statuses: Record<number, { status: FriendshipStatus; friendship_id?: number }> = {};
      await Promise.allSettled(
        results.map(async user => {
          try {
            statuses[user.id] = await getFriendshipStatus(user.id);
          } catch {
            statuses[user.id] = { status: 'none' };
          }
        }),
      );
      setSearchStatuses(statuses);
    } catch {
      setSearchResults([]);
      setSearchStatuses({});
    } finally {
      setSearching(false);
    }
  };

  const handleAccept = async (req: IncomingRequest) => {
    try {
      await acceptFriendRequest(req.friendship_id);
      setIncoming(prev => prev.filter(r => r.friendship_id !== req.friendship_id));
      showSuccess('Friend added');
      loadDiscover();
    } catch (err: any) {
      showError('Error', err?.message ?? 'Failed');
    }
  };

  const handleDecline = async (req: IncomingRequest) => {
    try {
      await declineFriendRequest(req.friendship_id);
      setIncoming(prev => prev.filter(r => r.friendship_id !== req.friendship_id));
    } catch (err: any) {
      showError('Error', err?.message ?? 'Failed');
    }
  };

  return (
    <View className="flex-1 bg-violet-700">
      {/* Header */}
      <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-white text-2xl font-extrabold">Friends</Text>

        {/* Sub-tab switcher */}
        <View className="flex-row bg-white/20 rounded-xl mt-3 p-1">
          {(['feed', 'discover'] as Tab[]).map(t => (
            <Pressable
              key={t}
              onPress={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === t ? 'bg-white' : ''}`}
            >
              <Text
                className={`text-sm font-semibold capitalize ${
                  activeTab === t ? 'text-violet-800' : 'text-white/80'
                }`}
              >
                {t === 'feed' ? 'Activity Feed' : 'Discover'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      {activeTab === 'feed' ? (
        <FlatList
          data={feed}
          keyExtractor={item => String(item.session_id)}
          refreshControl={
            <RefreshControl
              refreshing={feedRefreshing}
              onRefresh={() => { setFeedRefreshing(true); loadFeed(true); }}
              tintColor="#fff"
            />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 160 }}
          ListEmptyComponent={
            feedLoading ? (
              <View className="py-16 items-center">
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View className="items-center py-16 px-8">
                <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.4)" />
                <Text className="text-white/60 text-center mt-4">
                  No activity yet. Add friends to see their workouts here.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <FeedCard session={item} />
          )}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {/* Search */}
          <View className="mx-4 mb-4">
            <View className="flex-row items-center bg-white/95 rounded-2xl px-4 py-3 gap-2">
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search by username…"
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm text-gray-800"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searching && <ActivityIndicator size="small" color="#7c3aed" />}
            </View>

            {searchResults.length > 0 && (
              <View className="bg-white rounded-2xl mt-2 overflow-hidden">
                {searchResults.map(user => {
                  const statusInfo = searchStatuses[user.id] ?? { status: 'none' as FriendshipStatus };
                  return (
                    <View key={user.id} className="flex-row items-center px-4 py-3 border-b border-gray-50">
                      <Avatar profilePictureUrl={user.profile_picture_url} name={user.username} size={40} />
                      <Text className="flex-1 ml-3 font-semibold text-gray-800">@{user.username}</Text>
                      <FriendButton
                        otherUserId={user.id}
                        status={statusInfo.status}
                        friendshipId={statusInfo.friendship_id}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Incoming Requests */}
          {incoming.length > 0 && (
            <View className="mx-4 mb-4">
              <Text className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
                Friend Requests ({incoming.length})
              </Text>
              <View className="bg-white rounded-2xl overflow-hidden">
                {incoming.map(req => (
                  <View key={req.friendship_id} className="flex-row items-center px-4 py-3 border-b border-gray-50">
                    <Avatar profilePictureUrl={req.from.profile_picture_url} name={req.from.username} size={40} />
                    <Text className="flex-1 ml-3 font-semibold text-gray-800">@{req.from.username}</Text>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleDecline(req)}
                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Ionicons name="close" size={16} color="#6b7280" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleAccept(req)}
                        className="w-8 h-8 rounded-full bg-green-500 items-center justify-center"
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Friends list */}
          <View className="mx-4">
            <Text className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
              Friends {friends.length > 0 ? `(${friends.length})` : ''}
            </Text>
            {friendsLoading ? (
              <ActivityIndicator color="#fff" />
            ) : friends.length === 0 ? (
              <Text className="text-white/60 text-sm">
                You haven't added any friends yet. Search for people above.
              </Text>
            ) : (
              <View className="bg-white rounded-2xl overflow-hidden">
                {friends.map(friend => (
                  <View key={friend.id} className="flex-row items-center px-4 py-3 border-b border-gray-50">
                    <Avatar profilePictureUrl={friend.profile_picture_url} name={friend.username} size={40} />
                    <Text className="flex-1 ml-3 font-semibold text-gray-800">@{friend.username}</Text>
                    <FriendButton
                      otherUserId={friend.id}
                      status="friends"
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
