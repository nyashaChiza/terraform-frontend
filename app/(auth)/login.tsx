import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { login as loginSvc } from '../../services/auth';
import { authStore } from '../../store/auth';
import { showError, showSuccess } from '../../services/toast';

export default function Login() {
  const router = useRouter();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      showError('Validation', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await loginSvc({ email, password });

      const token         = res?.access_token ?? res?.token ?? res?.accessToken ?? null;
      const refresh_token = res?.refresh_token ?? null;
      const token_type    = res?.token_type ?? res?.tokenType ?? 'Bearer';

      if (!token) {
        // Show the error detail returned by the backend (e.g. "Invalid email or password")
        const msg = res?.detail ?? res?.message ?? 'Invalid credentials';
        showError('Login failed', Array.isArray(msg) ? msg[0]?.msg ?? 'Invalid credentials' : msg);
        return;
      }

      authStore.set({ token, refresh_token, token_type, user: null });
      showSuccess('Signed in');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      showError('Network error', err?.message ?? String(err));
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
        <View className="items-center mb-8">
          <Image
            source={require('../../assets/icon.png')}
            className="w-24 h-24"
            resizeMode="contain"
          />
          <Text className="text-white font-extrabold text-xl mt-3">
            TerraForm
          </Text>
        </View>

        {/* Card */}
        <View className="bg-white rounded-3xl px-6 py-8 shadow-lg">
          <Text className="text-3xl font-extrabold text-violet-800 mb-1">
            Welcome Back
          </Text>
          <Text className="text-gray-500 mb-6">
            Sign in to continue
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="border border-gray-300 rounded-xl px-4 py-3 mb-3 text-base"
          />

          <View style={styles.passwordWrap}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={8}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
            </Pressable>
          </View>

          <Pressable
            onPress={onLogin}
            disabled={loading}
            className="bg-violet-700 py-4 rounded-xl items-center mb-3"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Sign In
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/register')}
            disabled={loading}
            className="bg-violet-100 py-4 rounded-xl items-center"
          >
            <Text className="text-violet-700 font-bold text-base">
              Create Account
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
    marginBottom: 16,
    backgroundColor: '#fff',
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
