import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import type { FeedSession } from '../services/feed';
import { reactToSession, removeReaction } from '../services/feed';
import { showError } from '../services/toast';

const INTENSITY_COLORS: Record<string, string> = {
  Deload: '#60a5fa',     // blue
  Normal: '#34d399',     // green
  Progression: '#f59e0b', // amber
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type Props = {
  session: FeedSession;
  onReactionChange?: (sessionId: number, emoji: string | null) => void;
};

const EMOJI_OPTIONS = ['💪', '🔥', '👏', '⚡', '🏆'];

export default function FeedCard({ session, onReactionChange }: Props) {
  const [myReaction, setMyReaction] = useState<string | null>(session.my_reaction);
  const [reacting, setReacting] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  // Group reaction counts
  const reactionCounts: Record<string, number> = {};
  session.reactions.forEach(r => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  });

  const handleReact = async (emoji: string) => {
    setShowEmojis(false);
    if (reacting) return;
    setReacting(true);
    try {
      if (myReaction === emoji) {
        await removeReaction(session.session_id);
        setMyReaction(null);
        onReactionChange?.(session.session_id, null);
      } else {
        await reactToSession(session.session_id, emoji);
        setMyReaction(emoji);
        onReactionChange?.(session.session_id, emoji);
      }
    } catch (err: any) {
      showError('Error', err?.message ?? 'Could not react');
    } finally {
      setReacting(false);
    }
  };

  const intensityColor = INTENSITY_COLORS[session.intensity ?? ''] ?? '#94a3b8';

  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm">
      {/* Header row */}
      <View className="flex-row items-center gap-3 mb-3">
        <Avatar
          profilePictureUrl={session.user.profile_picture_url}
          name={session.user.username}
          size={40}
        />
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-900">@{session.user.username}</Text>
          <Text className="text-xs text-gray-400">{timeAgo(session.completed_at)}</Text>
        </View>
        {session.intensity ? (
          <View
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: intensityColor + '22' }}
          >
            <Text className="text-xs font-bold" style={{ color: intensityColor }}>
              {session.intensity}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Session title */}
      <Text className="text-base font-extrabold text-violet-800 mb-1">{session.title}</Text>

      {/* Meta row */}
      <View className="flex-row gap-4 mb-2">
        {session.estimated_duration_minutes ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={13} color="#9ca3af" />
            <Text className="text-xs text-gray-400">{session.estimated_duration_minutes} min</Text>
          </View>
        ) : null}
      </View>

      {/* Summary */}
      {session.summary ? (
        <Text className="text-sm text-gray-500 mb-3">{session.summary}</Text>
      ) : null}

      {/* Reactions row */}
      <View className="flex-row items-center gap-2 flex-wrap">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <Pressable
            key={emoji}
            onPress={() => handleReact(emoji)}
            className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${
              myReaction === emoji
                ? 'bg-violet-100 border-violet-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Text className="text-sm">{emoji}</Text>
            <Text className="text-xs font-semibold text-gray-600">{count}</Text>
          </Pressable>
        ))}

        {/* Add reaction button */}
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => setShowEmojis(prev => !prev)}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
          >
            <Text className="text-base">+</Text>
          </Pressable>

          {showEmojis && (
            <View
              style={{
                position: 'absolute',
                bottom: 42,
                left: 0,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                // Light slate that fits the app's white-card + violet theme.
                // Subtle enough not to compete with the violet accents, distinct
                // enough to read as a floating menu over the white card.
                backgroundColor: '#f1f5f9',       // slate-100
                borderRadius: 22,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: '#e2e8f0',           // slate-200 — soft outline
                // Explicit width so all 5 emojis render inside the pill.
                // Without this, the absolute child inherits its 32-px wrapper's
                // available width and the last 3 emojis overflow visibly.
                width: 230,
                zIndex: 999,
                elevation: 8,                     // Android stacking
                shadowColor: '#1e293b',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
              }}
            >
              {EMOJI_OPTIONS.map(e => (
                <Pressable
                  key={e}
                  onPress={() => handleReact(e)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: 14,
                    backgroundColor: pressed ? 'rgba(124,58,237,0.12)' : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
