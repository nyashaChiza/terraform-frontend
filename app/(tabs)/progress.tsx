import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStatsSummary, StatsSummary } from '../../services/stats';

// ─── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ style }: { style?: any }) {
  return <View style={[styles.skeleton, style]} />;
}

// ─── Weekly Bar Chart ──────────────────────────────────────────────────────

function WeeklyChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const BAR_MAX_H = 68;

  return (
    <View style={styles.chartRow}>
      {data.map((week, i) => {
        const filled = week.count > 0;
        const barH = filled ? Math.max((week.count / max) * BAR_MAX_H, 8) : 4;
        const isLatest = i === data.length - 1;
        return (
          <View key={i} style={styles.chartCol}>
            {filled && (
              <Text style={[styles.barLabel, isLatest && styles.barLabelActive]}>
                {week.count}
              </Text>
            )}
            <View
              style={[
                styles.bar,
                { height: barH },
                filled ? (isLatest ? styles.barActive : styles.barFilled) : styles.barEmpty,
              ]}
            />
            <Text
              style={[styles.chartXLabel, isLatest && styles.chartXLabelActive]}
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

// ─── Rank Icon ─────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) return (
    <View style={[styles.rankBadge, { backgroundColor: '#fef3c7' }]}>
      <Ionicons name="trophy" size={13} color="#d97706" />
    </View>
  );
  if (rank === 1) return (
    <View style={[styles.rankBadge, { backgroundColor: '#f3f4f6' }]}>
      <Ionicons name="ribbon" size={13} color="#9ca3af" />
    </View>
  );
  if (rank === 2) return (
    <View style={[styles.rankBadge, { backgroundColor: '#fff7ed' }]}>
      <Ionicons name="ribbon" size={13} color="#c2410c" />
    </View>
  );
  return (
    <View style={[styles.rankBadge, { backgroundColor: '#f9fafb' }]}>
      <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700' }}>{rank + 1}</Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

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
      if (res.ok && res.body) setStats(res.body);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const streakColor = (n: number) => n >= 7 ? '#dc2626' : n >= 3 ? '#ea580c' : n >= 1 ? '#7c3aed' : '#9ca3af';

  return (
    <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSub}>Your training at a glance</Text>
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
        {/* ── Loading ── */}
        {loading && (
          <View style={{ gap: 14, marginTop: 8 }}>
            <Skeleton style={{ height: 104, borderRadius: 20 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Skeleton style={{ flex: 1, height: 84, borderRadius: 16 }} />
              <Skeleton style={{ flex: 1, height: 84, borderRadius: 16 }} />
              <Skeleton style={{ flex: 1, height: 84, borderRadius: 16 }} />
            </View>
            <Skeleton style={{ height: 164, borderRadius: 20 }} />
            <Skeleton style={{ height: 220, borderRadius: 20 }} />
          </View>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={52} color="rgba(255,255,255,0.5)" />
            <Text style={styles.errorTitle}>Could not load stats</Text>
            <Text style={styles.errorSub}>Pull down to retry</Text>
            <Pressable onPress={() => loadStats()} style={styles.retryBtn}>
              <Text style={styles.retryBtnTxt}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* ── Content ── */}
        {!loading && !error && stats && (
          <>
            {/* Streak Banner */}
            <View style={[styles.card, styles.streakCard]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakValue}>
                  {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
                </Text>
                <Text style={styles.streakSub}>
                  {stats.streak === 0
                    ? 'Complete a session to start your streak'
                    : stats.streak >= 7
                    ? 'Incredible — you are on fire!'
                    : 'Keep going, train again tomorrow'}
                </Text>
              </View>
              <View style={[styles.streakIcon, { backgroundColor: `${streakColor(stats.streak)}22` }]}>
                <Ionicons
                  name={stats.streak > 0 ? 'flame' : 'moon-outline'}
                  size={34}
                  color={streakColor(stats.streak)}
                />
              </View>
            </View>

            {/* Stat Cards */}
            <View style={styles.statsRow}>
              {[
                { label: 'Total', value: stats.total_sessions, sub: 'sessions', icon: 'barbell-outline', color: '#7c3aed' },
                { label: 'This week', value: stats.sessions_this_week, sub: 'sessions', icon: 'calendar-outline', color: '#0284c7' },
                { label: 'PRs set', value: stats.total_prs, sub: 'exercises', icon: 'trophy-outline', color: '#d97706' },
              ].map(c => (
                <View key={c.label} style={[styles.card, styles.statCard]}>
                  <Ionicons name={c.icon as any} size={20} color={c.color} />
                  <Text style={[styles.statValue, { color: c.color }]}>{c.value}</Text>
                  <Text style={styles.statLabel}>{c.label}</Text>
                </View>
              ))}
            </View>

            {/* Weekly Activity */}
            <View style={[styles.card, styles.sectionCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart-outline" size={18} color="#5b21b6" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.sectionTitle}>Weekly Activity</Text>
                  <Text style={styles.sectionSub}>Sessions per week, last 8 weeks</Text>
                </View>
              </View>

              {stats.weekly_counts.every(w => w.count === 0) ? (
                <View style={styles.emptyInCard}>
                  <Ionicons name="bar-chart-outline" size={36} color="#d1d5db" />
                  <Text style={styles.emptyInCardTxt}>
                    Complete sessions to see your activity chart
                  </Text>
                </View>
              ) : (
                <WeeklyChart data={stats.weekly_counts} />
              )}
            </View>

            {/* Personal Records */}
            <View style={[styles.card, styles.sectionCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={18} color="#d97706" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.sectionTitle}>Personal Records</Text>
                  <Text style={styles.sectionSub}>Maximum weight lifted per exercise</Text>
                </View>
              </View>

              {stats.personal_records.length === 0 ? (
                <View style={styles.emptyInCard}>
                  <Ionicons name="ribbon-outline" size={36} color="#d1d5db" />
                  <Text style={styles.emptyInCardTxt}>
                    Submit session feedback with weights to track your PRs
                  </Text>
                </View>
              ) : (
                stats.personal_records.map((pr, i) => (
                  <View
                    key={pr.name}
                    style={[styles.prRow, i > 0 && styles.prRowBorder]}
                  >
                    <RankBadge rank={i} />
                    <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
                    <Text style={styles.prWeight}>
                      {pr.weight_kg === 0 ? 'Bodyweight' : `${pr.weight_kg} kg`}
                    </Text>
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

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  headerSub: {
    color: '#c4b5fd',
    fontSize: 14,
    marginTop: 2,
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4c1d95',
  },
  streakLabel: {
    color: '#ddd6fe',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  streakValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  streakSub: {
    color: '#c4b5fd',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  streakIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // Stat cards
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Section cards
  sectionCard: {
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  // Chart
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingTop: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '700',
    marginBottom: 3,
  },
  barLabelActive: {
    color: '#5b21b6',
  },
  bar: {
    width: '68%',
    borderRadius: 5,
  },
  barActive: {
    backgroundColor: '#7c3aed',
  },
  barFilled: {
    backgroundColor: '#c4b5fd',
  },
  barEmpty: {
    backgroundColor: '#f3f4f6',
    height: 4,
  },
  chartXLabel: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 4,
  },
  chartXLabelActive: {
    color: '#7c3aed',
    fontWeight: '700',
  },
  // PRs
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  prName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  prWeight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5b21b6',
  },
  // Empty states
  emptyInCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyInCardTxt: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 19,
  },
  errorState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  errorSub: {
    color: '#c4b5fd',
    fontSize: 14,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryBtnTxt: {
    color: '#7c3aed',
    fontWeight: '700',
  },
});
