import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createGoal } from '../services/goals';
import { showError, showSuccess } from '../services/toast';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (goal: any) => void;
};

export default function GoalSheet({ visible, onClose, onCreated }: Props) {
  const [type, setType] = useState('WeightLoss');
  const [showTypeOptions, setShowTypeOptions] = useState(false);
  const [description, setDescription] = useState('');
  const [target_value, setTargetValue] = useState('1');
  const [starting_value, setStartingValue] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);

  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const onSubmit = async () => {
    if (!startDate || !dueDate) return showError('Validation', 'Please pick start and due dates');
    setLoading(true);
    try {
      const payload = {
        type,
        description,
        target_value: Number(target_value) || 0,
        start_date: startDate,
        due_date: dueDate,
        starting_value: Number(starting_value) || 0,
      };

      const res = await createGoal(payload as any);
      if (res.ok) {
        showSuccess('Goal created');
        onCreated?.(res.body);
        onClose();
      } else {
        showError('Create failed', JSON.stringify(res.body));
      }
    } catch (err: any) {
      showError('Network error', err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '85%' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Create Goal</Text>
          <ScrollView>
            <View style={{ marginBottom: 10 }}>
              <Pressable onPress={() => setShowTypeOptions(v => !v)} style={{ borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8 }}>
                <Text style={{ color: '#111827' }}>{type}</Text>
              </Pressable>
              {showTypeOptions && (
                <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginTop: 6, backgroundColor: '#fff' }}>
                  {['WeightLoss','MuscleGain','Endurance','Strength','Custom'].map(opt => (
                    <Pressable key={opt} onPress={() => { setType(opt); setShowTypeOptions(false); }} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' }}>
                      <Text style={{ color: '#111827' }}>{opt}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <TextInput placeholder="Description" value={description} placeholderTextColor="#374151" onChangeText={setDescription} style={{ borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, marginBottom: 10 }} />
            <TextInput placeholder="Target value" keyboardType="numeric" placeholderTextColor="#374151" value={target_value} onChangeText={setTargetValue} style={{ borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, marginBottom: 10 }} />
            <TextInput placeholder="Starting value" keyboardType="numeric" placeholderTextColor="#374151" value={starting_value} onChangeText={setStartingValue} style={{ borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, marginBottom: 10 }} />

            <Pressable onPress={() => setShowStartPicker(true)} style={{ borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 10 }}>
              <Text style={{ color: startDate ? '#111827' : '#9ca3af' }}>{startDate || 'Start date'}</Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startDate ? new Date(startDate) : new Date()}
                mode="date"
                textColor='#374151'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (d) setStartDate(formatDate(d));
                }}
              />
            )}

            <Pressable onPress={() => setShowDuePicker(true)} style={{ borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 10 }}>
              <Text style={{ color: dueDate ? '#111827' : '#9ca3af' }}>{dueDate || 'Due date'}</Text>
            </Pressable>
            {showDuePicker && (
              <DateTimePicker
                value={dueDate ? new Date(dueDate) : new Date()}
                mode="date"
                textColor='#374151'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  setShowDuePicker(Platform.OS === 'ios');
                  if (d) setDueDate(formatDate(d));
                }}
              />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Pressable onPress={onClose} disabled={loading} style={{ padding: 12, borderRadius: 8, backgroundColor: '#eee', flex: 1, marginRight: 8, alignItems: 'center' }}>
                <Text style={{ color: '#333' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onSubmit} disabled={loading} style={{ padding: 12, borderRadius: 8, backgroundColor: '#6D28D9', flex: 1, marginLeft: 8, alignItems: 'center' }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Create</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
