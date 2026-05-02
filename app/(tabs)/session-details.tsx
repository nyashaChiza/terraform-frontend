import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { startSession, completeSession, addFeedback } from '../../services/sessions';
import { showError, showSuccess } from '../../services/toast';
import FeedbackSheet from '../../components/FeedbackSheet';
import RestTimer from '../../components/RestTimer';

type Exercise = {
  exercise_id: number;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes: string;
  suggested_weight_kg?: number;
};

type Session = {
  id: number;
  status: string;
  title: string;
  created: string;
  exercises: any[];
  plan_payload?: {
    title: string;
    summary: string;
    goal_progress_feedback: string;
    estimated_duration_minutes: number;
    intensity: string;
    exercises: Exercise[];
  };
  summary?: string;
  intensity?: string;
  goal_progress_feedback?: string;
  completed_at?: string;
  started_at?: string;
  feedback?: {
    soreness_per_muscle: Record<string, number>;
    joint_pain: boolean;
    effort_rating: number;
    energy_level: number;
    summary: string;
    weights_used?: { exercise_id: number; name: string; weight_kg: number }[];
  };
};

const INTENSITY_COLOR: Record<string, { bg: string; text: string }> = {
  Low:      { bg: '#dcfce7', text: '#16a34a' },
  Medium:   { bg: '#fef3c7', text: '#b45309' },
  High:     { bg: '#fee2e2', text: '#dc2626' },
  Moderate: { bg: '#fef3c7', text: '#b45309' },
};

export default function SessionDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session: sessionParam } = useLocalSearchParams<{ session: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  const [feedbackSheetVisible, setFeedbackSheetVisible] = useState(false);
  const [restTimerVisible, setRestTimerVisible] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(60);

  useEffect(() => {
    if (sessionParam) {
      try { setSession(JSON.parse(sessionParam)); }
      catch { console.error('Failed to parse session'); }
    }
  }, [sessionParam]);

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Loading session...</Text>
      </View>
    );
  }

  const isCompleted = !!(session as any).completed_at || session.status === 'COMPLETED';
  const isStarted   = session.status === 'STARTED';
  const isPlanned   = !isCompleted && !isStarted;
  const hasFeedback = session.feedback != null;

  const exercises: Exercise[] = session.plan_payload?.exercises || session.exercises || [];
  const summary      = session.plan_payload?.summary || session.summary;
  const intensity    = session.plan_payload?.intensity || session.intensity;
  const goalFeedback = session.plan_payload?.goal_progress_feedback || session.goal_progress_feedback;
  const duration     = session.plan_payload?.estimated_duration_minutes;
  const title        = session.plan_payload?.title || session.title || `Session #${session.id}`;
  const intensityStyle = INTENSITY_COLOR[intensity ?? ''] ?? { bg: '#f3f4f6', text: '#374151' };

  const muscleGroups = Array.from(
    new Set(exercises.map((ex: any) => ex.muscle_group).filter(Boolean))
  ) as string[];

  const handleStart = async () => {
    setStartingSession(true);
    try {
      const res = await startSession(session.id);
      if (res.ok) {
        setSession(s => ({ ...s!, ...res.body, status: 'STARTED' }));
        showSuccess('Session started', 'Your workout has begun. Give it everything!');
      } else {
        showError('Error', 'Could not start the session.');
      }
    } catch { showError('Error', 'Unexpected error.'); }
    finally { setStartingSession(false); }
  };

  const handleComplete = async () => {
    setCompletingSession(true);
    try {
      const res = await completeSession(session.id);
      if (res.ok) {
        setSession(s => ({ ...s!, ...res.body, status: 'COMPLETED' }));
        showSuccess('Session complete', 'Great work! Add feedback to track your progress.');
      } else {
        showError('Error', 'Could not complete the session.');
      }
    } catch { showError('Error', 'Unexpected error.'); }
    finally { setCompletingSession(false); }
  };

  const handleSubmitFeedback = async (feedback: any) => {
    const res = await addFeedback(session.id, feedback);
    if (res.ok) {
      setSession(s => ({ ...s!, feedback: res.body }));
      return res;
    }
    throw new Error('Failed to submit feedback');
  };

  const handleShare = async () => {
    const metaParts = [
      duration ? `${duration} min` : '',
      intensity ?? '',
    ].filter(Boolean).join('  ·  ');

    const exerciseLines = exercises.map((ex, idx) => {
      const setsReps =
        ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` :
        ex.sets ? `${ex.sets} sets` :
        ex.reps ? `${ex.reps} reps` : '';
      const weight =
        ex.suggested_weight_kg != null && ex.suggested_weight_kg > 0
          ? ` @ ${ex.suggested_weight_kg}kg`
          : '';
      return `  ${idx + 1}. ${ex.name || `Exercise ${idx + 1}`}${setsReps ? ` — ${setsReps}` : ''}${weight}`;
    });

    const message = [
      `Just completed a "${title}" session on Terraform!`,
      metaParts,
      ...(exercises.length > 0 ? ['', 'Exercises:', ...exerciseLines] : []),
      '',
      'AI-powered workouts personalised to my goals.',
      '#TerraformFit',
    ].filter(Boolean).join('\n');

    try { await Share.share({ message, title: 'My Workout — Terraform' }); }
    catch { /* dismissed */ }
  };

  const openRestTimer = (secs?: number) => {
    setRestTimerSeconds(secs ?? 60);
    setRestTimerVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top + 12 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Sticky-style header ── */}
        <View style={styles.pageHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.pageTitle} numberOfLines={2}>{title}</Text>
          {isCompleted && (
            <Pressable onPress={handleShare} style={styles.headerIconBtn}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* ── Status & meta badges ── */}
        <View style={styles.badgeRow}>
          {/* Status */}
          <View style={[
            styles.statusBadge,
            isCompleted ? styles.statusCompleted : isStarted ? styles.statusStarted : styles.statusPlanned,
          ]}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : isStarted ? 'play-circle' : 'time-outline'}
              size={13}
              color={isCompleted ? '#16a34a' : isStarted ? '#d97706' : '#60a5fa'}
            />
            <Text style={[
              styles.statusTxt,
              { color: isCompleted ? '#16a34a' : isStarted ? '#d97706' : '#93c5fd' },
            ]}>
              {isCompleted ? 'Completed' : isStarted ? 'In Progress' : 'Planned'}
            </Text>
          </View>

          {/* Intensity */}
          {intensity && (
            <View style={[styles.metaBadge, { backgroundColor: `${intensityStyle.bg}22` }]}>
              <Ionicons name="flash-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaBadgeTxt}>{intensity}</Text>
            </View>
          )}

          {/* Duration */}
          {duration && (
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaBadgeTxt}>{duration} min</Text>
            </View>
          )}

          {/* Exercise count */}
          {exercises.length > 0 && (
            <View style={styles.metaBadge}>
              <Ionicons name="list-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaBadgeTxt}>{exercises.length} exercises</Text>
            </View>
          )}
        </View>

        {/* ── Rest Timer quick-launch (active sessions) ── */}
        {isStarted && (
          <Pressable onPress={() => openRestTimer(60)} style={styles.restTimerBanner}>
            <Ionicons name="timer-outline" size={20} color="#7c3aed" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.restTimerTitle}>Rest Timer</Text>
              <Text style={styles.restTimerSub}>Tap to launch a countdown between sets</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </Pressable>
        )}

        {/* ── Summary ── */}
        {summary && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Workout Summary</Text>
            <Text style={styles.cardBody}>{summary}</Text>
          </View>
        )}

        {/* ── Goal Feedback ── */}
        {goalFeedback && (
          <View style={styles.goalFeedbackCard}>
            <View style={styles.goalFeedbackHeader}>
              <Ionicons name="trending-up-outline" size={16} color="#a78bfa" />
              <Text style={styles.goalFeedbackLabel}>Progress Note</Text>
            </View>
            <Text style={styles.goalFeedbackBody}>{goalFeedback}</Text>
          </View>
        )}

        {/* ── Exercises ── */}
        {exercises.length > 0 && (
          <View style={{ marginBottom: 6 }}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            {exercises.map((ex, idx) => (
              <View key={ex.exercise_id || idx} style={styles.exerciseCard}>
                {/* Number + Name */}
                <View style={styles.exHeader}>
                  <View style={styles.exNum}>
                    <Text style={styles.exNumTxt}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.exName} numberOfLines={1}>{ex.name || `Exercise ${idx + 1}`}</Text>
                    {ex.muscle_group && (
                      <View style={styles.muscleTag}>
                        <Text style={styles.muscleTagTxt}>{ex.muscle_group}</Text>
                      </View>
                    )}
                  </View>
                  {/* Rest timer per-exercise */}
                  {isStarted && ex.rest_seconds && (
                    <Pressable onPress={() => openRestTimer(ex.rest_seconds)} style={styles.exRestBtn}>
                      <Ionicons name="timer-outline" size={14} color="#7c3aed" />
                      <Text style={styles.exRestBtnTxt}>{ex.rest_seconds}s</Text>
                    </Pressable>
                  )}
                </View>

                {/* Stats row */}
                {(ex.sets || ex.reps || ex.rest_seconds) && (
                  <View style={styles.exStats}>
                    {ex.sets && (
                      <View style={styles.exStat}>
                        <Text style={styles.exStatVal}>{ex.sets}</Text>
                        <Text style={styles.exStatLbl}>Sets</Text>
                      </View>
                    )}
                    {ex.reps && (
                      <View style={styles.exStat}>
                        <Text style={styles.exStatVal}>{ex.reps}</Text>
                        <Text style={styles.exStatLbl}>Reps</Text>
                      </View>
                    )}
                    {ex.rest_seconds && (
                      <View style={styles.exStat}>
                        <Text style={styles.exStatVal}>{ex.rest_seconds}s</Text>
                        <Text style={styles.exStatLbl}>Rest</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Weight + Notes */}
                <View style={styles.exFooter}>
                  {ex.suggested_weight_kg != null && (
                    <View style={styles.weightBadge}>
                      <Ionicons name="barbell-outline" size={13} color="#7c3aed" />
                      <Text style={styles.weightBadgeTxt}>
                        {ex.suggested_weight_kg === 0 ? 'Bodyweight' : `${ex.suggested_weight_kg} kg suggested`}
                      </Text>
                    </View>
                  )}
                  {ex.notes && (
                    <View style={styles.noteBadge}>
                      <Ionicons name="bulb-outline" size={13} color="#b45309" />
                      <Text style={styles.noteTxt} numberOfLines={2}>{ex.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Feedback display (completed sessions) ── */}
        {isCompleted && hasFeedback && session.feedback && (
          <View style={{ marginBottom: 6 }}>
            <Text style={styles.sectionTitle}>Session Feedback</Text>

            {/* Ratings */}
            <View style={[styles.card, { flexDirection: 'row', gap: 0 }]}>
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                <Text style={styles.ratingVal}>{session.feedback.effort_rating}<Text style={styles.ratingOf}>/5</Text></Text>
                <Text style={styles.ratingLbl}>Effort</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#f3f4f6', marginVertical: 4 }} />
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                <Text style={styles.ratingVal}>{session.feedback.energy_level}<Text style={styles.ratingOf}>/5</Text></Text>
                <Text style={styles.ratingLbl}>Energy</Text>
              </View>
              {session.feedback.joint_pain && (
                <>
                  <View style={{ width: 1, backgroundColor: '#f3f4f6', marginVertical: 4 }} />
                  <View style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                    <Ionicons name="alert-circle" size={22} color="#dc2626" />
                    <Text style={[styles.ratingLbl, { color: '#dc2626' }]}>Joint Pain</Text>
                  </View>
                </>
              )}
            </View>

            {/* Soreness */}
            {Object.keys(session.feedback.soreness_per_muscle || {}).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Muscle Soreness</Text>
                {Object.entries(session.feedback.soreness_per_muscle).map(([muscle, val]) => (
                  <View key={muscle} style={styles.sorenessRow}>
                    <Text style={styles.sorenessName}>{muscle}</Text>
                    <View style={styles.soreness}>
                      {[1,2,3,4,5].map(n => (
                        <View key={n} style={[styles.sorenessDot, n <= val && styles.sorenessDotActive]} />
                      ))}
                    </View>
                    <Text style={styles.sorenessVal}>{val}/5</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Weights */}
            {(session.feedback.weights_used ?? []).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Weights Lifted</Text>
                {session.feedback.weights_used!.map(w => (
                  <View key={w.exercise_id} style={styles.weightRow}>
                    <Ionicons name="barbell-outline" size={14} color="#9ca3af" style={{ marginRight: 8 }} />
                    <Text style={styles.weightName} numberOfLines={1}>{w.name}</Text>
                    <Text style={styles.weightKg}>{w.weight_kg === 0 ? 'BW' : `${w.weight_kg} kg`}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Summary note */}
            {session.feedback.summary && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Notes</Text>
                <Text style={styles.cardBody}>{session.feedback.summary}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Action Buttons ── */}
        <View style={{ gap: 10, marginTop: 8 }}>
          {isPlanned && (
            <Pressable
              onPress={handleStart}
              disabled={startingSession}
              style={styles.primaryBtn}
            >
              <Ionicons name="play-circle-outline" size={20} color="#7c3aed" />
              <Text style={styles.primaryBtnTxt}>
                {startingSession ? 'Starting...' : 'Start Session'}
              </Text>
            </Pressable>
          )}
          {isStarted && (
            <Pressable
              onPress={handleComplete}
              disabled={completingSession}
              style={styles.primaryBtn}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#7c3aed" />
              <Text style={styles.primaryBtnTxt}>
                {completingSession ? 'Saving...' : 'Complete Session'}
              </Text>
            </Pressable>
          )}
          {isCompleted && !hasFeedback && (
            <Pressable onPress={() => setFeedbackSheetVisible(true)} style={styles.primaryBtn}>
              <Ionicons name="chatbubble-outline" size={20} color="#7c3aed" />
              <Text style={styles.primaryBtnTxt}>Add Feedback</Text>
            </Pressable>
          )}
          {isCompleted && (
            <Pressable onPress={handleShare} style={styles.secondaryBtn}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.secondaryBtnTxt}>Share This Workout</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.back()} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnTxt}>Go Back</Text>
          </Pressable>
        </View>
      </ScrollView>

      <FeedbackSheet
        visible={feedbackSheetVisible}
        muscleGroups={muscleGroups}
        exercises={exercises}
        onClose={() => setFeedbackSheetVisible(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
      <RestTimer
        visible={restTimerVisible}
        defaultSeconds={restTimerSeconds}
        onClose={() => setRestTimerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pageTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  // Badge row
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusCompleted: { backgroundColor: 'rgba(22,163,74,0.15)' },
  statusStarted:   { backgroundColor: 'rgba(217,119,6,0.15)' },
  statusPlanned:   { backgroundColor: 'rgba(96,165,250,0.15)' },
  statusTxt: { fontSize: 12, fontWeight: '700' },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  metaBadgeTxt: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  // Rest timer banner
  restTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  restTimerTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  restTimerSub:   { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  // Generic cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  cardBody: { fontSize: 14, color: '#374151', lineHeight: 21 },
  // Goal feedback banner
  goalFeedbackCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  goalFeedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  goalFeedbackLabel: { fontSize: 12, fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 0.5 },
  goalFeedbackBody: { fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  // Section title
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  // Exercise cards
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  exHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumTxt: { fontSize: 12, fontWeight: '800', color: '#7c3aed' },
  exName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  muscleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 3,
  },
  muscleTagTxt: { fontSize: 10, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' },
  exRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  exRestBtnTxt: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  exStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  exStat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  exStatVal: { fontSize: 20, fontWeight: '800', color: '#5b21b6' },
  exStatLbl: { fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: '600' },
  exFooter: { gap: 6 },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  weightBadgeTxt: { fontSize: 13, color: '#5b21b6', fontWeight: '600' },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  noteTxt: { fontSize: 13, color: '#78350f', flex: 1, lineHeight: 18 },
  // Feedback display
  ratingVal: { fontSize: 28, fontWeight: '800', color: '#5b21b6' },
  ratingOf:  { fontSize: 14, color: '#9ca3af', fontWeight: '400' },
  ratingLbl: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontWeight: '600' },
  sorenessRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sorenessName: { flex: 1, fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  soreness: { flexDirection: 'row', gap: 3, marginHorizontal: 10 },
  sorenessDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e5e7eb' },
  sorenessDotActive: { backgroundColor: '#7c3aed' },
  sorenessVal: { fontSize: 12, color: '#9ca3af', width: 28, textAlign: 'right' },
  weightRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#f9fafb' },
  weightName: { flex: 1, fontSize: 13, color: '#374151' },
  weightKg: { fontSize: 14, fontWeight: '800', color: '#5b21b6' },
  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnTxt: { fontSize: 16, fontWeight: '800', color: '#7c3aed' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 15,
    borderRadius: 18,
  },
  secondaryBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  ghostBtnTxt: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
});
