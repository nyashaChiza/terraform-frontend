import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { changePassword } from '../services/auth';
import { showError, showSuccess } from '../services/toast';

type Props = {
  visible: boolean;
  onClose: () => void;
};

function getPasswordErrors(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8)             errors.push('At least 8 characters');
  if (pw === pw.toLowerCase())   errors.push('At least one uppercase letter');
  if (!/\d/.test(pw))            errors.push('At least one number');
  return errors;
}

export default function ChangePasswordSheet({ visible, onClose }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxSheetHeight = windowHeight - insets.top - 16;

  const [currentPw, setCurrentPw]       = useState('');
  const [newPw, setNewPw]               = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [newPwTouched, setNewPwTouched] = useState(false);
  const [loading, setLoading]           = useState(false);

  const pwErrors = getPasswordErrors(newPw);
  const pwValid  = pwErrors.length === 0;

  const reset = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setNewPwTouched(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async () => {
    if (!currentPw) {
      showError('Validation', 'Current password is required');
      return;
    }
    if (!pwValid) {
      showError('Weak password', pwErrors[0]);
      return;
    }
    if (newPw !== confirmPw) {
      showError('Validation', 'New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword({ current_password: currentPw, new_password: newPw });
      if (res.ok) {
        showSuccess('Password updated successfully');
        handleClose();
      } else {
        const detail = Array.isArray(res.body?.detail)
          ? res.body.detail[0]?.msg ?? 'Could not update password'
          : res.body?.detail ?? 'Could not update password';
        showError('Update failed', detail);
      }
    } catch {
      showError('Error', 'Please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: maxSheetHeight, flexDirection: 'column' }}>
          {/* Header */}
          <View className="px-6 pt-6 pb-4 border-b border-gray-100">
            <Text className="text-2xl font-extrabold text-violet-800">Change Password</Text>
            <Text className="text-gray-500 mt-1">Enter your current password, then choose a new one</Text>
          </View>

          <ScrollView
            className="px-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          >
            {/* Current password */}
            <View style={{ marginTop: 20 }}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.pwWrap}>
                <TextInput
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry={!showCurrent}
                  style={styles.pwInput}
                />
                <Pressable onPress={() => setShowCurrent(v => !v)} hitSlop={8}>
                  <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                </Pressable>
              </View>
            </View>

            {/* New password */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>New Password</Text>
              <View style={[styles.pwWrap, newPwTouched && !pwValid && styles.pwWrapError]}>
                <TextInput
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  value={newPw}
                  onChangeText={setNewPw}
                  onBlur={() => setNewPwTouched(true)}
                  secureTextEntry={!showNew}
                  style={styles.pwInput}
                />
                <Pressable onPress={() => setShowNew(v => !v)} hitSlop={8}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                </Pressable>
              </View>
              {/* Requirements */}
              <View style={{ marginTop: 6, gap: 3 }}>
                {(['At least 8 characters', 'At least one uppercase letter', 'At least one number'] as const).map(rule => {
                  const met  = !pwErrors.includes(rule);
                  const show = newPwTouched || newPw.length > 0;
                  if (!show) return null;
                  return (
                    <Text key={rule} style={{ fontSize: 12, color: met ? '#16a34a' : '#9ca3af' }}>
                      {met ? '✓' : '·'} {rule}
                    </Text>
                  );
                })}
              </View>
            </View>

            {/* Confirm new password */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={[styles.pwWrap, confirmPw.length > 0 && newPw !== confirmPw && styles.pwWrapError]}>
                <TextInput
                  placeholder="Repeat new password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry={!showConfirm}
                  style={styles.pwInput}
                />
                <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={8}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                </Pressable>
              </View>
              {confirmPw.length > 0 && newPw !== confirmPw && (
                <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>· Passwords do not match</Text>
              )}
            </View>

            {/* Actions */}
            <View className="flex-row gap-3 mt-8">
              <Pressable
                onPress={handleClose}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-gray-100 items-center"
              >
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onSubmit}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-violet-700 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">Update Password</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  pwWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  pwWrapError: {
    borderColor: '#f87171',
  },
  pwInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
});
