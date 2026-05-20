import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getUnreadCount } from '../../services/notifications';
import * as StoreReview from 'expo-store-review';
import * as SecureStore from 'expo-secure-store';
import { getProfile, createProfile } from '../../services/profiles';
import { getPlannedSessions, getCompletedSessions } from '../../services/sessions';
import { generatePlan } from '../../services/planner';
import ProfileSheet from '../../components/ProfileSheet';
import GoalSheet from '../../components/GoalSheet';
import { authStore } from '../../store/auth';
import { ProfileStore } from 'store/profile';
import { showError, showSuccess } from '../../services/toast';

const REVIEW_KEY = 'terraform_review_requested';
const REVIEW_THRESHOLD = 3;

type Session = {
  id: number;
  status: string;
  title: string;
  created: string;
  updated: string;
  completed_at?: string;
  exercises: any[];
  plan_payload?: {
    title?: string;
    summary?: string;
    estimated_duration_minutes?: number;
    intensity?: string;
    exercises?: any[];
  };
  estimated_duration_minutes?: number;
  feedback?: any;
};

// ── Skeleton placeholder ────────────────────────────────────

function SkeletonCard({ height }: { height: number }) {
  return (
    <View style={[styles.skeletonCard, { height }]} />
  );
}

// ─────────────────────────────────────────────────────────────

const EMPTY_SESSIONS: Session[] = [];

export default function HomeTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [initialProfileValues, setInitialProfileValues] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [plannedSession, setPlannedSession] = useState<any | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const maybeRequestReview = async (count: number) => {
    try {
      if (count < REVIEW_THRESHOLD) return;
      const already = await SecureStore.getItemAsync(REVIEW_KEY);
      if (already) return;
      const available = await StoreReview.isAvailableAsync();
      if (!available) return;
      await StoreReview.requestReview();
      await SecureStore.setItemAsync(REVIEW_KEY, '1');
    } catch { /* best-effort */ }
  };

  const loadHomeData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setCheckingProfile(true);

    try {
      const profileRes = await getProfile();
      if (profileRes.ok) {
        authStore.set({ user: profileRes.body });
        setInitialProfileValues(profileRes.body);
        const first = profileRes.body.first_name ?? profileRes.body.firstName ?? '';
        const last  = profileRes.body.last_name  ?? profileRes.body.lastName  ?? '';
        setDisplayName([first, last].filter(Boolean).join(' '));
        ProfileStore.set({ first_name: first, last_name: last, gender: profileRes.body.gender, height: profileRes.body.height, weight: profileRes.body.weight });
      } else if (profileRes.status === 404) {
        setProfileSheetVisible(true);
      }

      const plannedRes = await getPlannedSessions();
      setPlannedSession(plannedRes.ok && plannedRes.body ? plannedRes.body : null);

      const completedRes = await getCompletedSessions();
      if (completedRes.ok && Array.isArray(completedRes.body)) {
        setCompletedSessions(completedRes.body);
        maybeRequestReview(completedRes.body.length);
      } else {
        setCompletedSessions(EMPTY_SESSIONS);
      }
    } catch (e) {
      console.error('Home load error', e);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setCheckingProfile(false);
    }
  };

  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) await loadHomeData(false); })();
    return () => { mounted = false; };
  }, []);

  const onGenerateSession = async () => {
    setGenerating(true);
    try {
      const res = await generatePlan();
      if (res.ok) {
        showSuccess('Session Generated', 'Your personalised session is ready.');
        await loadHomeData(false);
      } else if (res?.body?.detail === 'User has no goals') {
        setGoalSheetVisible(true);
      } else {
        showError('Generation Failed', 'Could not generate a session. Please try again.');
      }
    } catch {
      showError('Generation Error', 'An unexpected error occurred.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>
      {/* Fixed top section */}
      <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
        {/* Greeting + Bell */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {displayName ? `Hey, ${displayName.split(' ')[0]}` : 'Welcome back'}
            </Text>
            <Text style={styles.greetingSub}>Ready for today's session?</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/notifications')}
            style={{ position: 'relative', padding: 4, marginTop: -2 }}
          >
            <Ionicons name="notifications-outline" size={24} color="rgba(255,255,255,0.8)" />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute', top: 2, right: 2,
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: '#ef4444',
                borderWidth: 1.5, borderColor: '#7c3aed',
              }} />
            )}
          </Pressable>
        </View>

        {/* Planned session card / skeleton / generate */}
        {checkingProfile ? (
          <SkeletonCard height={116} />
        ) : plannedSession ? (
          <Pressable
            onPress={() => router.push({
              pathname: '/(tabs)/session-details',
              params: { session: JSON.stringify(plannedSession) },
            })}
            style={styles.sessionCard}
          >
            <View style={styles.sessionCardTop}>
              <View style={styles.sessionCardLabel}>
                <Ionicons name="time-outline" size={12} color="#7c3aed" />
                <Text style={styles.sessionCardLabelTxt}>Planned Session</Text>
              </View>
              {plannedSession.plan_payload?.intensity && (
                <View style={styles.intensityBadge}>
                  <Text style={styles.intensityBadgeTxt}>{plannedSession.plan_payload.intensity}</Text>
                </View>
              )}
            </View>
            <Text style={styles.sessionTitle} numberOfLines={2}>
              {plannedSession.plan_payload?.title || plannedSession.title}
            </Text>
            <View style={styles.sessionMeta}>
              {plannedSession.plan_payload?.estimated_duration_minutes && (
                <View style={styles.sessionMetaItem}>
                  <Ionicons name="time-outline" size={13} color="#9ca3af" />
                  <Text style={styles.sessionMetaTxt}>
                    {plannedSession.plan_payload.estimated_duration_minutes} min
                  </Text>
                </View>
              )}
              {plannedSession.plan_payload?.exercises?.length > 0 && (
                <View style={styles.sessionMetaItem}>
                  <Ionicons name="list-outline" size={13} color="#9ca3af" />
                  <Text style={styles.sessionMetaTxt}>
                    {plannedSession.plan_payload.exercises.length} exercises
                  </Text>
                </View>
              )}
              <View style={styles.sessionTap}>
                <Text style={styles.sessionTapTxt}>View details</Text>
                <Ionicons name="chevron-forward" size={12} color="#7c3aed" />
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.generateCard}>
            <View style={styles.generateIcon}>
              <Ionicons name="sparkles-outline" size={24} color="#7c3aed" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.generateTitle}>No session planned</Text>
              <Text style={styles.generateSub}>Generate an AI-personalised workout now</Text>
            </View>
            <Pressable
              onPress={onGenerateSession}
              disabled={generating}
              style={[styles.generateBtn, generating && { opacity: 0.7 }]}
            >
              {generating ? (
                <Text style={styles.generateBtnTxt}>Generating...</Text>
              ) : (
                <Text style={styles.generateBtnTxt}>Generate</Text>
              )}
            </Pressable>
          </View>
        )}

        <Text style={styles.completedLabel}>Completed Sessions</Text>
      </View>

      {/* Scrollable completed sessions */}
      <FlatList
        data={checkingProfile ? [] : completedSessions}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHomeData(true)}
            tintColor="#fff"
            colors={['#7c3aed']}
          />
        }
        ListHeaderComponent={
          checkingProfile ? (
            <View style={{ gap: 8 }}>
              <SkeletonCard height={68} />
              <SkeletonCard height={68} />
              <SkeletonCard height={68} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !checkingProfile ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="barbell-outline" size={28} color="#a78bfa" />
              </View>
              <Text style={styles.emptyTitle}>No completed sessions yet</Text>
              <Text style={styles.emptySub}>
                Start and complete your first session to see it here
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const title = item.plan_payload?.title || item.title || `Session #${item.id}`;
          const rawDate = item.completed_at ?? item.updated ?? item.created;
          const dateLabel = rawDate
            ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
          const duration = item.plan_payload?.estimated_duration_minutes ?? item.estimated_duration_minutes;
          const exercisesCount = item.plan_payload?.exercises?.length ?? item.exercises?.length ?? 0;

          return (
            <Pressable
              onPress={() => router.push({
                pathname: '/(tabs)/session-details',
                params: { session: JSON.stringify(item) },
              })}
              style={styles.completedCard}
            >
              <View style={styles.completedCardLeft}>
                <View style={styles.completedCheck}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.completedTitle} numberOfLines={1}>{title}</Text>
                <View style={styles.completedMeta}>
                  {dateLabel && (
                    <View style={styles.completedMetaItem}>
                      <Ionicons name="calendar-outline" size={11} color="#9ca3af" />
                      <Text style={styles.completedMetaTxt}>{dateLabel}</Text>
                    </View>
                  )}
                  {duration ? (
                    <View style={styles.completedMetaItem}>
                      <Ionicons name="time-outline" size={11} color="#9ca3af" />
                      <Text style={styles.completedMetaTxt}>{duration} min</Text>
                    </View>
                  ) : null}
                  {exercisesCount > 0 ? (
                    <View style={styles.completedMetaItem}>
                      <Ionicons name="list-outline" size={11} color="#9ca3af" />
                      <Text style={styles.completedMetaTxt}>{exercisesCount} exercises</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </Pressable>
          );
        }}
      />

      <ProfileSheet
        visible={profileSheetVisible}
        initialValues={initialProfileValues}
        mode={initialProfileValues ? 'update' : 'create'}
        onSubmitProfile={async (payload) => {
          const existingUser = authStore.get().user;
          const res = existingUser ? { ok: true, body: payload } : await createProfile(payload);
          if (res.ok) {
            authStore.set({ user: res.body });
            setProfileSheetVisible(false);
          } else {
            throw new Error(JSON.stringify(res.body));
          }
          return res;
        }}
        onSuccess={profile => {
          authStore.set({ user: profile });
          setProfileSheetVisible(false);
        }}
      />
      <GoalSheet
        visible={goalSheetVisible}
        onClose={() => setGoalSheetVisible(false)}
        onCreated={async () => {
          setGoalSheetVisible(false);
          setGenerating(true);
          try { await generatePlan(); await loadHomeData(false); }
          finally { setGenerating(false); }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  greetingSub: {
    color: '#c4b5fd',
    fontSize: 14,
    marginTop: 2,
    marginBottom: 16,
  },
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    marginBottom: 14,
  },
  // Planned session card
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessionCardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionCardLabelTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  intensityBadge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  intensityBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 10,
    lineHeight: 26,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sessionMetaTxt: { fontSize: 12, color: '#9ca3af' },
  sessionTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto' as any,
  },
  sessionTapTxt: { fontSize: 12, color: '#7c3aed', fontWeight: '700' },
  // Generate card
  generateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  generateIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  generateSub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  generateBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginLeft: 10,
  },
  generateBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  completedLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 4,
  },
  // Completed session rows
  completedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  completedCardLeft: {
    marginRight: 12,
  },
  completedCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  completedMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  completedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  completedMetaTxt: { fontSize: 11, color: '#9ca3af' },
  // Empty state
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#c4b5fd', fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
