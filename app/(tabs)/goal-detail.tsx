import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { closeGoal, updateProgress } from '../../services/goals';
import GoalSheet from '../../components/GoalSheet';
import { showError, showSuccess } from '../../services/toast';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Active:    { bg: '#ede9fe', text: '#6d28d9' },
  Paused:    { bg: '#fef3c7', text: '#d97706' },
  Completed: { bg: '#dcfce7', text: '#16a34a' },
  Abandoned: { bg: '#fee2e2', text: '#dc2626' },
};

const GOAL_ICONS: Record<string, string> = {
  WeightLoss: '⚖️',
  MuscleGain: '💪',
  Strength:   '🏋️',
  Endurance:  '🏃',
  Custom:     '🎯',
};

/** Calculates progress % accounting for direction (weight loss vs gain). */
function calcProgress(current: number, starting: number, target: number): number | null {
  const denominator = target - starting;
  if (denominator === 0) return null;
  const pct = ((current - starting) / denominator) * 100;
  return Math.min(Math.max(Math.round(pct), 0), 100);
}

const AUTO_TRACK_LABEL: Record<string, string> = {
  WeightLoss:  '⚖️ Auto-tracked from your profile weight',
  Strength:    '🏋️ Auto-tracked from session weights',
  MuscleGain:  '💪 Auto-tracked from session weights',
  Endurance:   '🏃 Auto-tracked from completed sessions',
};

export default function GoalDetail() {
  const { goal: goalParam } = useLocalSearchParams<{ goal: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState<any>(() => JSON.parse(goalParam ?? '{}'));
  const [editVisible, setEditVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Progress update state
  const [progressInput, setProgressInput] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  const s = STATUS_STYLES[goal.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
  const icon = GOAL_ICONS[goal.type] ?? '🎯';

  const starting = goal.starting_value ?? 0;
  const progress =
    goal.target_value != null && goal.current_value != null
      ? calcProgress(goal.current_value, starting, goal.target_value)
      : null;

  const handleClose = () => {
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to close this goal? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setClosing(true);
            try {
              const res = await closeGoal(goal.id);
              if (res.ok) {
                showSuccess('Goal completed! 🎉');
                router.back();
              } else {
                showError('Error', res.body?.detail ?? 'Could not close this goal.');
              }
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateProgress = async () => {
    const val = parseFloat(progressInput);
    if (isNaN(val) || val < 0) {
      showError('Validation', 'Enter a valid number greater than or equal to 0');
      return;
    }
    setUpdatingProgress(true);
    try {
      const res = await updateProgress(goal.id, val);
      if (res.ok) {
        setGoal(res.body);
        setProgressInput('');
        showSuccess('Progress updated!');
      } else {
        showError('Error', res.body?.detail ?? 'Could not update progress');
      }
    } catch {
      showError('Error', 'Something went wrong');
    } finally {
      setUpdatingProgress(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 bg-violet-700">
        {/* Header */}
        <View className="flex-row items-center px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text className="text-white text-xl font-bold flex-1">Goal Details</Text>
          {goal.status === 'Active' && (
            <Pressable
              onPress={() => setEditVisible(true)}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="pencil" size={18} color="#fff" />
            </Pressable>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Main card */}
          <View className="mx-5 bg-white rounded-3xl p-6 mb-4">
            {/* Icon + type + status */}
            <View className="flex-row items-start gap-4 mb-5">
              <Text className="text-5xl">{icon}</Text>
              <View className="flex-1">
                <Text className="text-2xl font-extrabold text-violet-800">{goal.type}</Text>
                <View
                  className="mt-2 self-start px-3 py-1 rounded-full"
                  style={{ backgroundColor: s.bg }}
                >
                  <Text className="text-xs font-bold" style={{ color: s.text }}>
                    {goal.status}
                  </Text>
                </View>
              </View>
            </View>

            {goal.description ? (
              <Text className="text-gray-600 leading-5 mb-5">{goal.description}</Text>
            ) : null}

            {/* Progress bar */}
            {progress !== null && (
              <View className="mb-5">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-700">Progress</Text>
                  <Text className="text-sm text-gray-500">
                    {goal.current_value} → {goal.target_value}
                  </Text>
                </View>
                <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-3 bg-violet-600 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>
                <View className="flex-row justify-between mt-1.5">
                  <Text className="text-xs text-gray-400">
                    Started at {goal.starting_value ?? 0}
                  </Text>
                  <Text className="text-xs text-violet-600 font-semibold">
                    {progress}% complete
                  </Text>
                </View>
                {AUTO_TRACK_LABEL[goal.type] && (
                  <Text className="text-xs text-gray-400 mt-2">
                    {AUTO_TRACK_LABEL[goal.type]}
                  </Text>
                )}
              </View>
            )}

            {/* Dates */}
            <View className="flex-row gap-3">
              {goal.start_date && (
                <View className="flex-1 bg-violet-50 rounded-xl p-3">
                  <Text className="text-xs text-violet-400 mb-1">Start Date</Text>
                  <Text className="text-sm font-semibold text-violet-800">
                    {new Date(goal.start_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
              {goal.due_date && (
                <View className="flex-1 bg-violet-50 rounded-xl p-3">
                  <Text className="text-xs text-violet-400 mb-1">Due Date</Text>
                  <Text className="text-sm font-semibold text-violet-800">
                    {new Date(goal.due_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Update Progress card — only for Custom goals (all others are auto-tracked) */}
          {goal.status === 'Active' && goal.type === 'Custom' && (
            <View className="mx-5 bg-white rounded-3xl p-5 mb-4">
              <Text className="text-violet-800 font-bold text-base mb-1">Update Progress</Text>
              <Text className="text-gray-400 text-xs mb-4">
                Enter your current value to track how far you've come
              </Text>
              <View className="flex-row gap-3 items-center">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                  keyboardType="decimal-pad"
                  placeholder={`Current value (was ${goal.current_value})`}
                  placeholderTextColor="#9ca3af"
                  value={progressInput}
                  onChangeText={setProgressInput}
                  returnKeyType="done"
                  onSubmitEditing={handleUpdateProgress}
                />
                <Pressable
                  onPress={handleUpdateProgress}
                  disabled={updatingProgress || !progressInput}
                  className="bg-violet-700 px-5 py-3 rounded-xl items-center justify-center"
                  style={{ opacity: !progressInput ? 0.5 : 1 }}
                >
                  {updatingProgress ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white font-bold">Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Close goal button */}
          {goal.status === 'Active' && (
            <Pressable
              onPress={handleClose}
              disabled={closing}
              className="mx-5 bg-white/20 border border-white/30 rounded-2xl py-4 items-center"
            >
              {closing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">✓ Mark as Completed</Text>
              )}
            </Pressable>
          )}
        </ScrollView>

        <GoalSheet
          visible={editVisible}
          mode="update"
          goalId={goal.id}
          initialValues={goal}
          onClose={() => setEditVisible(false)}
          onUpdated={(updated) => {
            setGoal(updated);
            setEditVisible(false);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
