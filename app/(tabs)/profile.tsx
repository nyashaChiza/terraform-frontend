import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateProfile } from '../../services/profiles';
import { authStore } from '../../store/auth';
import ProfileSheet from '../../components/ProfileSheet';
import ChangePasswordSheet from '../../components/ChangePasswordSheet';
import { deleteAccount } from '../../services/auth';
import { authStore } from '../../store/auth';
import { showError } from '../../services/toast';
import { useRouter } from 'expo-router';

export default function ProfileTab() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const [profile, setProfile]                 = useState<any>(null);
  const [loading, setLoading]                 = useState(true);
  const [deleting, setDeleting]               = useState(false);
  const [editVisible, setEditVisible]         = useState(false);
  const [changePwVisible, setChangePwVisible] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      if (res.ok) {
        setProfile(res.body);
        authStore.set({ user: res.body });
      }
    } catch {
      showError('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleUpdate = async (payload: any) => {
    const res = await updateProfile(payload);
    if (res.ok) {
      setProfile(res.body);
      authStore.set({ user: res.body });
    }
    return res;
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, goals, workout history, and all personal data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your data will be erased immediately and cannot be recovered.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const res = await deleteAccount();
                      if (res.ok || res.status === 204) {
                        authStore.set({ token: null, token_type: null, user: null });
                        router.replace('/(auth)/login');
                      } else {
                        showError('Error', res.body?.detail ?? 'Could not delete account. Please try again.');
                      }
                    } catch {
                      showError('Error', 'Please check your connection and try again.');
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-violet-700 items-center justify-center">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Your Profile';
  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <View className="flex-1 bg-violet-700">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Header */}
        <View className="px-5 pb-6 items-center" style={{ paddingTop: insets.top + 16 }}>
          {/* Avatar */}
          <View className="w-24 h-24 rounded-full bg-white/25 items-center justify-center mb-4 border-2 border-white/40">
            <Text className="text-white text-3xl font-extrabold">{initials}</Text>
          </View>
          <Text className="text-white text-2xl font-extrabold">{fullName}</Text>
          {profile?.phone_number ? (
            <Text className="text-violet-200 mt-1">{profile.phone_number}</Text>
          ) : null}

          <View className="flex-row gap-3 mt-4">
            <Pressable
              onPress={() => setEditVisible(true)}
              className="flex-row items-center gap-2 bg-white/20 border border-white/30 px-5 py-2.5 rounded-full"
            >
              <Ionicons name="pencil" size={14} color="#fff" />
              <Text className="text-white font-semibold text-sm">Edit Profile</Text>
            </Pressable>
            <Pressable
              onPress={() => setChangePwVisible(true)}
              className="flex-row items-center gap-2 bg-white/20 border border-white/30 px-5 py-2.5 rounded-full"
            >
              <Ionicons name="lock-closed-outline" size={14} color="#fff" />
              <Text className="text-white font-semibold text-sm">Change Password</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats grid */}
        {profile && (
          <View className="mx-5 mb-4">
            <View className="flex-row gap-3 mb-3">
              <StatCard label="Height" value={profile.height ? `${profile.height} cm` : '—'} icon="resize-outline" />
              <StatCard label="Weight" value={profile.weight ? `${profile.weight} kg` : '—'} icon="barbell-outline" />
            </View>
            <View className="flex-row gap-3 mb-3">
              <StatCard label="Experience" value={profile.experience_level ?? '—'} icon="trophy-outline" />
              <StatCard label="Sessions / week" value={profile.preferred_sessions_per_week ? `${profile.preferred_sessions_per_week}` : '—'} icon="calendar-outline" />
            </View>
            <View className="flex-row gap-3">
              <StatCard label="Gender" value={profile.gender ?? '—'} icon="person-outline" />
              <StatCard
                label="Date of Birth"
                value={profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : '—'}
                icon="calendar-number-outline"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Delete Account */}
      <View className="mx-5 mb-4">
        <Pressable
          onPress={handleDeleteAccount}
          disabled={deleting}
          className="flex-row items-center justify-center gap-2 border border-red-400/60 rounded-2xl py-4"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
        >
          {deleting ? (
            <ActivityIndicator color="#f87171" size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color="#f87171" />
              <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 14 }}>Delete Account</Text>
            </>
          )}
        </Pressable>
      </View>

      <ProfileSheet
        visible={editVisible}
        mode="update"
        initialValues={profile}
        onSubmitProfile={handleUpdate}
        onClose={() => setEditVisible(false)}
        onSuccess={(updated) => {
          setProfile(updated);
          setEditVisible(false);
        }}
      />

      <ChangePasswordSheet
        visible={changePwVisible}
        onClose={() => setChangePwVisible(false)}
      />
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 bg-white/95 rounded-2xl p-4">
      <Ionicons name={icon as any} size={18} color="#6d28d9" style={{ marginBottom: 6 }} />
      <Text className="text-xs text-gray-400 mb-1">{label}</Text>
      <Text className="text-sm font-bold text-violet-800">{value}</Text>
    </View>
  );
}
