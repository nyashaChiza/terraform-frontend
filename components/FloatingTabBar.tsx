import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authStore } from '../store/auth';
import { getUnreadCount } from '../services/notifications';

const TABS = [
  { name: 'home',     active: 'home',       inactive: 'home-outline' },
  { name: 'progress', active: 'bar-chart',  inactive: 'bar-chart-outline' },
  { name: 'friends',  active: 'people',     inactive: 'people-outline' },
  { name: 'workouts', active: 'barbell',    inactive: 'barbell-outline' },
  { name: 'profile',  active: 'person',     inactive: 'person-outline' },
] as const;

type Props = {
  state: any;
  navigation: any;
};

const HIDE_ON = ['session-details', 'goal-detail', 'exercise-detail'];

export default function FloatingTabBar({ state, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const currentName = state.routes[state.index]?.name;

  if (HIDE_ON.includes(currentName)) return null;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 10 }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={72} tint="dark" style={styles.blurContainer}>
          <View style={styles.overlay} />
          <TabButtons currentName={currentName} state={state} navigation={navigation} />
        </BlurView>
      ) : (
        <View style={styles.androidContainer}>
          <TabButtons currentName={currentName} state={state} navigation={navigation} />
        </View>
      )}
    </View>
  );
}

function TabButtons({ currentName, state, navigation }: { currentName: string; state: any; navigation: any }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try { setUnreadCount(await getUnreadCount()); } catch {}
    };
    fetch();
    pollRef.current = setInterval(fetch, 60_000); // poll every minute
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          authStore.set({ token: null, token_type: null, user: null });
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.inner}>
      {TABS.map((tab) => {
        const isFocused = currentName === tab.name;
        const route = state.routes.find((r: any) => r.name === tab.name);
        if (!route) return null;

        // Bell badge on home tab when there are unread notifications
        const showBadge = tab.name === 'home' && unreadCount > 0;

        return (
          <Pressable
            key={tab.name}
            onPress={() => { if (!isFocused) navigation.navigate(tab.name); }}
            style={styles.tabBtn}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <Ionicons
                name={isFocused ? tab.active : tab.inactive}
                size={21}
                color={isFocused ? '#6d28d9' : 'rgba(255,255,255,0.55)'}
              />
              {showBadge && <View style={styles.badge} />}
            </View>
          </Pressable>
        );
      })}

      {/* Logout */}
      <Pressable onPress={handleLogout} style={styles.tabBtn}>
        <View style={styles.iconWrap}>
          <Ionicons name="log-out-outline" size={21} color="rgba(255,255,255,0.55)" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  blurContainer: {
    borderRadius: 36,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 10, 60, 0.35)',
    borderRadius: 36,
  },
  androidContainer: {
    borderRadius: 36,
    backgroundColor: 'rgba(30, 10, 60, 0.92)',
  },
  inner: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  tabBtn: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.93)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
});
