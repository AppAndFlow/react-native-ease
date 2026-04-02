import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EaseView } from 'react-native-ease/uniwind';

import { Section } from '../../components/Section';

export function UniwindDemo() {
  const [active, setActive] = useState(false);

  return (
    <Section title="Uniwind">
      <EaseView
        className={`self-stretch rounded-3xl border p-5 ${
          active
            ? 'bg-emerald-500 border-emerald-300'
            : 'bg-slate-800 border-slate-600'
        }`}
        animate={{
          opacity: active ? 1 : 0.8,
          scale: active ? 1 : 0.96,
          translateY: active ? -8 : 0,
        }}
        transition={{ type: 'spring', damping: 14, stiffness: 180, mass: 1 }}
      >
        <Text style={styles.eyebrow}>react-native-ease/uniwind</Text>
        <Text style={styles.title}>className + native animation</Text>
        <Text style={styles.body}>
          Toggle the card to verify Uniwind styles apply while EaseView still
          animates normally.
        </Text>
      </EaseView>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setActive((value) => !value)}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {active ? 'Reset card' : 'Activate card'}
          </Text>
        </Pressable>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: '#d4d4ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    color: '#d4d4ff',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a4a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
