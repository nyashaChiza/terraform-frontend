import React from 'react';
import { Image as ExpoImage } from 'expo-image';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  /** Cloudinary URL — if null/undefined, falls back to initials */
  profilePictureUrl?: string | null;
  /** Full name used to derive initials for the fallback */
  name: string;
  /** Diameter in pixels. Defaults to 48. */
  size?: number;
}

/**
 * Circular avatar that shows a profile photo when available,
 * or a purple initials circle as a fallback — matching the existing app style.
 *
 * Usage:
 *   <Avatar profilePictureUrl={user.profile_picture_url} name="Jane Doe" size={80} />
 */
export function Avatar({ profilePictureUrl, name, size = 48 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const radius = size / 2;
  const fontSize = Math.round(size * 0.35);

  if (profilePictureUrl) {
    return (
      <ExpoImage
        source={{ uri: profilePictureUrl }}
        contentFit="cover"
        cachePolicy="memory-disk"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
