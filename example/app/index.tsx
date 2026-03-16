import { useRouter } from 'expo-router';
import { SectionList, Text, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDemoSections } from '../src/demos';

const sections = getDemoSections();

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.key}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>react-native-ease</Text>
          <Text style={styles.subtitle}>
            Native animations, zero JS overhead
          </Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => router.push(`/${item.key}`)}
        >
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8888aa',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  rowPressed: {
    backgroundColor: '#16213e',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e0ff',
  },
  chevron: {
    fontSize: 20,
    color: '#8888aa',
  },
});
