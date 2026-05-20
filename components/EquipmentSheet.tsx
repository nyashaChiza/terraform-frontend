import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getEquipmentCatalog,
  getMyEquipment,
  updateMyEquipment,
  EquipmentCatalogGroup,
  EquipmentItem,
} from '../services/equipment';
import { showError, showSuccess } from '../services/toast';

const CATEGORY_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  cardio: 'Cardio',
  cable: 'Cable',
  free_weight: 'Free Weights',
  machine: 'Machines',
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function EquipmentSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [catalog, setCatalog] = useState<EquipmentCatalogGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bodyweightIds, setBodyweightIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [catalogData, myData] = await Promise.all([
          getEquipmentCatalog(),
          getMyEquipment(),
        ]);
        if (cancelled) return;

        const bwIds = new Set<number>();
        catalogData.forEach(group => {
          group.items.forEach(item => {
            if (item.is_bodyweight) bwIds.add(item.id);
          });
        });

        const myIds = new Set<number>(myData.map(e => e.id));

        setCatalog(catalogData);
        setBodyweightIds(bwIds);
        setSelectedIds(myIds);
      } catch (err: any) {
        showError('Error', err?.message ?? 'Failed to load equipment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible]);

  const toggle = (item: EquipmentItem) => {
    if (item.is_bodyweight) return; // bodyweight always selected, not toggleable
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      // Only send non-bodyweight IDs — backend always adds bodyweight
      const nonBwIds = [...selectedIds].filter(id => !bodyweightIds.has(id));
      await updateMyEquipment(nonBwIds);
      showSuccess('Equipment saved');
      onClose();
    } catch (err: any) {
      showError('Save failed', err?.message ?? 'Could not save equipment');
    } finally {
      setSaving(false);
    }
  };

  const CATEGORY_ORDER = ['bodyweight', 'free_weight', 'cable', 'machine', 'cardio'];
  const sortedCatalog = [...catalog].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
        onPress={onClose}
      />
      {/* Sheet container — flex column, max 85% height, footer always visible */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', flexDirection: 'column' }}>
          {/* Header */}
          <View className="px-6 pt-6 pb-4 border-b border-gray-100">
            <Text className="text-2xl font-extrabold text-violet-800">My Equipment</Text>
            <Text className="text-gray-500 mt-1 text-sm">
              Select the equipment you have access to. Bodyweight is always included.
            </Text>
          </View>

          {/* Scrollable body */}
          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#6d28d9" />
            </View>
          ) : (
            <ScrollView
              className="px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {sortedCatalog.map(group => (
                <View key={group.category} className="mt-5">
                  <Text className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">
                    {CATEGORY_LABELS[group.category] ?? group.category}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.items.map(item => {
                      const isSelected = selectedIds.has(item.id);
                      const isLocked = item.is_bodyweight;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => toggle(item)}
                          className={`px-4 py-2 rounded-xl border-2 ${
                            isSelected
                              ? isLocked
                                ? 'bg-violet-200 border-violet-200'
                                : 'bg-violet-700 border-violet-700'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <Text
                            className={`font-semibold text-sm ${
                              isSelected
                                ? isLocked
                                  ? 'text-violet-700'
                                  : 'text-white'
                                : 'text-gray-600'
                            }`}
                          >
                            {item.name}
                            {isLocked ? ' ✓' : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
              {/* Extra space so last row clears the footer */}
              <View style={{ height: 12 }} />
            </ScrollView>
          )}

          {/* Footer — part of the flex column, not absolute */}
          <View
            className="bg-white border-t border-gray-100 px-6 pt-4 flex-row gap-3"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            <Pressable
              onPress={onClose}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-gray-100 items-center"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={saving || loading}
              className="flex-1 py-4 rounded-2xl bg-violet-700 items-center"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-white">Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
