import { View, Text, Pressable, StyleSheet } from 'react-native';

export type Screen = 'demos' | 'comparison';

export function TabBar({
  screen,
  onChangeScreen,
}: {
  screen: Screen;
  onChangeScreen: (s: Screen) => void;
}) {
  return (
    <View style={styles.tabBar}>
      <Pressable
        style={[styles.tab, screen === 'demos' && styles.tabActive]}
        onPress={() => onChangeScreen('demos')}
      >
        <Text
          style={[styles.tabText, screen === 'demos' && styles.tabTextActive]}
        >
          Demos
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, screen === 'comparison' && styles.tabActive]}
        onPress={() => onChangeScreen('comparison')}
      >
        <Text
          style={[
            styles.tabText,
            screen === 'comparison' && styles.tabTextActive,
          ]}
        >
          vs Reanimated
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#16213e',
  },
  tabActive: {
    backgroundColor: '#4a90d9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8888aa',
  },
  tabTextActive: {
    color: '#fff',
  },
});
