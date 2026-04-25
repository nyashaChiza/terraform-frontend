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
  KeyboardAvoidingView,
  StyleSheet,
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
  experience_level: 'Beginner' | 'Intermediate' | 'Expert';
  preferred_sessions_per_week: number;
  phone_number: string;
};

type Props = {
  visible: boolean;
  mode?: 'create' | 'update';
  initialValues?: Partial<ProfilePayload>;
  onSubmitProfile: (payload: ProfilePayload) => Promise<any>;
  onSuccess: (profile: any) => void;
  onClose?: () => void;
};

export default function ProfileSheet({
  visible,
  mode = 'create',
  initialValues,
  onSubmitProfile,
  onSuccess,
  onClose,
}: Props) {
  const [form, setForm] = useState<ProfilePayload>({
    first_name: '',
    last_name: '',
    gender: 'Male',
    height: 0,
    weight: 0,
    date_of_birth: '',
    experience_level: 'Beginner',
    preferred_sessions_per_week: 3,
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      update('date_of_birth', `${yyyy}-${mm}-${dd}`);
    }
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const GenderButton = ({ value, label }: { value: string; label: string }) => (
    <Pressable
      onPress={() => update('gender', value)}
      className={`flex-1 py-3 rounded-xl border-2 ${
        form.gender === value
          ? 'bg-violet-700 border-violet-700'
          : 'bg-white border-gray-300'
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          form.gender === value ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  const ExperienceButton = ({ value, label }: { value: string; label: string }) => (
    <Pressable
      onPress={() => update('experience_level', value)}
      className={`flex-1 py-3 rounded-xl border-2 ${
        form.experience_level === value
          ? 'bg-violet-700 border-violet-700'
          : 'bg-white border-gray-300'
      }`}
    >
      <Text
        className={`text-center font-semibold text-sm ${
          form.experience_level === value ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  const SessionButton = ({ value }: { value: number }) => (
    <Pressable
      onPress={() => update('preferred_sessions_per_week', value)}
      className={`w-12 h-12 rounded-xl border-2 items-center justify-center ${
        form.preferred_sessions_per_week === value
          ? 'bg-violet-700 border-violet-700'
          : 'bg-white border-gray-300'
      }`}
    >
      <Text
        className={`font-bold text-lg ${
          form.preferred_sessions_per_week === value ? 'text-white' : 'text-gray-700'
        }`}
      >
        {value}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={closeDatePicker} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <Text className="text-2xl font-extrabold text-violet-800">
                {mode === 'create' ? 'Complete your profile' : 'Edit profile'}
              </Text>
              <Text className="text-gray-500 mt-1">
                This helps us personalize your workouts
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: 40 }}
              className="px-6"
            >
              {/* Name Fields */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Full Name
                </Text>
                <View className="flex-row gap-3">
                  <TextInput
                    placeholder="First name"
                    placeholderTextColor="#9ca3af"
                    value={form.first_name}
                    onChangeText={v => update('first_name', v)}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base"
                  />
                  <TextInput
                    placeholder="Last name"
                    placeholderTextColor="#9ca3af"
                    value={form.last_name}
                    onChangeText={v => update('last_name', v)}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base"
                  />
                </View>
              </View>

              {/* Phone */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Phone Number
                </Text>
                <TextInput
                  placeholder="+230 5xxx xxxx"
                  placeholderTextColor="#9ca3af"
                  value={form.phone_number}
                  onChangeText={v => update('phone_number', v)}
                  keyboardType="phone-pad"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                />
              </View>

              {/* Date of Birth */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Date of Birth
                </Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                >
                  <Text
                    className={`text-base ${
                      form.date_of_birth ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {form.date_of_birth
                      ? new Date(form.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Select date'}
                  </Text>
                </Pressable>

                {showDatePicker && (
                  <View>
                    <DateTimePicker
                      value={parseDate(form.date_of_birth)}
                      mode="date"
                      textColor='#374151'
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      onChange={handleDateChange}
                    />
                    {Platform.OS === 'ios' && (
                      <Pressable
                        onPress={closeDatePicker}
                        className="bg-violet-700 py-3 rounded-xl items-center mt-2"
                      >
                        <Text className="text-white font-semibold">Done</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              {/* Gender */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Gender
                </Text>
                <View className="flex-row gap-2">
                  <GenderButton value="Male" label="Male" />
                  <GenderButton value="Female" label="Female" />
                  <GenderButton value="Other" label="Other" />
                </View>
              </View>

              {/* Height & Weight */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Physical Stats
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextInput
                      placeholder="Height"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={form.height ? String(form.height) : ''}
                      onChangeText={v => update('height', Number(v) || 0)}
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                    />
                    <Text className="text-gray-500 text-xs mt-1 ml-1">
                      in centimeters
                    </Text>
                  </View>
                  <View className="flex-1">
                    <TextInput
                      placeholder="Weight"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={form.weight ? String(form.weight) : ''}
                      onChangeText={v => update('weight', Number(v) || 0)}
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                    />
                    <Text className="text-gray-500 text-xs mt-1 ml-1">
                      in kilograms
                    </Text>
                  </View>
                </View>
              </View>

              {/* Experience Level */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Experience Level
                </Text>
                <View className="flex-row gap-2">
                  <ExperienceButton value="Beginner" label="Beginner" />
                  <ExperienceButton value="Intermediate" label="Intermediate" />
                  <ExperienceButton value="Expert" label="Advanced" />
                </View>
              </View>

              {/* Sessions per week */}
              <View className="mt-5 mb-6">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Preferred Sessions per Week
                </Text>
                <View className="flex-row gap-2 justify-between">
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <SessionButton key={num} value={num} />
                  ))}
                </View>
              </View>

              {/* Actions */}
              <View className="flex-row gap-3 mb-4">
                {onClose && (
                  <Pressable
                    onPress={onClose}
                    disabled={loading}
                    className="flex-1 py-4 rounded-2xl bg-gray-100 items-center"
                  >
                    <Text className="font-semibold text-gray-700">Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={onSubmit}
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl bg-violet-700 items-center shadow-lg"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {mode === 'create' ? 'Save Profile' : 'Update Profile'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}