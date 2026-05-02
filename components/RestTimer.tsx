import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Vibration,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  defaultSeconds?: number;
  onClose: () => void;
};

const PRESETS = [30, 60, 90, 120];

export default function RestTimer({ visible, defaultSeconds = 60, onClose }: Props) {
  const [duration, setDuration] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setDuration(defaultSeconds);
      setRemaining(defaultSeconds);
      setRunning(false);
    }
  }, [visible, defaultSeconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            Vibration.vibrate([0, 300, 200, 300, 200, 300]);
            triggerPulse();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 160, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 160, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 160, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 160, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 160, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const handleStartPause = () => {
    if (remaining === 0) {
      setRemaining(duration);
      setRunning(true);
    } else {
      setRunning(r => !r);
    }
  };

  const handlePreset = (secs: number) => {
    setDuration(secs);
    setRemaining(secs);
    setRunning(false);
  };

  const handleClose = () => {
    setRunning(false);
    Vibration.cancel();
    onClose();
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progress = duration > 0 ? remaining / duration : 0;
  const isDone = remaining === 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>

        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="timer-outline" size={20} color="#5b21b6" />
          <Text style={styles.title}>Rest Timer</Text>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Presets */}
        <View style={styles.presets}>
          {PRESETS.map(p => {
            const active = duration === p;
            return (
              <Pressable
                key={p}
                onPress={() => handlePreset(p)}
                style={[styles.preset, active && styles.presetActive]}
              >
                <Text style={[styles.presetTxt, active && styles.presetTxtActive]}>
                  {p}s
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Timer ring */}
        <Animated.View style={[styles.timerWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.timerRing, isDone && styles.timerRingDone]}>
            {isDone ? (
              <>
                <Ionicons name="checkmark-circle" size={52} color="#16a34a" />
                <Text style={styles.doneLabel}>Rest complete</Text>
              </>
            ) : (
              <Text style={styles.timeLabel}>{timeLabel}</Text>
            )}
          </View>
        </Animated.View>

        {/* Progress track */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` as any },
              isDone && styles.progressFillDone,
            ]}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={() => setRemaining(r => Math.max(0, r - 15))}
            style={styles.adjBtn}
          >
            <Ionicons name="remove" size={18} color="#374151" />
            <Text style={styles.adjTxt}>15s</Text>
          </Pressable>

          <Pressable
            onPress={handleStartPause}
            style={[styles.mainBtn, isDone && styles.mainBtnDone]}
          >
            <Ionicons
              name={isDone ? 'refresh' : running ? 'pause' : 'play'}
              size={20}
              color="#fff"
            />
            <Text style={styles.mainBtnTxt}>
              {isDone ? 'Restart' : running ? 'Pause' : 'Start'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRemaining(r => r + 15)}
            style={styles.adjBtn}
          >
            <Ionicons name="add" size={18} color="#374151" />
            <Text style={styles.adjTxt}>15s</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 44,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    width: '100%',
  },
  preset: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  presetActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed',
  },
  presetTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  presetTxtActive: {
    color: '#fff',
  },
  timerWrap: {
    marginBottom: 22,
  },
  timerRing: {
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 6,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ff',
    gap: 4,
  },
  timerRingDone: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  timeLabel: {
    fontSize: 42,
    fontWeight: '800',
    color: '#5b21b6',
    letterSpacing: 2,
  },
  doneLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f3f4f6',
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  progressFillDone: {
    backgroundColor: '#16a34a',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  adjBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  adjTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  mainBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
  },
  mainBtnDone: {
    backgroundColor: '#16a34a',
  },
  mainBtnTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
