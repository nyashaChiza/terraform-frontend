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

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setDuration(defaultSeconds);
      setRemaining(defaultSeconds);
      setRunning(false);
    }
  }, [visible, defaultSeconds]);

  // Countdown tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            // Vibrate pattern: buzz-pause-buzz-pause-buzz
            Vibration.vibrate([0, 300, 200, 300, 200, 300]);
            startPulse();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleStartPause = () => {
    if (remaining === 0) {
      // Restart
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

  // Arc circumference for the ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rest Timer</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </Pressable>
        </View>

        {/* Presets */}
        <View style={styles.presets}>
          {PRESETS.map(p => (
            <Pressable
              key={p}
              onPress={() => handlePreset(p)}
              style={[styles.preset, duration === p && styles.presetActive]}
            >
              <Text style={[styles.presetTxt, duration === p && styles.presetTxtActive]}>
                {p}s
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timer display */}
        <Animated.View style={[styles.timerWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.timerRing, isDone && styles.timerRingDone]}>
            <Text style={[styles.timerLabel, isDone && styles.timerLabelDone]}>
              {isDone ? '✓' : timeLabel}
            </Text>
            {isDone && (
              <Text style={styles.doneSubLabel}>Rest complete!</Text>
            )}
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` as any },
              isDone && styles.progressDone,
            ]}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={() => { setRemaining(r => Math.max(0, r - 15)); }}
            style={styles.adjBtn}
            disabled={running && remaining <= 15}
          >
            <Text style={styles.adjTxt}>−15s</Text>
          </Pressable>

          <Pressable
            onPress={handleStartPause}
            style={[styles.mainBtn, isDone && styles.mainBtnDone]}
          >
            <Text style={styles.mainBtnTxt}>
              {isDone ? 'Restart' : running ? 'Pause' : 'Start'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRemaining(r => r + 15)}
            style={styles.adjBtn}
          >
            <Text style={styles.adjTxt}>+15s</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5b21b6',
  },
  closeBtn: { padding: 6 },
  closeTxt: { fontSize: 20, color: '#9ca3af' },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  preset: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  presetActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed',
  },
  presetTxt: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  presetTxtActive: { color: '#fff' },
  timerWrap: {
    marginBottom: 20,
  },
  timerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ff',
  },
  timerRingDone: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  timerLabel: {
    fontSize: 40,
    fontWeight: '800',
    color: '#5b21b6',
    letterSpacing: 2,
  },
  timerLabelDone: {
    fontSize: 48,
    color: '#16a34a',
  },
  doneSubLabel: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  progressDone: {
    backgroundColor: '#16a34a',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  adjBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  adjTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  mainBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
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
