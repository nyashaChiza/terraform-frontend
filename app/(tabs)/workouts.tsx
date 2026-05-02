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
import { useRouter } from 'expo-router';
import { getExercises, Exercise } from '../../services/exercises';

// Keyed to the backend MuscleGroup enum values
const MUSCLE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  chest:     { bg: '#fee2e2', text: '#dc2626', icon: 'body-outline' },
  back:      { bg: '#dbeafe', text: '#1d4ed8', icon: 'accessibility-outline' },
  arms:      { bg: '#d1fae5', text: '#059669', icon: 'fitness-outline' },
  shoulders: { bg: '#fef3c7', text: '#b45309', icon: 'person-outline' },
  legs:      { bg: '#fce7f3', text: '#db2777', icon: 'walk-outline' },
  core:      { bg: '#e0f2fe', text: '#0284c7', icon: 'ellipse-outline' },
};

const DEFAULT_STYLE = { bg: '#f3f4f6', text: '#374151', icon: 'barbell-outline' };

function getMuscleStyle(muscle: string) {
  return MUSCLE_COLORS[muscle.toLowerCase()] ?? DEFAULT_STYLE;
}

// Maps backend StressLevel enum values
const STRESS_COLORS: Record<string, { bg: string; text: string }> = {
  Low:    { bg: '#dcfce7', text: '#15803d' },
  Medium: { bg: '#fef3c7', text: '#a16207' },
  High:   { bg: '#fee2e2', text: '#b91c1c' },
};

export default function WorkoutsTab() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
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
    Array.from(new Set(exercises.map(e => e.primary_muscle).filter(Boolean))).sort(),
    [exercises]
  );

  const filtered = useMemo(() => {
    let r = exercises;
    if (selectedMuscle) r = r.filter(e => e.primary_muscle?.toLowerCase() === selectedMuscle.toLowerCase());
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(e =>
        e.name?.toLowerCase().includes(q) ||
        e.primary_muscle?.toLowerCase().includes(q) ||
        e.secondary_muscles?.some(m => m.toLowerCase().includes(q))
      );
    }
    return r;
  }, [exercises, selectedMuscle, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      const key = ex.primary_muscle || 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(ex);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <View style={{ flex: 1, backgroundColor: '#7c3aed' }}>

      {/* ── Purple header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <Text style={styles.headerSub}>{exercises.length} exercises available</Text>

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

      {/* ── Compact filter chips (fixed height row) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
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
                color={active ? '#7c3aed' : 'rgba(255,255,255,0.75)'}
              />
              <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{mg}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── White card surface ── */}
      <View style={styles.surface}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingTxt}>Loading exercises…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadExercises(true)}
                tintColor="#7c3aed"
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
                <Text style={styles.emptySub}>Try a different search or filter</Text>
              </View>
            ) : (
              grouped.map(([muscle, exs]) => {
                const ms = getMuscleStyle(muscle);
                return (
                  <View key={muscle} style={styles.group}>
                    {/* Group header */}
                    <View style={styles.groupHeader}>
                      <View style={[styles.groupIconWrap, { backgroundColor: ms.bg }]}>
                        <Ionicons name={ms.icon as any} size={13} color={ms.text} />
                      </View>
                      <Text style={[styles.groupTitle, { color: ms.text }]}>{muscle}</Text>
                      <View style={[styles.groupBadge, { backgroundColor: ms.bg }]}>
                        <Text style={[styles.groupBadgeTxt, { color: ms.text }]}>{exs.length}</Text>
                      </View>
                    </View>

                    {/* Exercise cards */}
                    {exs.map((ex, idx) => {
                      const stressStyle = STRESS_COLORS[ex.stress_level ?? ''] ?? { bg: '#f3f4f6', text: '#6b7280' };
                      const isLast = idx === exs.length - 1;
                      return (
                        <Pressable
                          key={ex.id}
                          style={[styles.exRow, !isLast && styles.exRowBorder]}
                          onPress={() => router.push({
                            pathname: '/(tabs)/exercise-detail',
                            params: { exercise: JSON.stringify(ex) },
                          })}
                        >
                          <View style={styles.exRowLeft}>
                            <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                            {ex.secondary_muscles?.length > 0 && (
                              <Text style={styles.exSub} numberOfLines={1}>
                                Also works: {ex.secondary_muscles.join(', ')}
                              </Text>
                            )}
                          </View>
                          <View style={styles.exRowRight}>
                            {ex.stress_level && (
                              <View style={[styles.stressBadge, { backgroundColor: stressStyle.bg }]}>
                                <Text style={[styles.stressTxt, { color: stressStyle.text }]}>
                                  {ex.stress_level}
                                </Text>
                              </View>
                            )}
                            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerSub:   { color: '#c4b5fd', fontSize: 13, marginTop: 2, marginBottom: 14 },
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
    paddingVertical: 11,
    fontSize: 15,
  },

  // ── Chips — fixed-height horizontal row ──
  chipsScroll: {
    flexGrow: 0,           // ← the key fix: don't let it expand vertically
    marginBottom: 14,
  },
  chipsContent: {
    paddingHorizontal: 20,
    paddingVertical: 2,
    gap: 8,
    alignItems: 'center', // keep chips vertically centred within the row
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipActive:    { backgroundColor: '#fff' },
  chipTxt:       { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.88)', textTransform: 'capitalize' },
  chipTxtActive: { color: '#7c3aed' },

  // ── White surface ──
  surface: {
    flex: 1,
    backgroundColor: '#f5f3ff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 140,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 60,
  },
  loadingTxt: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },

  // ── Muscle group ──
  group: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  groupIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  groupBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  groupBadgeTxt: { fontSize: 11, fontWeight: '800' },

  // ── Exercise rows (inside card) ──
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  exRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  exRowLeft: { flex: 1, marginRight: 10 },
  exName:    { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  exSub:     { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  exRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stressBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stressTxt: { fontSize: 11, fontWeight: '700' },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: '#374151', fontSize: 18, fontWeight: '800' },
  emptySub:   { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
});
