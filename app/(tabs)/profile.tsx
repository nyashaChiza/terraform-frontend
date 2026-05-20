import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateProfile } from '../../services/profiles';
import { authStore } from '../../store/auth';
import ProfileSheet from '../../components/ProfileSheet';
import ChangePasswordSheet from '../../components/ChangePasswordSheet';
import { Avatar } from '../../components/Avatar';
import { deleteAccount } from '../../services/auth';
import { pickAndUploadProfilePicture, removeProfilePicture } from '../../services/profilePicture';
import { showError, showSuccess } from '../../services/toast';
import { useRouter } from 'expo-router';
import EquipmentSheet from '../../components/EquipmentSheet';
import { apiFetch } from '../../services/api';

export default function ProfileTab() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const [profile, setProfile]                 = useState<any>(null);
  const [user, setUser]                       = useState<any>(null);
  const [loading, setLoading]                 = useState(true);
  const [uploading, setUploading]             = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [editVisible, setEditVisible]           = useState(false);
  const [changePwVisible, setChangePwVisible]   = useState(false);
  const [equipmentVisible, setEquipmentVisible] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername]           = useState('');
  const [savingUsername, setSavingUsername]     = useState(false);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      if (res.ok) {
        setProfile(res.body);
        authStore.set({ user: res.body });
      }
      // Load user (for profile_picture_url)
      const stored = authStore.get();
      if (stored.user) setUser(stored.user);
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

  // ── Avatar press — show action sheet ─────────────────────────────────────
  const handleAvatarPress = () => {
    const hasPhoto = !!user?.profile_picture_url;
    const options = hasPhoto
      ? ['Change Photo', 'Remove Photo', 'Cancel']
      : ['Upload Photo', 'Cancel'];
    const cancelIndex = options.length - 1;
    const destructiveIndex = hasPhoto ? 1 : undefined;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
        (index) => {
          if (index === 0) handleUploadPhoto();
          if (hasPhoto && index === 1) handleRemovePhoto();
        },
      );
    } else {
      // Android — use an Alert as a simple action sheet replacement
      const buttons: any[] = [
        { text: hasPhoto ? 'Change Photo' : 'Upload Photo', onPress: handleUploadPhoto },
      ];
      if (hasPhoto) {
        buttons.push({ text: 'Remove Photo', style: 'destructive', onPress: handleRemovePhoto });
      }
      buttons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert('Profile Photo', '', buttons);
    }
  };

  const handleUploadPhoto = async () => {
    setUploading(true);
    try {
      const result = await pickAndUploadProfilePicture();
      if (result) {
        const updated = { ...user, profile_picture_url: result.profile_picture_url };
        setUser(updated);
        authStore.set({ user: updated });
      }
    } catch (err: any) {
      showError('Upload Failed', err?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      await removeProfilePicture();
      const updated = { ...user, profile_picture_url: null };
      setUser(updated);
      authStore.set({ user: updated });
    } catch (err: any) {
      showError('Error', err?.message ?? 'Could not remove photo.');
    } finally {
      setUploading(false);
    }
  };

  // ── Change username ───────────────────────────────────────────────────────
  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed.length < 2) {
      showError('Validation', 'Username must be at least 2 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      showError('Validation', 'Only letters, numbers, and underscores allowed');
      return;
    }
    setSavingUsername(true);
    try {
      const { ok, body } = await apiFetch('/api/users/me/username', {
        method: 'PATCH',
        body: JSON.stringify({ username: trimmed }),
      });
      if (ok) {
        const updated = { ...user, username: body.username };
        setUser(updated);
        authStore.set({ user: updated });
        showSuccess('Username updated');
        setUsernameModalVisible(false);
        setNewUsername('');
      } else {
        showError('Error', (body as any)?.detail ?? 'Could not update username');
      }
    } catch (err: any) {
      showError('Error', err?.message ?? 'Failed to save');
    } finally {
      setSavingUsername(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
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

  return (
    <View className="flex-1 bg-violet-700">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Header */}
        <View className="px-5 pb-6 items-center" style={{ paddingTop: insets.top + 16 }}>

          {/* Tappable avatar with camera overlay */}
          <Pressable onPress={handleAvatarPress} style={styles.avatarWrap}>
            {uploading ? (
              <View style={styles.avatarLoader}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <Avatar
                profilePictureUrl={user?.profile_picture_url}
                name={fullName}
                size={96}
              />
            )}
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </Pressable>

          <Text className="text-white text-2xl font-extrabold mt-3">{fullName}</Text>
          {user?.username ? (
            <Pressable
              onPress={() => {
                setNewUsername(user.username ?? '');
                setUsernameModalVisible(true);
              }}
              className="flex-row items-center gap-1 mt-1"
            >
              <Text className="text-violet-200 text-sm">@{user.username}</Text>
              <Ionicons name="pencil" size={11} color="rgba(221,214,254,0.7)" />
            </Pressable>
          ) : null}
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

        {/* My Equipment */}
        <View className="mx-5 mb-4">
          <Pressable
            onPress={() => setEquipmentVisible(true)}
            className="flex-row items-center gap-3 bg-white/95 rounded-2xl px-5 py-4"
          >
            <View className="w-9 h-9 rounded-xl bg-violet-100 items-center justify-center">
              <Ionicons name="barbell-outline" size={18} color="#6d28d9" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-violet-800">My Equipment</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Customize which equipment to include in workouts</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Delete Account */}
        <View className="mx-5">
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
      </ScrollView>

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

      <EquipmentSheet
        visible={equipmentVisible}
        onClose={() => setEquipmentVisible(false)}
      />

      {/* Change Username Modal */}
      <Modal visible={usernameModalVisible} transparent animationType="fade">
        {/* Backdrop — tapping outside closes the modal */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => setUsernameModalVisible(false)}
        />
        {/* Card — centered, lifts above keyboard */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
        >
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-lg font-extrabold text-violet-800 mb-1">Change Username</Text>
            <Text className="text-sm text-gray-500 mb-4">
              Letters, numbers, and underscores only. Min 2 characters.
            </Text>
            <TextInput
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="new_username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 mb-4"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setUsernameModalVisible(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 items-center"
              >
                <Text className="font-semibold text-gray-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveUsername}
                disabled={savingUsername}
                className="flex-1 py-3 rounded-xl bg-violet-700 items-center"
              >
                {savingUsername ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarLoader: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    borderWidth: 2,
    borderColor: '#5b21b6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 bg-white/95 rounded-2xl p-4">
      <Ionicons name={icon as any} size={18} color="#6d28d9" style={{ marginBottom: 6 }} />
      <Text className="text-xs text-gray-400 mb-1">{label}</Text>
      <Text className="text-sm font-bold text-violet-800">{value}</Text>
    </View>
  );
}
