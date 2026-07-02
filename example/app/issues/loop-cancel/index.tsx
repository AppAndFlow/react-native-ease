import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease';

// Audit finding M4: a loop cancelled through the all-'none' transition path
// resurrects when the view re-attaches to the window (e.g. after a tab
// switch), because the saved loop snapshot was not cleared on cancel.
//
// Steps to reproduce:
// 1. Observe the spinner — it should loop continuously.
// 2. Press "Cancel loop". The spinner stops.
// 3. Switch to the "Other" tab, then come back.
// 4. Without the fix, the spinner is spinning again even though the
//    transition is still 'none'. With the fix, it stays stopped.

export default function LoopCancelTab() {
  const insets = useSafeAreaInsets();
  const [cancelled, setCancelled] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Cancelled loop reproducer</Text>
      <Text style={styles.body}>
        Press Cancel loop, switch to the Other tab and come back. The spinner
        must stay stopped.
      </Text>
      <Text style={styles.status}>
        transition: {cancelled ? "'none' (cancelled)" : 'timing + loop'}
      </Text>

      <View style={styles.demo}>
        <EaseView
          key={mountKey}
          initialAnimate={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={
            cancelled
              ? { type: 'none' }
              : {
                  type: 'timing',
                  duration: 1000,
                  easing: 'linear',
                  loop: 'repeat',
                }
          }
          style={styles.box}
        >
          <View style={styles.indicator} />
        </EaseView>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, cancelled && styles.buttonDisabled]}
          disabled={cancelled}
          onPress={() => setCancelled(true)}
        >
          <Text style={styles.buttonText}>Cancel loop</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => {
            setCancelled(false);
            setMountKey((k) => k + 1);
          }}
        >
          <Text style={styles.buttonText}>Restart (remount)</Text>
        </Pressable>
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
  status: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6666aa',
    marginBottom: 32,
  },
  demo: {
    alignItems: 'center',
    marginBottom: 32,
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16213e',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#e0e0ff',
    fontSize: 15,
    fontWeight: '600',
  },
});
