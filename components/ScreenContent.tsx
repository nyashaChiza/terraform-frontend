import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { EditScreenInfo } from './EditScreenInfo';

type ScreenContentProps = {
  title: string;
  path: string;
  children?: React.ReactNode;
};

export const ScreenContent = ({ title, path, children }: ScreenContentProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.separator} />
      <EditScreenInfo path={path} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', backgroundColor: '#fff' },
  separator: { height: 1, marginVertical: 14, width: '80%', backgroundColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '700' },
});
