import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OtherTab() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.heading}>Other tab</Text>
      <Text style={styles.body}>
        Switch back to the Loop tab. Animations should still be running.
      </Text>
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemText}>Item {i + 1}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingHorizontal: 20,
    gap: 8,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  item: {
    padding: 16,
    backgroundColor: '#16213e',
    borderRadius: 12,
  },
  itemText: {
    color: '#e0e0ff',
    fontSize: 15,
  },
});
