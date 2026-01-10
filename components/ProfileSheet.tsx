import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showError, showSuccess } from '../services/toast';

type ProfilePayload = {
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  height: number;
  weight: number;
  date_of_birth: string;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  preferred_sessions_per_week: number;
  phone_number: string;
};

type Props = {
  visible: boolean;
  mode?: 'create' | 'update';
  initialValues?: Partial<ProfilePayload>;
  onSubmitProfile: (payload: ProfilePayload) => Promise<any>;
  onSuccess: (profile: any) => void;
};

export default function ProfileSheet({
  visible,
  mode = 'create',
  initialValues,
  onSubmitProfile,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<ProfilePayload>({
    first_name: '',
    last_name: '',
    gender: 'Male',
    height: 0,
    weight: 0,
    date_of_birth: '',
    experience_level: 'Beginner',
    preferred_sessions_per_week: 1,
    phone_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setForm(prev => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const update = (key: keyof ProfilePayload, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const parseDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const validate = () => {
    if (!form.first_name.trim()) return 'First name is required';
    if (!form.last_name.trim()) return 'Last name is required';
    if (!form.date_of_birth) return 'Date of birth is required';
    if (form.height <= 0) return 'Height must be greater than 0';
    if (form.weight <= 0) return 'Weight must be greater than 0';
    if (!form.phone_number.trim()) return 'Phone number is required';
    return null;
  };

  const onSubmit = async () => {
    const error = validate();
    if (error) {
      showError('Validation', error);
      return;
    }
    setLoading(true);
    try {
      const res = await onSubmitProfile(form);
      showSuccess(mode === 'create' ? 'Profile created' : 'Profile updated');
      onSuccess(res.body ?? res);
    } catch (err: any) {
      showError('Error', err?.message ?? 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/40 justify-end">
        <View className="h-[60%] bg-white rounded-t-3xl px-6 pt-6">
          <Text className="text-2xl font-extrabold text-violet-800 mb-2">
            {mode === 'create' ? 'Complete your profile' : 'Edit profile'}
          </Text>
          <Text className="text-gray-500 mb-4">
            This helps us personalize your workouts
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* First name */}
            <TextInput
              placeholder="First name"
              placeholderTextColor="#374151"
              value={form.first_name}
              onChangeText={v => update('first_name', v)}
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />

            {/* Last name */}
            <TextInput
              placeholder="Last name"
              placeholderTextColor="#374151"
              value={form.last_name}
              onChangeText={v => update('last_name', v)}
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />

            {/* Phone */}
            <TextInput
              placeholder="Phone number"
              placeholderTextColor="#374151"
              value={form.phone_number}
              onChangeText={v => update('phone_number', v)}
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />

            {/* Date of birth */}
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            >
              <Text
                className={`text-base ${
                  form.date_of_birth ? 'text-black' : 'text-gray-400'
                }`}
              >
                {form.date_of_birth || 'Date of birth'}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={parseDate(form.date_of_birth)}
                mode="date"
                textColor='#374151'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    const yyyy = selectedDate.getFullYear();
                    const mm = String(selectedDate.getMonth() + 1).padStart(
                      2,
                      '0'
                    );
                    const dd = String(selectedDate.getDate()).padStart(2, '0');
                    update('date_of_birth', `${yyyy}-${mm}-${dd}`);
                  }
                }}
              />
            )}

            {/* Height */}
            <TextInput
              placeholder="Height (cm)"
              placeholderTextColor="#374151"
              keyboardType="numeric"
              value={form.height ? String(form.height) : ''}
              onChangeText={v => update('height', Number(v))}
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />

            {/* Weight */}
            <TextInput
              placeholder="Weight (kg)"
              placeholderTextColor="#374151"
              keyboardType="numeric"
              value={form.weight ? String(form.weight) : ''}
              onChangeText={v => update('weight', Number(v))}
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />

            {/* Sessions per week */}
            <TextInput
              placeholder="Sessions per week"
              keyboardType="numeric"
              value={String(form.preferred_sessions_per_week)}
              onChangeText={v =>
                update('preferred_sessions_per_week', Number(v))
              }
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6"
            />

            {/* Submit button */}
            <Pressable
              onPress={onSubmit}
              disabled={loading}
              className="bg-violet-700 py-4 rounded-2xl items-center mb-8"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {mode === 'create' ? 'Save Profile' : 'Update Profile'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
