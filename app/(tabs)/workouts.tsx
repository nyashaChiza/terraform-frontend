import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getExercises, Exercise } from '../../services/exercises';

const MUSCLE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  chest:       { bg: '#fee2e2', text: '#dc2626', icon: 'body-outline' },
  back:        { bg: '#dbeafe', text: '#1d4ed8', icon: 'accessibility-outline' },
  shoulders:   { bg: '#fef3c7', text: '#b45309', icon: 'person-outline' },
  biceps:      { bg: '#d1fae5', text: '#059669', icon: 'fitness-outline' },
  triceps:     { bg: '#ede9fe', text: '#7c3aed', icon: 'fitness-outline' },
  legs:        { bg: '#fce7f3', text: '#db2777', icon: 'walk-outline' },
  glutes:      { bg: '#fef9c3', text: '#ca8a04', icon: 'body-outline' },
  core:        { bg: '#e0f2fe', text: '#0284c7', icon: 'ellipse-outline' },
  cardio:      { bg: '#f0fdf4', text: '#16a34a', icon: 'bicycle-outline' },
  'full body': { bg: '#f3f4f6', text: '#374151', icon: 'flash-outline' },
};

const DEFAULT_STYLE = { bg: '#f3f4f6', text: '#374151', icon: 'barbell-outline' };

function getMuscleStyle(muscle: string) {
  return MUSCLE_COLORS[muscle.toLowerCase()] ?? DEFAULT_STYLE;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: '#dcfce7', text: '#15803d' },
  Intermediate: { bg: '#fef3c7', text: '#a16207' },
  Advanced:     { bg: '#fee2e2', text: '#b91c1c' },
  Expert:       { bg: '#ede9fe', text: '#6d28d9' },
};

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
      if (res.ok && Array.isArray(res.body)) setExercises(res.body);
    } catch (e) {
      console.warn('Exercise load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const muscleGroups = useMemo(() =>
    Array.from(new Set(exercises.map(e => e.muscle_group).filter(Boolean))).sort(),
    [exercises]
  );

  const filtered = useMemo(() => {
    let r = exercises;
    if (selectedMuscle) r = r.filter(e => e.muscle_group?.toLowerCase() === selectedMuscle.toLowerCase());
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(e => e.name?.toLowerCase().includes(q) || e.muscle_group?.toLowerCase().includes(q));
    }
    return r;
  }, [exercises, selectedMuscle, search]);

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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <Text style={styles.headerSub}>{exercises.length} exercises available</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#c4b5fd" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#c4b5fd"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#c4b5fd" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Muscle filter chips */}
      {muscleGroups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Pressable
            onPress={() => setSelectedMuscle(null)}
            style={[styles.chip, !selectedMuscle && styles.chipActive]}
          >
            <Text style={[styles.chipTxt, !selectedMuscle && styles.chipTxtActive]}>All</Text>
          </Pressable>
          {muscleGroups.map(mg => {
            const active = selectedMuscle === mg;
            const ms = getMuscleStyle(mg);
            return (
              <Pressable
                key={mg}
                onPress={() => setSelectedMuscle(active ? null : mg)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons
                  name={ms.icon as any}
                  size={12}
                  color={active ? '#7c3aed' : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>
                  {mg}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* List */}
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
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="barbell-outline" size={32} color="#a78bfa" />
              </View>
              <Text style={styles.emptyTitle}>No exercises found</Text>
              <Text style={styles.emptySub}>Try a different search term or filter</Text>
            </View>
          ) : (
            grouped.map(([muscle, exs]) => {
              const ms = getMuscleStyle(muscle);
              return (
                <View key={muscle} style={{ marginBottom: 18 }}>
                  {/* Group label */}
                  <View style={styles.groupLabel}>
                    <Ionicons name={ms.icon as any} size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.groupLabelTxt}>{muscle}</Text>
                    <View style={styles.groupCount}>
                      <Text style={styles.groupCountTxt}>{exs.length}</Text>
                    </View>
                  </View>

                  {exs.map((ex) => {
                    const diffStyle = DIFFICULTY_COLORS[ex.difficulty ?? ''] ?? { bg: '#f3f4f6', text: '#6b7280' };
                    return (
                      <View key={ex.id} style={styles.exCard}>
                        {/* Muscle color strip */}
                        <View style={[styles.exStrip, { backgroundColor: ms.bg }]}>
                          <Ionicons name={ms.icon as any} size={16} color={ms.text} />
                        </View>

                        <View style={styles.exContent}>
                          <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                          {ex.equipment && (
                            <Text style={styles.exEquipment}>{ex.equipment}</Text>
                          )}
                          {ex.description && (
                            <Text style={styles.exDesc} numberOfLines={2}>{ex.description}</Text>
                          )}
                        </View>

                        {ex.difficulty && (
                          <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                            <Text style={[styles.diffTxt, { color: diffStyle.text }]}>
                              {ex.difficulty}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerSub: { color: '#c4b5fd', fontSize: 14, marginTop: 2, marginBottom: 14 },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    fontSize: 15,
  },
  // Chips
  chips: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipActive: { backgroundColor: '#fff' },
  chipTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'capitalize',
  },
  chipTxtActive: { color: '#7c3aed' },
  // Group
  groupLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupLabelTxt: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  groupCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  groupCountTxt: { fontSize: 11, color: '#fff', fontWeight: '700' },
  // Exercise card
  exCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  exStrip: {
    width: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  exName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  exEquipment: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  exDesc: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 17 },
  diffBadge: {
    marginRight: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffTxt: { fontSize: 11, fontWeight: '700' },
  // Empty
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptySub: { color: '#c4b5fd', fontSize: 14, textAlign: 'center' },
});
