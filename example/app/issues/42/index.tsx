import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease';

// Issue #42: Loop animations stop after switching tabs in React Navigation.
// https://github.com/AppAndFlow/react-native-ease/issues/42
//
// Steps to reproduce:
// 1. Observe the spinner and pulse on this tab — both should loop continuously.
// 2. Switch to the "Other" tab.
// 3. Switch back. Without the fix, both animations are frozen.
// 4. Mount-id below should NOT change — the component isn't being remounted;
//    only the iOS view detaches from the window, which removes its CAAnimations.

export default function LoopTab() {
  const insets = useSafeAreaInsets();
  // Stable id per mount — verifies the component is NOT being remounted on tab
  // switch. If this number changes when you come back, the bug is unrelated.
  const [mountId] = useState(() => Math.floor(Math.random() * 10000));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Issue #42 reproducer</Text>
      <Text style={styles.body}>
        Switch to the Other tab and back. Both animations should keep looping.
      </Text>
      <Text style={styles.mountId}>mount #{mountId}</Text>

      <View style={styles.row}>
        <View style={styles.demo}>
          <Text style={styles.demoLabel}>Spin (repeat)</Text>
          <EaseView
            initialAnimate={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              type: 'timing',
              duration: 1000,
              easing: 'linear',
              loop: 'repeat',
            }}
            style={styles.box}
          >
            <View style={styles.indicator} />
          </EaseView>
        </View>

        <View style={styles.demo}>
          <Text style={styles.demoLabel}>Pulse (reverse)</Text>
          <EaseView
            initialAnimate={{ scale: 0.8 }}
            animate={{ scale: 1.2 }}
            transition={{
              type: 'timing',
              duration: 600,
              easing: 'easeInOut',
              loop: 'reverse',
            }}
            style={styles.circle}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#aaaacc',
    marginBottom: 8,
    lineHeight: 20,
  },
  mountId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6666aa',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  demo: {
    alignItems: 'center',
    gap: 12,
  },
  demoLabel: {
    fontSize: 13,
    color: '#8888aa',
  },
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d94a90',
  },
});
