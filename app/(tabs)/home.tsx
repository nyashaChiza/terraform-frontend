import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getProfile, createProfile } from '../../services/profiles';
import { getPlannedSessions, getCompletedSessions } from '../../services/sessions';
import { generatePlan } from '../../services/planner';
import ProfileSheet from '../../components/ProfileSheet';
import GoalSheet from '../../components/GoalSheet';
import { authStore } from '../../store/auth';
import { ProfileStore } from 'store/profile';
import { showError, showSuccess } from '../../services/toast';

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

  // Centralized data loading function
  const loadHomeData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setCheckingProfile(true);
    }

    try {
      // Load profile
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
          weight: profileRes.body.weight
        });
      } else if (profileRes.status === 404) {
        setProfileSheetVisible(true);
      } else {
        console.warn('Profile fetch failed:', profileRes);
      }

      // Load planned sessions
      const plannedRes = await getPlannedSessions();
      if (plannedRes.body && plannedRes.body.detail != 'No planned sessions found') {
        const session = plannedRes.body;
        setPlannedSession(session);
      } else {
        setPlannedSession(null);
      }

      // Load completed sessions
      const completedRes = await getCompletedSessions();
      if (completedRes.ok && Array.isArray(completedRes.body)) {
        setCompletedSessions(completedRes.body);
      } else {
        console.warn('Failed to fetch completed sessions:', completedRes);
        setCompletedSessions(completedSessionsPlaceholder);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      if (showRefreshIndicator) {
        setRefreshing(false);
      } else {
        setCheckingProfile(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    let mounted = true;

    const initialLoad = async () => {
      setCheckingProfile(true);
      // Let home screen breathe for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!mounted) return;
      
      await loadHomeData(false);
    };

    initialLoad();
    return () => { mounted = false; };
  }, []);

  // Refresh handler for pull-to-refresh
  const onRefresh = async () => {
    await loadHomeData(true);
  };

  const onProfileSubmit = async (payload: any) => {
    try {
      const existingUser = authStore.get().user;
      let res;
      if (existingUser) {
        console.log('Updating profile', payload);
        res = { ok: true, body: payload };
      } else {
        res = await createProfile(payload);
      }

      if (res.ok) {
        authStore.set({ user: res.body });
        setProfileSheetVisible(false);
        return res;
      } else {
        throw new Error(JSON.stringify(res.body));
      }
    } catch (err: any) {
      throw err;
    }
  };

  const onGenerateSession = async () => {
    setGenerating(true);
    try {
      const res = await generatePlan();
      if (res.ok) {
        showSuccess('Session Generated', 'Your personalized session has been created.');
        // Refresh data to show new plan
        await loadHomeData(false);
      } else if (res?.body?.detail === 'User has no goals') {
        setGoalSheetVisible(true);
      } else {
        console.warn('Generate failed', res);
        showError('Generation Failed', 'Could not generate a session. Please try again later.');
      }
    } catch (err) {
      console.error('Generate error', err);
      showError('Generation Error', 'An error occurred while generating the session.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGoalCreated = async (goal: any) => {
    setGoalSheetVisible(false);
    setGenerating(true);
    try {
      const res = await generatePlan();
      console.log('Re-generated plan after goal creation:', res);
      // Refresh data to show new plan
      await loadHomeData(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View className="flex-1 bg-violet-700">
      <FlatList
        data={completedSessions}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#7c3aed']}
          />
        }
        ListHeaderComponent={
          <View className="px-5" style={{ paddingTop: insets.top + 16 }}>
            {/* Greeting */}
            <Text className="text-white text-3xl font-extrabold">
              Hie {displayName ? displayName : '👋'}
            </Text>
            <Text className="text-violet-200 mb-8">
              Ready for your next session?
            </Text>

            {/* Planned Session */}
            {plannedSession ? (
              <Pressable
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/session-details',
                    params: { session: JSON.stringify(plannedSession) },
                  });
                }}
                className="bg-white rounded-3xl p-6 mb-6"
              >
                <Text className="text-xs text-gray-400 uppercase mb-1">Planned Session</Text>
                <Text className="text-2xl font-extrabold text-violet-800">{plannedSession.title}</Text>
                <Text className="text-gray-500 mt-3">⏱ {plannedSession.duration ?? '45 min'}</Text>
              </Pressable>
            ) : (
              <View className="bg-white rounded-3xl p-6 mb-6">
                <Text className="text-xl font-extrabold text-violet-800 mb-2">No planned session</Text>
                <Text className="text-gray-500 mb-5">
                  Generate a personalized workout plan for today
                </Text>
                <Pressable onPress={onGenerateSession} className="bg-violet-700 py-4 rounded-2xl items-center">
                  {generating ? (
                    <Text className="text-white font-bold text-base">Generating...</Text>
                  ) : (
                    <Text className="text-white font-bold text-base">Generate Session</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Completed Sessions Header */}
            <Text className="text-white text-lg font-bold mb-4">Completed Sessions</Text>
          </View>
        }
        renderItem={({ item }) => {
          const title = item.plan_payload?.title || item.title || `Session #${item.id}`;
          const summary = item.plan_payload?.summary || item.summary || '';
          const date = item.updated || item.created || item.actual_date;
          const status = item.status;
          const feedback = item.feedback;
          const dateLabel = item.completed_date ? new Date(date).toLocaleDateString() : '';
          const duration = item.plan_payload?.estimated_duration_minutes ?? item.estimated_duration_minutes;
          const exercisesCount = item.plan_payload?.exercises?.length ?? item.exercises?.length ?? 0;

          return (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/session-details',
                  params: { session: JSON.stringify(item) },
                });
              }}
              className="bg-white/95 rounded-2xl p-4 mb-3 mx-5"
            >
              <Text className="font-bold text-violet-800">{title}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {dateLabel} {duration ? `• ${duration} min` : ''} {exercisesCount ? `• ${exercisesCount} exercises` : ''}
              </Text>
              {summary ? (
                <Text className="text-gray-600 text-sm mt-2">{summary}</Text>
              ) : null}
              <Text className="text-green-600 text-xs mt-2">✓ {status}</Text>
            </Pressable>
          );
        }}
      />

      {/* Profile Sheet */}
      <ProfileSheet
        visible={profileSheetVisible}
        initialValues={initialProfileValues}
        mode={initialProfileValues ? 'update' : 'create'}
        onSubmitProfile={onProfileSubmit}
        onSuccess={(profile) => {
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