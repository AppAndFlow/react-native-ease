import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OtherTab() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Other tab</Text>
      <Text style={styles.body}>
        Switch back to the Loop tab. A cancelled loop must not restart.
      </Text>
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
    lineHeight: 20,
  },
});
