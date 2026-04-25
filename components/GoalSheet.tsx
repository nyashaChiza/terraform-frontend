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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createGoal, updateGoal } from '../services/goals';
import { showError, showSuccess } from '../services/toast';

type Props = {
  visible: boolean;
  onClose: () => void;
  mode?: 'create' | 'update';
  goalId?: string | number;
  initialValues?: any;
  onCreated?: (goal: any) => void;
  onUpdated?: (goal: any) => void;
};

const GOAL_TYPES = [
  'WeightLoss',
  'MuscleGain',
  'Strength',
  'Endurance',
  'Custom',
] as const;

export default function GoalSheet({ visible, onClose, mode = 'create', goalId, initialValues, onCreated, onUpdated }: Props) {
  const [type, setType] = useState<typeof GOAL_TYPES[number]>('WeightLoss');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [startingValue, setStartingValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible && mode === 'update' && initialValues) {
      if (GOAL_TYPES.includes(initialValues.type)) setType(initialValues.type);
      setDescription(initialValues.description ?? '');
      setTargetValue(initialValues.target_value != null ? String(initialValues.target_value) : '');
      setStartingValue(initialValues.starting_value != null ? String(initialValues.starting_value) : '');
      setStartDate(initialValues.start_date ?? '');
      setDueDate(initialValues.due_date ?? '');
    }
  }, [visible, mode, initialValues]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);

  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const validate = () => {
    if (!startDate) return 'Start date is required';
    if (!dueDate) return 'Due date is required';
    if (!targetValue) return 'Target value is required';
    if (Number(targetValue) <= 0) return 'Target value must be greater than 0';
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
      const payload = {
        type,
        description,
        target_value: Number(targetValue),
        starting_value: Number(startingValue) || 0,
        start_date: startDate,
        due_date: dueDate,
      };

      let res;
      if (mode === 'update' && goalId != null) {
        res = await updateGoal(goalId, payload as any);
      } else {
        res = await createGoal(payload as any);
      }

      if (res.ok) {
        showSuccess(mode === 'update' ? 'Goal updated' : 'Goal created');
        if (mode === 'update') onUpdated?.(res.body);
        else onCreated?.(res.body);
        onClose();
      } else {
        showError(mode === 'update' ? 'Update failed' : 'Create failed', JSON.stringify(res.body));
      }
    } catch (err: any) {
      showError('Error', err?.message ?? 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const DateField = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <View className="mt-5">
      <Text className="text-gray-700 font-semibold mb-2 text-sm">
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
      >
        <Text
          className={`text-base ${
            value ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          {value
            ? new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Select date'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <Text className="text-2xl font-extrabold text-violet-800">
                {mode === 'update' ? 'Edit Goal' : 'Create Goal'}
              </Text>
              <Text className="text-gray-500 mt-1">
                Set a clear target to guide your training
              </Text>
            </View>

            <ScrollView
              className="px-6"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Goal Type */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Goal Type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {GOAL_TYPES.map(opt => (
                    <Pressable
                      key={opt}
                      onPress={() => setType(opt)}
                      className={`px-4 py-2 rounded-xl border-2 ${
                        type === opt
                          ? 'bg-violet-700 border-violet-700'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`font-semibold text-sm ${
                          type === opt ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View className="mt-5">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Description (optional)
                </Text>
                <TextInput
                  placeholder="e.g. Lose 5kg in 8 weeks"
                  placeholderTextColor="#9ca3af"
                  value={description}
                  onChangeText={setDescription}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                />
              </View>

              {/* Values */}
              <View className="mt-5 flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">
                    Starting Value
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    value={startingValue}
                    onChangeText={setStartingValue}
                    className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">
                    Target Value
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#9ca3af"
                    value={targetValue}
                    onChangeText={setTargetValue}
                    className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  />
                </View>
              </View>

              {/* Dates */}
              <DateField
                label="Start Date"
                value={startDate}
                onPress={() => setShowStartPicker(true)}
              />
              <DateField
                label="Due Date"
                value={dueDate}
                onPress={() => setShowDuePicker(true)}
              />

              {showStartPicker && (
                <View>
                  <DateTimePicker
                    value={parseDate(startDate)}
                    mode="date"
                    textColor='#374151'
                    minimumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      if (Platform.OS === 'android') setShowStartPicker(false);
                      if (d) setStartDate(formatDate(d));
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      onPress={() => setShowStartPicker(false)}
                      className="bg-violet-700 py-3 rounded-xl items-center mt-2"
                    >
                      <Text className="text-white font-semibold">Done</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {showDuePicker && (
                <View>
                  <DateTimePicker
                    value={parseDate(dueDate)}
                    mode="date"
                    textColor='#374151'
                    minimumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      if (Platform.OS === 'android') setShowDuePicker(false);
                      if (d) setDueDate(formatDate(d));
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      onPress={() => setShowDuePicker(false)}
                      className="bg-violet-700 py-3 rounded-xl items-center mt-2"
                    >
                      <Text className="text-white font-semibold">Done</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Actions */}
              <View className="flex-row gap-3 mt-8">
                <Pressable
                  onPress={onClose}
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 items-center"
                >
                  <Text className="font-semibold text-gray-700">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={onSubmit}
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl bg-violet-700 items-center shadow-lg"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="font-bold text-white">{mode === 'update' ? 'Update Goal' : 'Create Goal'}</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
