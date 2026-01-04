import React, {useEffect} from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      // Replace the splash with the login screen in history
      router.replace('/(auth)/login');
    }, 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 18, marginTop: 12 },
  logo: { width: 160, height: 160 },
});
