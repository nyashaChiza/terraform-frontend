import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Exercise } from '../../services/exercises';

// ── Colour maps ──────────────────────────────────────────────────────────────

const MUSCLE_COLORS: Record<string, { bg: string; text: string; icon: string; gradientTop: string }> = {
  chest:     { bg: '#fee2e2', text: '#dc2626', icon: 'body-outline',          gradientTop: '#fca5a5' },
  back:      { bg: '#dbeafe', text: '#1d4ed8', icon: 'accessibility-outline', gradientTop: '#93c5fd' },
  arms:      { bg: '#d1fae5', text: '#059669', icon: 'fitness-outline',       gradientTop: '#6ee7b7' },
  shoulders: { bg: '#fef3c7', text: '#b45309', icon: 'person-outline',        gradientTop: '#fcd34d' },
  legs:      { bg: '#fce7f3', text: '#db2777', icon: 'walk-outline',          gradientTop: '#f9a8d4' },
  core:      { bg: '#e0f2fe', text: '#0284c7', icon: 'ellipse-outline',       gradientTop: '#7dd3fc' },
};

const DEFAULT_MUSCLE = { bg: '#f3f4f6', text: '#374151', icon: 'barbell-outline', gradientTop: '#d1d5db' };

const STRESS_META: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  Low:    { bg: '#dcfce7', text: '#15803d', label: 'Low Intensity',    icon: 'leaf-outline' },
  Medium: { bg: '#fef3c7', text: '#a16207', label: 'Medium Intensity', icon: 'flame-outline' },
  High:   { bg: '#fee2e2', text: '#b91c1c', label: 'High Intensity',   icon: 'flash-outline' },
};

const MUSCLE_TIPS: Record<string, string[]> = {
  chest:     ['Keep your shoulder blades retracted throughout the movement', 'Control the eccentric (lowering) phase for maximum growth', 'Aim for a full stretch at the bottom of each rep'],
  back:      ['Initiate every pull from your elbows, not your hands', 'Squeeze your shoulder blades together at the top', 'Keep your core braced to protect your lower back'],
  arms:      ['Avoid swinging — isolate the working muscle', 'Full extension on every rep ensures complete range of motion', 'Slow negatives (3 seconds down) increase time under tension'],
  shoulders: ['Never raise weight above shoulder height with internal rotation', 'Keep a slight bend in your elbow to reduce joint stress', 'Control the descent to protect the rotator cuff'],
  legs:      ['Drive through your heels, not your toes', 'Keep your knees tracking over your second toe', 'Breathe in on the way down, out on the way up'],
  core:      ['Brace as if you were about to take a punch', 'Quality over quantity — slow controlled reps beat fast sloppy ones', 'Exhale fully at the peak contraction point'],
};

const DEFAULT_TIPS = ['Focus on controlled movement through the full range of motion', 'Rest 60–90 seconds between sets', 'Stop if you feel sharp or joint pain'];

// ── Component ────────────────────────────────────────────────────────────────

export default function ExerciseDetail() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { exercise: param } = useLocalSearchParams<{ exercise: string }>();

  const ex: Exercise = React.useMemo(() => {
    try { return JSON.parse(param ?? '{}'); }
    catch { return {} as Exercise; }
  }, [param]);

  const muscle  = ex.primary_muscle ?? '';
  const ms      = MUSCLE_COLORS[muscle.toLowerCase()] ?? DEFAULT_MUSCLE;
  const stress  = STRESS_META[ex.stress_level ?? ''];
  const tips    = MUSCLE_TIPS[muscle.toLowerCase()] ?? DEFAULT_TIPS;

  return (
    <View style={{ flex: 1, backgroundColor: ms.gradientTop }}>
      {/* ── Coloured header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: ms.gradientTop }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={ms.text} />
        </Pressable>
        <Text style={[styles.headerLabel, { color: ms.text }]}>Exercise</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Hero icon block ── */}
      <View style={[styles.hero, { backgroundColor: ms.gradientTop }]}>
        <View style={[styles.heroIcon, { backgroundColor: ms.bg }]}>
          <Ionicons name={ms.icon as any} size={52} color={ms.text} />
        </View>
        <Text style={[styles.heroName, { color: ms.text }]}>{ex.name}</Text>
      </View>

      {/* ── Content card ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Badges row */}
        <View style={styles.badgeRow}>
          {/* Primary muscle */}
          <View style={[styles.badge, { backgroundColor: ms.bg }]}>
            <Ionicons name={ms.icon as any} size={14} color={ms.text} />
            <Text style={[styles.badgeTxt, { color: ms.text }]}>{muscle}</Text>
          </View>

          {/* Stress level */}
          {stress && (
            <View style={[styles.badge, { backgroundColor: stress.bg }]}>
              <Ionicons name={stress.icon as any} size={14} color={stress.text} />
              <Text style={[styles.badgeTxt, { color: stress.text }]}>{stress.label}</Text>
            </View>
          )}
        </View>

        {/* Secondary muscles */}
        {ex.secondary_muscles?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="git-network-outline" size={16} color="#5b21b6" />
              <Text style={styles.sectionTitle}>Secondary Muscles</Text>
            </View>
            <View style={styles.chipRow}>
              {ex.secondary_muscles.map(m => (
                <View key={m} style={styles.chip}>
                  <Text style={styles.chipTxt}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Training tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={16} color="#5b21b6" />
            <Text style={styles.sectionTitle}>Training Tips</Text>
          </View>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Intensity guide */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer-outline" size={16} color="#5b21b6" />
            <Text style={styles.sectionTitle}>Intensity Guide</Text>
          </View>
          {Object.entries(STRESS_META).map(([key, val]) => (
            <View
              key={key}
              style={[
                styles.intensityRow,
                ex.stress_level === key && styles.intensityRowActive,
              ]}
            >
              <View style={[styles.intensityDot, { backgroundColor: val.text }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.intensityLabel, ex.stress_level === key && { color: '#1f2937', fontWeight: '800' }]}>
                  {val.label}
                </Text>
              </View>
              {ex.stress_level === key && (
                <Ionicons name="checkmark-circle" size={18} color={val.text} />
              )}
            </View>
          ))}
        </View>

        {/* Rest recommendation */}
        <View style={[styles.restCard, { borderLeftColor: ms.text }]}>
          <Ionicons name="timer-outline" size={18} color={ms.text} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.restTitle}>Recommended Rest</Text>
            <Text style={styles.restBody}>
              {ex.stress_level === 'High'
                ? '2–3 minutes between sets for full neural recovery'
                : ex.stress_level === 'Medium'
                ? '60–90 seconds between sets'
                : '30–60 seconds between sets'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  // Scrollable content
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  // Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeTxt: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Sections
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
  },
  // Chips (secondary muscles)
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipTxt: {
    fontSize: 13,
    color: '#5b21b6',
    fontWeight: '600',
  },
  // Tips
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  tipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
    marginTop: 6,
    flexShrink: 0,
  },
  tipTxt: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  // Intensity guide
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  intensityRowActive: {
    backgroundColor: '#f5f3ff',
  },
  intensityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  intensityLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  // Rest card
  restCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginTop: 4,
  },
  restTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  restBody: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 19,
  },
});
