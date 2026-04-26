import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getGoals } from '../../services/goals';
import GoalSheet from '../../components/GoalSheet';
import { showError } from '../../services/toast';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
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

export default function GoalsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const hasActiveGoal = goals.some(g => g.status === 'Active');

  const loadGoals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await getGoals();
      if (res.ok && Array.isArray(res.body)) {
        setGoals(res.body);
      } else {
        setGoals([]);
      }
    } catch {
      showError('Error', 'Could not load goals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  return (
    <View className="flex-1 bg-violet-700">
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadGoals(true)}
            tintColor="#fff"
            colors={['#7c3aed']}
          />
        }
        ListHeaderComponent={
          <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
            <Text className="text-white text-3xl font-extrabold">Goals</Text>
            <Text className="text-violet-200 mb-6">Track your fitness objectives</Text>
            {hasActiveGoal ? (
              <View className="bg-white/10 border border-white/20 rounded-2xl py-3.5 px-4 flex-row items-center gap-2">
                <Text className="text-violet-200 text-sm flex-1">
                  You have an active goal. Complete or close it before creating a new one.
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setSheetVisible(true)}
                className="bg-white/20 border border-white/30 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-white font-semibold text-base">+ New Goal</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center mt-16 px-8">
              <Text className="text-5xl mb-4">🎯</Text>
              <Text className="text-white text-xl font-bold text-center">No goals yet</Text>
              <Text className="text-violet-200 text-center mt-2 leading-5">
                Set a goal to start generating personalised workouts
              </Text>
            </View>
          ) : (
            <ActivityIndicator color="#fff" size="large" style={{ marginTop: 60 }} />
          )
        }
        renderItem={({ item }) => {
          const icon = GOAL_ICONS[item.type] ?? '🎯';
          const s = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
          const starting = item.starting_value ?? 0;
          const denominator = item.target_value - starting;
          const progress =
            item.target_value != null && item.current_value != null && denominator !== 0
              ? Math.min(Math.max(Math.round(((item.current_value - starting) / denominator) * 100), 0), 100)
              : null;

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/goal-detail',
                  params: { goal: JSON.stringify(item) },
                })
              }
              className="bg-white/95 rounded-2xl p-4 mb-3 mx-5"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center flex-1 gap-3">
                  <Text className="text-2xl">{icon}</Text>
                  <View className="flex-1">
                    <Text className="font-bold text-violet-800 text-base">{item.type}</Text>
                    {item.description ? (
                      <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View
                  className="ml-2 px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: s.bg }}
                >
                  <Text className="text-xs font-bold" style={{ color: s.text }}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {progress !== null && (
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-400">Progress</Text>
                    <Text className="text-xs text-gray-500">
                      {item.current_value} / {item.target_value}
                      {progress !== null ? ` · ${progress}%` : ''}
                    </Text>
                  </View>
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-1.5 bg-violet-600 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </View>
                </View>
              )}

              <View className="flex-row items-center justify-between mt-2">
                {item.due_date ? (
                  <Text className="text-xs text-gray-400">
                    Due {new Date(item.due_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                ) : <View />}
                {item.type !== 'Custom' && (
                  <Text className="text-xs text-violet-400">auto-tracked</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      <GoalSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCreated={() => { setSheetVisible(false); loadGoals(); }}
      />
    </View>
  );
}
