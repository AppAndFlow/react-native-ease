import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, Text, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDemoSections, TABS, type TabKey } from '../src/demos';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('api');

  const sections = useMemo(() => getDemoSections(tab), [tab]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.key}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.title}>react-native-ease</Text>
          <Text style={styles.subtitle}>
            Native animations, zero JS overhead
          </Text>
          <View style={styles.tabBar}>
            {TABS.map(({ key, label }) => {
              const active = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text
                    style={[styles.tabLabel, active && styles.tabLabelActive]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => router.push(item.route)}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2a3a5e',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8888aa',
  },
  tabLabelActive: {
    color: '#fff',
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
