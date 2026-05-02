import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showError, showSuccess } from '../services/toast';

type ExerciseWeight = {
  exercise_id: number;
  name: string;
  weight_kg: number;
};

type FeedbackPayload = {
  soreness_per_muscle: Record<string, number>;
  joint_pain: boolean;
  effort_rating: number;
  energy_level: number;
  summary: string;
  weights_used: ExerciseWeight[];
};

type Exercise = {
  exercise_id: number;
  name: string;
  suggested_weight_kg?: number;
};

type Props = {
  visible: boolean;
  muscleGroups: string[];
  exercises: Exercise[];
  onClose: () => void;
  onSubmitFeedback: (payload: FeedbackPayload) => Promise<any>;
};

function RatingButtons({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map(n => {
        const active = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.ratingBtn, active && styles.ratingBtnActive]}
          >
            <Text style={[styles.ratingBtnTxt, active && styles.ratingBtnTxtActive]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function FeedbackSheet({ visible, muscleGroups, exercises, onClose, onSubmitFeedback }: Props) {
  const [form, setForm] = useState<FeedbackPayload>({
    soreness_per_muscle: {},
    joint_pain: false,
    effort_rating: 3,
    energy_level: 3,
    summary: '',
    weights_used: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (muscleGroups.length > 0) {
      const initial: Record<string, number> = {};
      muscleGroups.map(m => m.trim()).filter(m => m.length > 0).forEach(m => { initial[m] = 1; });
      setForm(prev => ({ ...prev, soreness_per_muscle: initial }));
    }
  }, [muscleGroups]);

  useEffect(() => {
    if (exercises.length > 0) {
      const weights: ExerciseWeight[] = exercises
        .filter(ex => ex.exercise_id != null && ex.name)
        .map(ex => ({ exercise_id: ex.exercise_id, name: String(ex.name), weight_kg: ex.suggested_weight_kg ?? 0 }));
      setForm(prev => ({ ...prev, weights_used: weights }));
    }
  }, [exercises]);

  const updateSoreness = (muscle: string, val: number) =>
    setForm(prev => ({ ...prev, soreness_per_muscle: { ...prev.soreness_per_muscle, [muscle]: val } }));

  const updateWeight = (exercise_id: number, value: string) => {
    const kg = parseFloat(value) || 0;
    setForm(prev => ({
      ...prev,
      weights_used: prev.weights_used.map(w => w.exercise_id === exercise_id ? { ...w, weight_kg: kg } : w),
    }));
  };

  const validate = () => {
    if (form.effort_rating < 1 || form.effort_rating > 5) return 'Effort rating must be 1–5';
    if (form.energy_level < 1 || form.energy_level > 5) return 'Energy level must be 1–5';
    if (form.summary.length > 80) return 'Summary must be 80 characters or less';
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) { showError('Validation', err); return; }
    setLoading(true);
    try {
      await onSubmitFeedback(form);
      showSuccess('Feedback Submitted', 'Your session feedback has been saved.');
      onClose();
    } catch (e: any) {
      showError('Error', e?.message ?? 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Session Feedback</Text>
              <Text style={styles.headerSub}>Help us personalise your future workouts</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Weights */}
            {form.weights_used.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="barbell-outline" size={16} color="#5b21b6" />
                  <Text style={styles.sectionTitle}>Weights Used</Text>
                </View>
                <Text style={styles.sectionSub}>Pre-filled from AI — update to what you actually lifted</Text>
                {form.weights_used.map(w => (
                  <View key={w.exercise_id} style={styles.weightRow}>
                    <Text style={styles.weightName} numberOfLines={1}>{w.name}</Text>
                    <View style={styles.weightInput}>
                      <TextInput
                        keyboardType="decimal-pad"
                        value={w.weight_kg > 0 ? String(w.weight_kg) : ''}
                        onChangeText={v => updateWeight(w.exercise_id, v)}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        style={styles.weightInputField}
                      />
                      <View style={styles.weightUnit}>
                        <Text style={styles.weightUnitTxt}>kg</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Effort */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flash-outline" size={16} color="#5b21b6" />
                <Text style={styles.sectionTitle}>Effort Rating</Text>
              </View>
              <Text style={styles.sectionSub}>How hard did you push yourself?</Text>
              <RatingButtons value={form.effort_rating} onChange={v => setForm(p => ({ ...p, effort_rating: v }))} />
            </View>

            {/* Energy */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="battery-charging-outline" size={16} color="#5b21b6" />
                <Text style={styles.sectionTitle}>Energy Level</Text>
              </View>
              <Text style={styles.sectionSub}>How energised did you feel going in?</Text>
              <RatingButtons value={form.energy_level} onChange={v => setForm(p => ({ ...p, energy_level: v }))} />
            </View>

            {/* Soreness */}
            {muscleGroups.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="body-outline" size={16} color="#5b21b6" />
                  <Text style={styles.sectionTitle}>Muscle Soreness</Text>
                </View>
                <Text style={styles.sectionSub}>1 = no soreness · 5 = very sore</Text>
                {muscleGroups.map(muscle => (
                  <View key={muscle} style={{ marginBottom: 14 }}>
                    <Text style={styles.muscleLabel}>{muscle}</Text>
                    <RatingButtons value={form.soreness_per_muscle[muscle] || 1} onChange={v => updateSoreness(muscle, v)} />
                  </View>
                ))}
              </View>
            )}

            {/* Joint Pain */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="alert-circle-outline" size={16} color="#5b21b6" />
                <Text style={styles.sectionTitle}>Joint Pain?</Text>
              </View>
              <View style={styles.toggleRow}>
                <Pressable
                  onPress={() => setForm(p => ({ ...p, joint_pain: false }))}
                  style={[styles.toggleBtn, !form.joint_pain && styles.toggleBtnNo]}
                >
                  <Ionicons name="checkmark" size={16} color={!form.joint_pain ? '#fff' : '#9ca3af'} />
                  <Text style={[styles.toggleBtnTxt, !form.joint_pain && { color: '#fff' }]}>No pain</Text>
                </Pressable>
                <Pressable
                  onPress={() => setForm(p => ({ ...p, joint_pain: true }))}
                  style={[styles.toggleBtn, form.joint_pain && styles.toggleBtnYes]}
                >
                  <Ionicons name="alert" size={16} color={form.joint_pain ? '#fff' : '#9ca3af'} />
                  <Text style={[styles.toggleBtnTxt, form.joint_pain && { color: '#fff' }]}>Some pain</Text>
                </Pressable>
              </View>
            </View>

            {/* Summary */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="chatbubble-outline" size={16} color="#5b21b6" />
                <Text style={styles.sectionTitle}>
                  Notes <Text style={{ fontSize: 13, color: '#9ca3af', fontWeight: '400' }}>(optional)</Text>
                </Text>
              </View>
              <Text style={styles.charCount}>{form.summary.length}/80</Text>
              <TextInput
                placeholder="How did the workout feel overall?"
                placeholderTextColor="#9ca3af"
                value={form.summary}
                onChangeText={v => { if (v.length <= 80) setForm(p => ({ ...p, summary: v })); }}
                multiline
                numberOfLines={3}
                maxLength={80}
                style={styles.summaryInput}
                textAlignVertical="top"
              />
            </View>

            <Pressable onPress={onSubmit} disabled={loading} style={[styles.submitBtn, loading && { opacity: 0.8 }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.submitBtnTxt}>Submit Feedback</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:    { backgroundColor: 'rgba(0,0,0,0.45)' },
  kav:         { flex: 1, justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 14 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  headerSub:   { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  section:          { marginBottom: 24 },
  sectionTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  sectionSub:       { fontSize: 12, color: '#9ca3af', marginBottom: 12, lineHeight: 17 },
  muscleLabel:      { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 8, textTransform: 'capitalize' },
  charCount:        { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginBottom: 6 },
  weightRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  weightName:       { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600', marginRight: 12 },
  weightInput:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fafafa' },
  weightInputField: { width: 64, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center', fontSize: 15, color: '#1f2937' },
  weightUnit:       { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: '#e5e7eb' },
  weightUnitTxt:    { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  ratingRow:        { flexDirection: 'row', gap: 8 },
  ratingBtn:        { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', alignItems: 'center' },
  ratingBtnActive:  { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  ratingBtnTxt:     { fontSize: 15, fontWeight: '800', color: '#6b7280' },
  ratingBtnTxtActive: { color: '#fff' },
  toggleRow:        { flexDirection: 'row', gap: 10 },
  toggleBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  toggleBtnNo:      { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  toggleBtnYes:     { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  toggleBtnTxt:     { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  summaryInput:     { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 84, fontSize: 14, color: '#1f2937', backgroundColor: '#fafafa', lineHeight: 20 },
  submitBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7c3aed', paddingVertical: 16, borderRadius: 18 },
  submitBtnTxt:     { color: '#fff', fontSize: 16, fontWeight: '800' },
});
