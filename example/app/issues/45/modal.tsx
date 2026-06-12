import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease';

export default function Issue45Modal() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.heading}>Modal repro</Text>
      <Text style={styles.body}>
        Dismiss this screen. If the bug is present on Android, one or both card
        backgrounds disappear during the closing transition while the blue child
        remains visible.
      </Text>

      <View style={styles.cards}>
        <View style={styles.demo}>
          <Text style={styles.label}>Animated background</Text>
          <EaseView
            animate={{ backgroundColor: 'red' }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.card}
          >
            <View style={styles.child} />
          </EaseView>
        </View>

        <View style={styles.demo}>
          <Text style={styles.label}>Style background</Text>
          <EaseView
            transition={{ type: 'timing', duration: 300 }}
            style={styles.card2}
          >
            <View style={styles.child} />
          </EaseView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    color: '#aaaacc',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 340,
    textAlign: 'center',
  },
  cards: {
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  demo: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#8888aa',
    fontSize: 13,
  },
  card: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  card2: {
    alignItems: 'center',
    backgroundColor: 'green',
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  child: {
    backgroundColor: 'blue',
    height: 24,
    width: 24,
  },
});
