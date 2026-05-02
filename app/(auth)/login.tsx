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
} from 'react-native';
import { useRouter } from 'expo-router';

import { login as loginSvc } from '../../services/auth';
import { authStore } from '../../store/auth';
import { showError, showSuccess } from '../../services/toast';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      showError('Validation', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await loginSvc({ email, password });
      const token =
        res?.access_token ??
        res?.token ??
        res?.accessToken ??
        null;

      const token_type = res?.token_type ?? res?.tokenType ?? 'Bearer';
      const user = res?.user ?? null;

      if (!token) {
        showError('Login failed', res?.message ?? 'Invalid credentials');
        return;
      }

      authStore.set({ token, token_type, user });
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
            source={require('../../assets/icon.jpg')}
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

          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
          />

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
