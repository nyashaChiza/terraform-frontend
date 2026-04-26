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
      const initialSoreness: Record<string, number> = {};
      muscleGroups.forEach(muscle => { initialSoreness[muscle] = 1; });
      setForm(prev => ({ ...prev, soreness_per_muscle: initialSoreness }));
    }
  }, [muscleGroups]);

  // Pre-fill weights from suggested_weight_kg
  useEffect(() => {
    if (exercises.length > 0) {
      const initialWeights: ExerciseWeight[] = exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        name: ex.name,
        weight_kg: ex.suggested_weight_kg ?? 0,
      }));
      setForm(prev => ({ ...prev, weights_used: initialWeights }));
    }
  }, [exercises]);

  const updateSoreness = (muscle: string, rating: number) => {
    setForm(prev => ({
      ...prev,
      soreness_per_muscle: { ...prev.soreness_per_muscle, [muscle]: rating },
    }));
  };

  const updateWeight = (exercise_id: number, value: string) => {
    const kg = parseFloat(value) || 0;
    setForm(prev => ({
      ...prev,
      weights_used: prev.weights_used.map(w =>
        w.exercise_id === exercise_id ? { ...w, weight_kg: kg } : w
      ),
    }));
  };

  const validate = () => {
    if (form.effort_rating < 1 || form.effort_rating > 5) return 'Effort rating must be between 1 and 5';
    if (form.energy_level < 1 || form.energy_level > 5) return 'Energy level must be between 1 and 5';
    if (form.summary.length > 80) return 'Summary must be 80 characters or less';
    return null;
  };

  const onSubmit = async () => {
    const error = validate();
    if (error) { showError('Validation', error); return; }
    setLoading(true);
    try {
      await onSubmitFeedback(form);
      showSuccess('Feedback Submitted', 'Your session feedback has been saved!');
      onClose();
    } catch (err: any) {
      showError('Error', err?.message ?? 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const RatingButtons = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map(rating => (
        <Pressable
          key={rating}
          onPress={() => onChange(rating)}
          className={`flex-1 py-3 rounded-xl border-2 ${
            value === rating ? 'bg-violet-700 border-violet-700' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={`text-center font-bold ${value === rating ? 'text-white' : 'text-gray-700'}`}>
            {rating}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View className="bg-white rounded-t-3xl px-6 pt-6" style={styles.sheet}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-extrabold text-violet-800">Session Feedback</Text>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-gray-400 text-2xl">✕</Text>
            </Pressable>
          </View>
          <Text className="text-gray-500 mb-4">Help us improve your future workouts</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Weights Used */}
            {form.weights_used.length > 0 && (
              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-1">Weights Used</Text>
                <Text className="text-gray-400 text-xs mb-3">
                  Pre-filled from AI suggestion — update to what you actually lifted (kg)
                </Text>
                {form.weights_used.map(w => (
                  <View key={w.exercise_id} className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-700 text-sm flex-1 mr-3" numberOfLines={1}>
                      {w.name}
                    </Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl overflow-hidden">
                      <TextInput
                        keyboardType="decimal-pad"
                        value={w.weight_kg > 0 ? String(w.weight_kg) : ''}
                        onChangeText={v => updateWeight(w.exercise_id, v)}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        className="w-16 px-3 py-2 text-center text-base text-gray-900"
                      />
                      <View className="bg-gray-100 px-2 py-2">
                        <Text className="text-gray-500 text-xs">kg</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Effort Rating */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Effort Rating</Text>
              <Text className="text-gray-500 text-sm mb-3">How hard did you push yourself?</Text>
              <RatingButtons
                value={form.effort_rating}
                onChange={v => setForm(prev => ({ ...prev, effort_rating: v }))}
              />
            </View>

            {/* Energy Level */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Energy Level</Text>
              <Text className="text-gray-500 text-sm mb-3">How energized did you feel?</Text>
              <RatingButtons
                value={form.energy_level}
                onChange={v => setForm(prev => ({ ...prev, energy_level: v }))}
              />
            </View>

            {/* Muscle Soreness */}
            {muscleGroups.length > 0 && (
              <View className="mb-5">
                <Text className="text-gray-700 font-semibold mb-3">Muscle Soreness</Text>
                {muscleGroups.map(muscle => (
                  <View key={muscle} className="mb-4">
                    <Text className="text-gray-600 text-sm mb-2 capitalize">{muscle}</Text>
                    <RatingButtons
                      value={form.soreness_per_muscle[muscle] || 1}
                      onChange={v => updateSoreness(muscle, v)}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Joint Pain */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-3">Any Joint Pain?</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setForm(prev => ({ ...prev, joint_pain: false }))}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    !form.joint_pain ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`text-center font-bold ${!form.joint_pain ? 'text-white' : 'text-gray-700'}`}>
                    No
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setForm(prev => ({ ...prev, joint_pain: true }))}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    form.joint_pain ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`text-center font-bold ${form.joint_pain ? 'text-white' : 'text-gray-700'}`}>
                    Yes
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Summary */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">Summary (optional)</Text>
              <Text className="text-gray-500 text-xs mb-2">{form.summary.length}/80 characters</Text>
              <TextInput
                placeholder="How did the workout feel overall?"
                placeholderTextColor="#9ca3af"
                value={form.summary}
                onChangeText={v => { if (v.length <= 80) setForm(prev => ({ ...prev, summary: v })); }}
                multiline
                numberOfLines={3}
                maxLength={80}
                className="border border-gray-300 rounded-xl px-4 py-3 min-h-[80px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              className="bg-violet-700 py-4 rounded-2xl items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Submit Feedback</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
  },
});
