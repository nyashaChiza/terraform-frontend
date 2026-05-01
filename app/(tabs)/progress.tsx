import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStatsSummary, StatsSummary } from '../../services/stats';

// ─── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonBox({ w, h, rounded }: { w: string | number; h: number; rounded?: number }) {
  return (
    <View
      style={{
        width: w as any,
        height: h,
        borderRadius: rounded ?? 8,
        backgroundColor: '#e5e7eb',
        opacity: 0.7,
      }}
    />
  );
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────

function WeeklyChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const BAR_MAX_H = 72;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 8 }}>
      {data.map((week, i) => {
        const barH = Math.max((week.count / max) * BAR_MAX_H, week.count > 0 ? 6 : 2);
        const isLatest = i === data.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            {week.count > 0 && (
              <Text style={{ fontSize: 9, color: '#7c3aed', fontWeight: '700', marginBottom: 2 }}>
                {week.count}
              </Text>
            )}
            <View
              style={{
                width: '72%',
                height: barH,
                borderRadius: 4,
                backgroundColor: week.count > 0
                  ? (isLatest ? '#7c3aed' : '#c4b5fd')
                  : '#e5e7eb',
              }}
            />
            <Text
              style={{
                fontSize: 9,
                color: isLatest ? '#7c3aed' : '#9ca3af',
                fontWeight: isLatest ? '700' : '400',
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {week.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ProgressTab() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    try {
      const res = await getStatsSummary();
      if (res.ok && res.body) {
        setStats(res.body);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const streakEmoji = (n: number) => {
    if (n >= 7) return '🔥🔥';
    if (n >= 3) return '🔥';
    if (n >= 1) return '✨';
    return '💤';
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>
      {/* Fixed header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>Progress</Text>
        <Text style={{ color: '#c4b5fd', fontSize: 14, marginTop: 2 }}>
          Your training at a glance
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStats(true)}
            tintColor="#fff"
            colors={['#7c3aed']}
          />
        }
      >
        {/* ── Loading skeletons ── */}
        {loading && (
          <View style={{ gap: 16, marginTop: 8 }}>
            <SkeletonBox w="100%" h={96} rounded={20} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SkeletonBox w="31%" h={80} rounded={16} />
              <SkeletonBox w="31%" h={80} rounded={16} />
              <SkeletonBox w="31%" h={80} rounded={16} />
            </View>
            <SkeletonBox w="100%" h={160} rounded={20} />
            <SkeletonBox w="100%" h={200} rounded={20} />
          </View>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ color: '#fde8e8', fontSize: 32, marginBottom: 12 }}>😕</Text>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>
              Couldn't load stats
            </Text>
            <Text style={{ color: '#c4b5fd', fontSize: 14, marginBottom: 20 }}>
              Pull down to retry
            </Text>
            <Pressable
              onPress={() => loadStats()}
              style={{
                backgroundColor: '#fff',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: '#7c3aed', fontWeight: '700' }}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* ── Content ── */}
        {!loading && !error && stats && (
          <>
            {/* Streak Banner */}
            <View
              style={{
                backgroundColor: stats.streak > 0 ? '#4c1d95' : '#6d28d9',
                borderRadius: 20,
                padding: 20,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ color: '#ddd6fe', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Current Streak
                </Text>
                <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 2 }}>
                  {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
                </Text>
                <Text style={{ color: '#c4b5fd', fontSize: 13, marginTop: 2 }}>
                  {stats.streak === 0
                    ? 'Complete a session to start your streak!'
                    : stats.streak >= 7
                    ? 'Unstoppable! Keep going 💪'
                    : 'Keep it up! Train again tomorrow'}
                </Text>
              </View>
              <Text style={{ fontSize: 48 }}>{streakEmoji(stats.streak)}</Text>
            </View>

            {/* Stats Cards */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Total', value: stats.total_sessions, unit: 'sessions', icon: '🏋️' },
                { label: 'This week', value: stats.sessions_this_week, unit: 'sessions', icon: '📅' },
                { label: 'PRs set', value: stats.total_prs, unit: 'exercises', icon: '🏆' },
              ].map(card => (
                <View
                  key={card.label}
                  style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{card.icon}</Text>
                  <Text style={{ color: '#5b21b6', fontSize: 22, fontWeight: '800', marginTop: 4 }}>
                    {card.value}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 10, textAlign: 'center', marginTop: 2 }}>
                    {card.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Weekly Activity Chart */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 18,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: '#1f1f2e', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
                Weekly Activity
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>
                Sessions completed per week
              </Text>
              {stats.weekly_counts.every(w => w.count === 0) ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#d1d5db', fontSize: 32 }}>📊</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>
                    Complete sessions to see your chart
                  </Text>
                </View>
              ) : (
                <WeeklyChart data={stats.weekly_counts} />
              )}
            </View>

            {/* Personal Records */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 18,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: '#1f1f2e', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
                Personal Records 🏆
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>
                Max weight lifted per exercise
              </Text>

              {stats.personal_records.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#d1d5db', fontSize: 32 }}>🥇</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>
                    Submit session feedback to track your PRs
                  </Text>
                </View>
              ) : (
                stats.personal_records.map((pr, i) => (
                  <View
                    key={pr.name}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: '#f3f4f6',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : '#fef9c3',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                        }}
                      >
                        <Text style={{ fontSize: 13 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                        </Text>
                      </View>
                      <Text
                        style={{ color: '#374151', fontSize: 14, fontWeight: '600', flex: 1 }}
                        numberOfLines={1}
                      >
                        {pr.name}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#5b21b6', fontSize: 16, fontWeight: '800' }}>
                        {pr.weight_kg === 0 ? 'BW' : `${pr.weight_kg} kg`}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
