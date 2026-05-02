import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { closeGoal } from '../../services/goals';
import GoalSheet from '../../components/GoalSheet';
import { showError, showSuccess } from '../../services/toast';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Active:    { bg: '#ede9fe', text: '#6d28d9' },
  Paused:    { bg: '#fef3c7', text: '#d97706' },
  Completed: { bg: '#dcfce7', text: '#16a34a' },
  Abandoned: { bg: '#fee2e2', text: '#dc2626' },
};

const GOAL_META: Record<string, { icon: string; color: string; bg: string }> = {
  WeightLoss: { icon: 'scale-outline',   color: '#0284c7', bg: '#e0f2fe' },
  MuscleGain: { icon: 'body-outline',    color: '#7c3aed', bg: '#ede9fe' },
  Strength:   { icon: 'barbell-outline', color: '#d97706', bg: '#fef3c7' },
  Endurance:  { icon: 'walk-outline',    color: '#16a34a', bg: '#dcfce7' },
  Custom:     { icon: 'flag-outline',    color: '#6b7280', bg: '#f3f4f6' },
};


export default function GoalDetail() {
  const { goal: goalParam } = useLocalSearchParams<{ goal: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState<any>(() => JSON.parse(goalParam ?? '{}'));
  const [editVisible, setEditVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const s    = STATUS_STYLES[goal.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
  const meta = GOAL_META[goal.type]  ?? GOAL_META.Custom;

  // progress_pct comes from the API (0–100), hidden target managed server-side
  const progress: number = Math.round(goal.progress_pct ?? 0);

  const handleClose = () => {
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to close this goal? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setClosing(true);
            try {
              const res = await closeGoal(goal.id);
              if (res.ok) {
                showSuccess('Goal completed!');
                router.back();
              } else {
                showError('Error', res.body?.detail ?? 'Could not close this goal.');
              }
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Goal Details</Text>
          {goal.status === 'Active' && (
            <Pressable onPress={() => setEditVisible(true)} style={styles.actionBtn}>
              <Ionicons name="pencil" size={17} color="#fff" />
            </Pressable>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Main card */}
          <View style={styles.mainCard}>
            {/* Icon + type + status */}
            <View style={styles.goalHeader}>
              <View style={[styles.goalIconWrap, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon as any} size={28} color={meta.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.goalType}>{goal.type}</Text>
                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusTxt, { color: s.text }]}>{goal.status}</Text>
                </View>
              </View>
            </View>

            {goal.description ? (
              <Text style={styles.goalDesc}>{goal.description}</Text>
            ) : null}

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercent}>{progress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <View style={styles.autoTrackRow}>
                <Ionicons name="sync-outline" size={12} color="#9ca3af" />
                <Text style={styles.autoTrackTxt}>Automatically tracked from your sessions</Text>
              </View>
            </View>

            {/* Dates */}
            <View style={styles.datesRow}>
              {goal.start_date && (
                <View style={styles.dateCard}>
                  <View style={styles.dateIconRow}>
                    <Ionicons name="calendar-outline" size={13} color="#7c3aed" />
                    <Text style={styles.dateLbl}>Start Date</Text>
                  </View>
                  <Text style={styles.dateVal}>
                    {new Date(goal.start_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
              {goal.due_date && (
                <View style={styles.dateCard}>
                  <View style={styles.dateIconRow}>
                    <Ionicons name="flag-outline" size={13} color="#7c3aed" />
                    <Text style={styles.dateLbl}>Due Date</Text>
                  </View>
                  <Text style={styles.dateVal}>
                    {new Date(goal.due_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Mark Completed */}
          {goal.status === 'Active' && (
            <Pressable onPress={handleClose} disabled={closing} style={styles.completeBtn}>
              {closing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.completeBtnTxt}>Mark as Completed</Text>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>

        <GoalSheet
          visible={editVisible}
          mode="update"
          goalId={goal.id}
          initialValues={goal}
          onClose={() => setEditVisible(false)}
          onUpdated={updated => { setGoal(updated); setEditVisible(false); }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Main card
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalType: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalDesc: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 14,
  },
  // Progress
  progressSection: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 5,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressMetaTxt: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressPercent: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '700',
  },
  autoTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  autoTrackTxt: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Dates
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 12,
  },
  dateIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dateLbl: {
    fontSize: 11,
    color: '#a78bfa',
    fontWeight: '600',
  },
  dateVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5b21b6',
  },
  // Complete button
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 18,
    paddingVertical: 15,
    marginHorizontal: 20,
  },
  completeBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
