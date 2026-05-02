import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getGoals } from '../../services/goals';
import GoalSheet from '../../components/GoalSheet';
import { showError } from '../../services/toast';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active:    { bg: '#ede9fe', text: '#6d28d9' },
  Paused:    { bg: '#fef3c7', text: '#d97706' },
  Completed: { bg: '#dcfce7', text: '#16a34a' },
  Abandoned: { bg: '#fee2e2', text: '#dc2626' },
};

// Map goal types to Ionicons names + accent colors
const GOAL_META: Record<string, { icon: string; color: string; bg: string }> = {
  WeightLoss: { icon: 'scale-outline',   color: '#0284c7', bg: '#e0f2fe' },
  MuscleGain: { icon: 'body-outline',    color: '#7c3aed', bg: '#ede9fe' },
  Strength:   { icon: 'barbell-outline', color: '#d97706', bg: '#fef3c7' },
  Endurance:  { icon: 'walk-outline',    color: '#16a34a', bg: '#dcfce7' },
  Custom:     { icon: 'flag-outline',    color: '#6b7280', bg: '#f3f4f6' },
};

export default function GoalsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const hasActiveGoal = goals.some(g => g.status === 'Active');

  const loadGoals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await getGoals();
      if (res.ok && Array.isArray(res.body)) setGoals(res.body);
      else setGoals([]);
    } catch {
      showError('Error', 'Could not load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  return (
    <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>
      <FlatList
        data={goals}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadGoals(true)}
            tintColor="#fff"
            colors={['#7c3aed']}
          />
        }
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.headerTitle}>Goals</Text>
            <Text style={styles.headerSub}>Track your fitness objectives</Text>

            {hasActiveGoal ? (
              <View style={styles.activeBanner}>
                <Ionicons name="information-circle-outline" size={16} color="#c4b5fd" style={{ marginRight: 8 }} />
                <Text style={styles.activeBannerTxt}>
                  Complete or close your active goal before creating a new one.
                </Text>
              </View>
            ) : (
              <Pressable onPress={() => setSheetVisible(true)} style={styles.newGoalBtn}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.newGoalBtnTxt}>New Goal</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="flag-outline" size={32} color="#a78bfa" />
              </View>
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptySub}>
                Set a goal to unlock AI-personalised workout sessions
              </Text>
            </View>
          ) : (
            <ActivityIndicator color="#fff" size="large" style={{ marginTop: 60 }} />
          )
        }
        renderItem={({ item }) => {
          const meta     = GOAL_META[item.type] ?? GOAL_META.Custom;
          const s        = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
          const progress = Math.round(item.progress_pct ?? 0);

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/goal-detail',
                  params: { goal: JSON.stringify(item) },
                })
              }
              style={styles.goalCard}
            >
              {/* Left icon */}
              <View style={[styles.goalIcon, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon as any} size={20} color={meta.color} />
              </View>

              {/* Content */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.goalCardHeader}>
                  <Text style={styles.goalType}>{item.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusTxt, { color: s.text }]}>{item.status}</Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.goalDesc} numberOfLines={1}>{item.description}</Text>
                ) : null}

                {/* Progress bar */}
                <View style={{ marginTop: 8 }}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
                  </View>
                  <View style={styles.progressMeta}>
                    <Text style={styles.progressMetaTxt}>Goal progress</Text>
                    <Text style={[styles.progressMetaTxt, { color: '#7c3aed', fontWeight: '700' }]}>
                      {progress}%
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.goalFooter}>
                  {item.due_date ? (
                    <View style={styles.dueDateRow}>
                      <Ionicons name="calendar-outline" size={11} color="#9ca3af" />
                      <Text style={styles.dueDateTxt}>
                        {new Date(item.due_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </Text>
                    </View>
                  ) : <View />}
                  {item.type !== 'Custom' && (
                    <View style={styles.autoTrackBadge}>
                      <Ionicons name="sync-outline" size={10} color="#7c3aed" />
                      <Text style={styles.autoTrackTxt}>auto-tracked</Text>
                    </View>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ marginLeft: 8 }} />
            </Pressable>
          );
        }}
      />

      <GoalSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCreated={() => { setSheetVisible(false); loadGoals(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    marginBottom: 16,
  },
  activeBanner: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activeBannerTxt: {
    color: '#ddd6fe',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  newGoalBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  newGoalBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    marginTop: 56,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  emptySub: {
    color: '#c4b5fd',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Goal cards
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  goalType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressMetaTxt: {
    fontSize: 11,
    color: '#9ca3af',
  },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDateTxt: {
    fontSize: 11,
    color: '#9ca3af',
  },
  autoTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  autoTrackTxt: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '600',
  },
});
