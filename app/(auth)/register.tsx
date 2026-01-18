import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { register as registerSvc } from '../../services/auth';
import { authStore } from '../../store/auth';
import { showError, showSuccess } from '../../services/toast';

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!email || !password) {
      showError('Missing details', 'Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await registerSvc({ email, password });

      const token =
        res?.access_token ??
        res?.token ??
        res?.accessToken ??
        null;

      const token_type = res?.token_type ?? 'Bearer';
      const user = res?.user ?? null;

      if (!token) {
        showError('Sign up failed', res?.detail ?? 'Unable to create account');
        return;
      }

      authStore.set({ token, token_type, user });

      showSuccess('Account created successfully');

      // If email verification is required, keep this.
      // Otherwise: router.replace('/(app)');
      router.replace('/(auth)/login');

    } catch (err: any) {
      showError(
        'Something went wrong',
        err?.detail ?? 'Please check your connection and try again'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-violet-700 justify-center px-6">
      {/* Logo */}
      <View className="items-center mb-10">
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

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="border border-gray-300 rounded-xl px-4 py-3 mb-5 text-base"
        />

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
            Already have an account? Log in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
