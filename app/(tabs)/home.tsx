import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { getProfile, createProfile } from '../../services/profiles';
import { getPlannedSessions } from '../../services/sessions';
import { generatePlan } from '../../services/planner';
import ProfileSheet from '../../components/ProfileSheet';
import GoalSheet from '../../components/GoalSheet';
import { authStore } from '../../store/auth';
import { ProfileStore } from 'store/profile';

type Session = {
  id: string;
  title: string;
  duration: string;
  completedAt: string;
};

// planned session fetched from API
  

const completedSessions: Session[] = [
  { id: '1', title: 'Leg Day', duration: '50 min', completedAt: 'Yesterday' },
  { id: '2', title: 'Core & Mobility', duration: '30 min', completedAt: '2 days ago' },
];

export default function HomeTab() {
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [initialProfileValues, setInitialProfileValues] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [plannedSession, setPlannedSession] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setCheckingProfile(true);

      // 1️⃣ Let home screen breathe for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!mounted) return;

      const res = await getProfile();

      if (res.ok) {
        authStore.set({ user: res.body });
        setInitialProfileValues(res.body);
        const first = res.body.first_name ?? res.body.firstName ?? res.body.first ?? '';
        const last = res.body.last_name ?? res.body.lastName ?? res.body.last ?? '';
        setDisplayName([first, last].filter(Boolean).join(' '));
        ProfileStore.set({
          first_name: first,
          last_name: last,
          gender: res.body.gender,
          height: res.body.height,
          weight: res.body.weight
        });
      } else if (res.status === 404) {
        setProfileSheetVisible(true); // show profile sheet if not found
      } else {
        console.warn('Profile fetch failed:', res);
      }

      setCheckingProfile(false);
    };

    loadProfile();
    // fetch planned session as well
    const loadPlanned = async () => {
      const res = await getPlannedSessions();
      if (!mounted) return;
      if (res.ok && Array.isArray(res.body) && res.body.length > 0) {
        const first = res.body[0];
        if (!first.title) first.title = 'test';
        setPlannedSession(first);
      }
    };

    loadPlanned();
    return () => { mounted = false; };
  }, []);

  // ✅ This will be passed to ProfileSheet
  const onProfileSubmit = async (payload: any) => {
    try {
      // Decide if creating or updating
      const existingUser = authStore.get().user;
      let res;
      if (existingUser) {
        // Update flow (call your updateProfile service if exists)
        // res = await updateProfile(payload);
        console.log('Updating profile', payload);
        res = { ok: true, body: payload }; // placeholder
      } else {
        res = await createProfile(payload); // create new profile
      }

      if (res.ok) {
        authStore.set({ user: res.body });
        setProfileSheetVisible(false);
        return res;
      } else {
        throw new Error(JSON.stringify(res.body));
      }
    } catch (err: any) {
      throw err; // ProfileSheet will handle toast
    }
  };

  const [generating, setGenerating] = useState(false);

  const onGenerateSession = async () => {
    setGenerating(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const planned_date = `${yyyy}-${mm}-${dd}`;

      const res = await generatePlan(planned_date);
      if (res.ok) {
        console.log('Generated plan:', res.body);
        // You may want to navigate to the plan or store it
      } else if (res?.body?.detail === 'User has no goals') {
        // show goal creation sheet
        setGoalSheetVisible(true);
      } else {
        console.warn('Generate failed', res);
      }
    } catch (err) {
      console.error('Generate error', err);
    } finally {
      setGenerating(false);
    }
  };

  const [goalSheetVisible, setGoalSheetVisible] = useState(false);

  const handleGoalCreated = async (goal: any) => {
    setGoalSheetVisible(false);
    // After creating a goal, re-run generation
    setGenerating(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const planned_date = `${yyyy}-${mm}-${dd}`;
      const res = await generatePlan(planned_date);
      console.log('Re-generated plan after goal creation:', res);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View className="flex-1 bg-violet-700 px-5 pt-14">
      {/* Greeting */}
      <Text className="text-white text-3xl font-extrabold">
        Hie {displayName ? displayName : '👋'}
      </Text>
      <Text className="text-violet-200 mb-8">
        Ready for your next session?
      </Text>

      {/* Planned Session */}
      {plannedSession ? (
        <View className="bg-white rounded-3xl p-6 mb-6">
          <Text className="text-xs text-gray-400 uppercase mb-1">Planned Session</Text>
          <Text className="text-2xl font-extrabold text-violet-800">{plannedSession.title ?? 'test'}</Text>
          <Text className="text-gray-500 mt-3">⏱ {plannedSession.duration ?? '45 min'}</Text>
        </View>
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

      {/* Completed Sessions */}
      <Text className="text-white text-lg font-bold mb-4">Completed Sessions</Text>
      <FlatList
        data={completedSessions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View className="bg-white/95 rounded-2xl p-4 mb-3">
            <Text className="font-bold text-violet-800">{item.title}</Text>
            <Text className="text-gray-500">{item.duration} • {item.completedAt}</Text>
          </View>
        )}
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
