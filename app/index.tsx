import React, { useEffect } from 'react';
import { StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 4800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <ImageBackground
      source={require('../assets/splash.png')}
      style={styles.container}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
