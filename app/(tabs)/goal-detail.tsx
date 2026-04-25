import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { closeGoal } from '../../services/goals';
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

export default function GoalDetail() {
  const { goal: goalParam } = useLocalSearchParams<{ goal: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState<any>(() => JSON.parse(goalParam ?? '{}'));
  const [editVisible, setEditVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const s = STATUS_STYLES[goal.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
  const icon = GOAL_ICONS[goal.type] ?? '🎯';
  const progress =
    goal.target_value && goal.current_value != null
      ? Math.min((goal.current_value / goal.target_value) * 100, 100)
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
                showSuccess('Goal completed!');
                router.back();
              } else {
                showError('Error', 'Could not close this goal.');
              }
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  return (
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
        contentContainerStyle={{ paddingBottom: 140 }}
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
                  {goal.current_value} / {goal.target_value}
                </Text>
              </View>
              <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-3 bg-violet-600 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-xs text-violet-600 font-semibold mt-1.5">
                {Math.round(progress)}% complete
              </Text>
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
  );
}
