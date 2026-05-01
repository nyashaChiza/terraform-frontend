import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
const REVIEW_THRESHOLD = 3; // request review after 3rd completed session

type Session = {
  id: number;
  session_id: number;
  status: string;
  actual_date: string;
  completed: boolean;
  created: string;
  updated: string;
  title: string;
  exercises: any[];
  feedback: {
    soreness_per_muscle: Record<string, number>;
    joint_pain: boolean;
    effort_rating: number;
    energy_level: number;
    summary: string;
    id: number;
    logged_session_id: number;
    created: string;
    updated: string;
  };
};

// ── Skeleton card ─────────────────────────────────────────────

function SkeletonCard({ height = 100 }: { height?: number }) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 24,
        height,
        marginBottom: 12,
      }}
    />
  );
}

function SkeletonRow() {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 16,
        height: 72,
        marginBottom: 10,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────

const completedSessionsPlaceholder: Session[] = [];

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

  // ── In-app review ──────────────────────────────────────────

  const maybeRequestReview = async (completedCount: number) => {
    try {
      if (completedCount < REVIEW_THRESHOLD) return;
      const already = await SecureStore.getItemAsync(REVIEW_KEY);
      if (already) return;
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return;
      await StoreReview.requestReview();
      await SecureStore.setItemAsync(REVIEW_KEY, '1');
    } catch {
      // Review request is best-effort; never crash on it
    }
  };

  // ── Data loading ───────────────────────────────────────────

  const loadHomeData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setCheckingProfile(true);
    }

    try {
      const profileRes = await getProfile();

      if (profileRes.ok) {
        authStore.set({ user: profileRes.body });
        setInitialProfileValues(profileRes.body);
        const first = profileRes.body.first_name ?? profileRes.body.firstName ?? profileRes.body.first ?? '';
        const last = profileRes.body.last_name ?? profileRes.body.lastName ?? profileRes.body.last ?? '';
        setDisplayName([first, last].filter(Boolean).join(' '));
        ProfileStore.set({
          first_name: first,
          last_name: last,
          gender: profileRes.body.gender,
          height: profileRes.body.height,
          weight: profileRes.body.weight,
        });
      } else if (profileRes.status === 404) {
        setProfileSheetVisible(true);
      } else {
        console.warn('Profile fetch failed:', profileRes);
      }

      const plannedRes = await getPlannedSessions();
      setPlannedSession(plannedRes.ok && plannedRes.body ? plannedRes.body : null);

      const completedRes = await getCompletedSessions();
      if (completedRes.ok && Array.isArray(completedRes.body)) {
        setCompletedSessions(completedRes.body);
        maybeRequestReview(completedRes.body.length);
      } else {
        setCompletedSessions(completedSessionsPlaceholder);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      if (showRefreshIndicator) setRefreshing(false);
      else setCheckingProfile(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initialLoad = async () => { if (mounted) await loadHomeData(false); };
    initialLoad();
    return () => { mounted = false; };
  }, []);

  const onRefresh = async () => loadHomeData(true);

  const onProfileSubmit = async (payload: any) => {
    const existingUser = authStore.get().user;
    let res;
    if (existingUser) {
      res = { ok: true, body: payload };
    } else {
      res = await createProfile(payload);
    }
    if (res.ok) {
      authStore.set({ user: res.body });
      setProfileSheetVisible(false);
      return res;
    }
    throw new Error(JSON.stringify(res.body));
  };

  const onGenerateSession = async () => {
    setGenerating(true);
    try {
      const res = await generatePlan();
      if (res.ok) {
        showSuccess('Session Generated', 'Your personalised session has been created.');
        await loadHomeData(false);
      } else if (res?.body?.detail === 'User has no goals') {
        setGoalSheetVisible(true);
      } else {
        showError('Generation Failed', 'Could not generate a session. Please try again later.');
      }
    } catch {
      showError('Generation Error', 'An error occurred while generating the session.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGoalCreated = async () => {
    setGoalSheetVisible(false);
    setGenerating(true);
    try {
      await generatePlan();
      await loadHomeData(false);
    } finally {
      setGenerating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-violet-700">
      {/* Static top section */}
      <View className="px-5" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-white text-3xl font-extrabold">
          Hey {displayName || '👋'}
        </Text>
        <Text className="text-violet-200 mb-6">Ready for your next session?</Text>

        {/* Planned Session / Skeleton */}
        {checkingProfile ? (
          <SkeletonCard height={120} />
        ) : plannedSession ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/session-details',
                params: { session: JSON.stringify(plannedSession) },
              })
            }
            className="bg-white rounded-3xl p-6 mb-6"
          >
            <Text className="text-xs text-gray-400 uppercase mb-1">Planned Session</Text>
            <Text className="text-2xl font-extrabold text-violet-800">{plannedSession.title}</Text>
            <View className="flex-row items-center gap-3 mt-3">
              {plannedSession.plan_payload?.estimated_duration_minutes && (
                <Text className="text-gray-500 text-sm">
                  ⏱ {plannedSession.plan_payload.estimated_duration_minutes} min
                </Text>
              )}
              {plannedSession.plan_payload?.intensity && (
                <View className="bg-violet-100 px-2 py-0.5 rounded-full">
                  <Text className="text-violet-700 text-xs font-semibold">
                    {plannedSession.plan_payload.intensity}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-violet-600 text-sm font-semibold mt-3">Tap to view →</Text>
          </Pressable>
        ) : (
          <View className="bg-white rounded-3xl p-6 mb-6">
            <Text className="text-xl font-extrabold text-violet-800 mb-2">No planned session</Text>
            <Text className="text-gray-500 mb-5">
              Generate a personalised AI workout plan for today
            </Text>
            <Pressable onPress={onGenerateSession} className="bg-violet-700 py-4 rounded-2xl items-center">
              <Text className="text-white font-bold text-base">
                {generating ? 'Generating...' : '✨ Generate Session'}
              </Text>
            </Pressable>
          </View>
        )}

        <Text className="text-white text-lg font-bold mb-3">Completed Sessions</Text>
      </View>

      {/* Scrolling sessions list */}
      <FlatList
        data={checkingProfile ? [] : completedSessions}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#7c3aed']}
          />
        }
        ListHeaderComponent={
          checkingProfile ? (
            <View>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !checkingProfile ? (
            <View className="items-center mt-10">
              <Text className="text-violet-200 text-sm">No completed sessions yet</Text>
              <Text className="text-violet-300 text-xs mt-1">
                Complete a session to see it here
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const title = item.plan_payload?.title || item.title || `Session #${item.id}`;
          const rawDate = item.completed_at ?? item.updated ?? item.created;
          const dateLabel = rawDate
            ? new Date(rawDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '';
          const duration =
            item.plan_payload?.estimated_duration_minutes ?? item.estimated_duration_minutes;
          const exercisesCount =
            item.plan_payload?.exercises?.length ?? item.exercises?.length ?? 0;
          const summary = item.plan_payload?.summary || item.summary || '';

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/session-details',
                  params: { session: JSON.stringify(item) },
                })
              }
              className="bg-white/95 rounded-2xl p-4 mb-3"
            >
              <Text className="font-bold text-violet-800">{title}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {dateLabel}
                {duration ? ` • ${duration} min` : ''}
                {exercisesCount ? ` • ${exercisesCount} exercises` : ''}
              </Text>
              {summary ? (
                <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                  {summary}
                </Text>
              ) : null}
              <Text className="text-green-600 text-xs mt-2 font-semibold">✓ Completed</Text>
            </Pressable>
          );
        }}
      />

      <ProfileSheet
        visible={profileSheetVisible}
        initialValues={initialProfileValues}
        mode={initialProfileValues ? 'update' : 'create'}
        onSubmitProfile={onProfileSubmit}
        onSuccess={profile => {
          authStore.set({ user: profile });
          setProfileSheetVisible(false);
        }}
      />
      <GoalSheet
        visible={goalSheetVisible}
        onClose={() => setGoalSheetVisible(false)}
        onCreated={handleGoalCreated}
      />
    </View>
  );
}
