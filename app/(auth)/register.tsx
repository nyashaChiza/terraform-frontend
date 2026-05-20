import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { register as registerSvc } from '../../services/auth';
import { showError, showSuccess } from '../../services/toast';

function getPasswordErrors(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8)                          errors.push('At least 8 characters');
  if (pw === pw.toLowerCase())                errors.push('At least one uppercase letter');
  if (!/\d/.test(pw))                         errors.push('At least one number');
  return errors;
}

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [pwTouched, setPwTouched]   = useState(false);

  const pwErrors   = getPasswordErrors(password);
  const pwValid    = pwErrors.length === 0;

  const onSignUp = async () => {
    if (!email || !password) {
      showError('Missing details', 'Email and password are required');
      return;
    }

    if (!pwValid) {
      showError('Weak password', pwErrors[0]);
      return;
    }

    setLoading(true);
    try {
      const res = await registerSvc({ email, password });

      // Register returns UserOut (id + email), not a token.
      // apiFetch wraps the response as { ok, status, body }.
      if (res.ok && res.body?.id) {
        showSuccess('Account created! Please sign in.');
        router.replace('/(auth)/login');
        return;
      }

      // Handle API-level error (e.g. email already taken → 409)
      const detail = Array.isArray(res.body?.detail)
        ? res.body.detail[0]?.msg ?? 'Unable to create account'
        : res.body?.detail ?? 'Unable to create account';
      showError('Sign up failed', detail);

    } catch {
      showError('Something went wrong', 'Please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#7c3aed' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center mb-10">
          <Image
            source={require('../../assets/icon.png')}
            className="w-24 h-24"
            contentFit="contain"
          />
          <Text className="text-white font-extrabold text-xl mt-3">
            TerraForm
          </Text>
        </View>

        {/* Card */}
        <View className="bg-white rounded-3xl px-6 py-8 shadow-lg">
          <Text className="text-3xl font-extrabold text-violet-800 mb-2">
            Create your account
          </Text>
          <Text className="text-gray-500 mb-6">
            Start tracking and improving your training sessions
          </Text>

          <TextInput
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="border border-gray-300 rounded-xl px-4 py-3 mb-3 text-base"
          />

          <View style={[styles.passwordWrap, pwTouched && !pwValid && styles.passwordWrapError]}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setPwTouched(true)}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Password requirements — shown after the field is touched */}
          <View style={{ marginTop: 8, marginBottom: 20, gap: 4 }}>
            {(['At least 8 characters', 'At least one uppercase letter', 'At least one number'] as const).map(rule => {
              const met = !pwErrors.includes(rule);
              const show = pwTouched || (password.length > 0);
              if (!show) return null;
              return (
                <Text
                  key={rule}
                  style={{ fontSize: 12, color: met ? '#16a34a' : '#9ca3af' }}
                >
                  {met ? '✓' : '·'} {rule}
                </Text>
              );
            })}
          </View>

          <Pressable
            onPress={onSignUp}
            disabled={loading}
            className={`py-4 rounded-xl items-center ${
              loading ? 'bg-violet-400' : 'bg-violet-700'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Create Account
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            disabled={loading}
            className="mt-4 items-center"
          >
            <Text className="text-violet-700 font-semibold">
              Already have an account? Login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  passwordWrapError: {
    borderColor: '#f87171',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  eyeBtn: {
    paddingLeft: 8,
  },
});
