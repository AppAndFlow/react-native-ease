import React from 'react';
import { View, StyleSheet } from 'react-native';

const MAX_WIDTH = 600;

export function MaxWidthContainer({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
  },
});
