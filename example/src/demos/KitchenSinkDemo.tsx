import { View, Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';

export function KitchenSinkDemo() {
  return (
    <Section title="Kitchen Sink">
      <View style={styles.surface}>
        <EaseView
          initialAnimate={{
            opacity: 0.4,
            translateX: -50,
            translateY: 30,
            scale: 0.6,
            rotate: -15,
            borderRadius: 8,
            backgroundColor: '#1e1b4b',
            borderWidth: 0,
            borderColor: '#1e1b4b',
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
            elevation: 0,
          }}
          animate={{
            opacity: 1,
            translateX: 50,
            translateY: -20,
            scale: 1.2,
            rotate: 15,
            borderRadius: 40,
            backgroundColor: '#6366f1',
            borderWidth: 4,
            borderColor: '#fbbf24',
            shadowOpacity: 0.6,
            shadowRadius: 24,
            shadowOffset: { width: 6, height: 16 },
            elevation: 20,
          }}
          transition={{
            type: 'timing',
            duration: 2000,
            easing: 'easeInOut',
            loop: 'reverse',
          }}
          style={styles.box}
        >
          <Text style={styles.emoji}>{'🤯'}</Text>
          <Text style={styles.text}>every prop</Text>
        </EaseView>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: '#e8eaf0',
    borderRadius: 16,
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  box: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
  },
  emoji: {
    fontSize: 32,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
