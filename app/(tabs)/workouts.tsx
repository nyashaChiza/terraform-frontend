import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WorkoutsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 18 },
});
