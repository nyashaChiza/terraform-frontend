import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getExercises, Exercise } from '../../services/exercises';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#fee2e2',
  back: '#dbeafe',
  shoulders: '#fef3c7',
  biceps: '#d1fae5',
  triceps: '#ede9fe',
  legs: '#fce7f3',
  glutes: '#fef9c3',
  core: '#e0f2fe',
  cardio: '#f0fdf4',
  'full body': '#f3f4f6',
};

const MUSCLE_TEXT: Record<string, string> = {
  chest: '#dc2626',
  back: '#1d4ed8',
  shoulders: '#b45309',
  biceps: '#059669',
  triceps: '#7c3aed',
  legs: '#db2777',
  glutes: '#ca8a04',
  core: '#0284c7',
  cardio: '#16a34a',
  'full body': '#374151',
};

function tag(muscle: string) {
  const key = muscle.toLowerCase();
  return {
    bg: MUSCLE_COLORS[key] ?? '#f3f4f6',
    txt: MUSCLE_TEXT[key] ?? '#374151',
  };
}

export default function WorkoutsTab() {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const loadExercises = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getExercises();
      if (res.ok && Array.isArray(res.body)) {
        setExercises(res.body);
      }
    } catch (e) {
      console.warn('Exercise load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  // Unique muscle groups for filter chips
  const muscleGroups = useMemo(() => {
    const groups = Array.from(
      new Set(exercises.map(e => e.muscle_group).filter(Boolean))
    ).sort();
    return groups;
  }, [exercises]);

  // Filtered list
  const filtered = useMemo(() => {
    let result = exercises;
    if (selectedMuscle) {
      result = result.filter(
        e => e.muscle_group?.toLowerCase() === selectedMuscle.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        e =>
          e.name?.toLowerCase().includes(q) ||
          e.muscle_group?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [exercises, selectedMuscle, search]);

  // Group by muscle
  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      const key = ex.muscle_group || 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(ex);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>Exercise Library</Text>
        <Text style={{ color: '#c4b5fd', fontSize: 14, marginTop: 2 }}>
          {exercises.length} exercises available
        </Text>

        {/* Search */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            marginTop: 14,
          }}
        >
          <Text style={{ color: '#c4b5fd', fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#c4b5fd"
            style={{ flex: 1, color: '#fff', paddingVertical: 12, fontSize: 15 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={{ color: '#c4b5fd', fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Muscle filter chips */}
      {muscleGroups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
        >
          <Pressable
            onPress={() => setSelectedMuscle(null)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: !selectedMuscle ? '#fff' : 'rgba(255,255,255,0.2)',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: !selectedMuscle ? '#7c3aed' : '#fff',
              }}
            >
              All
            </Text>
          </Pressable>
          {muscleGroups.map(mg => {
            const active = selectedMuscle === mg;
            return (
              <Pressable
                key={mg}
                onPress={() => setSelectedMuscle(active ? null : mg)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.2)',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: active ? '#7c3aed' : '#fff',
                    textTransform: 'capitalize',
                  }}
                >
                  {mg}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#c4b5fd', marginTop: 12 }}>Loading exercises...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadExercises(true)}
              tintColor="#fff"
              colors={['#7c3aed']}
            />
          }
        >
          {grouped.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🏋️</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                No exercises found
              </Text>
              <Text style={{ color: '#c4b5fd', fontSize: 14, marginTop: 4 }}>
                Try a different search or filter
              </Text>
            </View>
          ) : (
            grouped.map(([muscle, exs]) => {
              const { bg, txt } = tag(muscle);
              return (
                <View key={muscle} style={{ marginBottom: 20 }}>
                  {/* Group header */}
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    {muscle}
                  </Text>

                  {exs.map((ex, i) => (
                    <View
                      key={ex.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: '#1f1f2e', fontSize: 15, fontWeight: '700' }}
                          numberOfLines={1}
                        >
                          {ex.name}
                        </Text>
                        {ex.equipment && (
                          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                            {ex.equipment}
                          </Text>
                        )}
                        {ex.description && (
                          <Text
                            style={{ color: '#6b7280', fontSize: 12, marginTop: 4, lineHeight: 17 }}
                            numberOfLines={2}
                          >
                            {ex.description}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          marginLeft: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 10,
                          backgroundColor: bg,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: txt,
                            textTransform: 'capitalize',
                          }}
                        >
                          {ex.difficulty ?? muscle}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
