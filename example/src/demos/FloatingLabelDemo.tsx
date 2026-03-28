import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { EaseText } from 'react-native-ease';

import { Section } from '../components/Section';

function FloatingInput({ label }: { label: string }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const compact = focused || value.length > 0;

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelWrapper}>
        <EaseText
          interpolateColor={compact ? '#e94560' : '#8892b0'}
          animate={{
            translateY: compact ? -24 : 0,
            scale: compact ? 0.75 : 1,
          }}
          transition={{
            color: { type: 'timing', duration: 150 },
            transform: { type: 'spring', damping: 12, stiffness: 250 },
          }}
          transformOrigin={{ x: 0, y: 0.5 }}
          style={styles.floatingLabel}
        >
          {label}
        </EaseText>
      </View>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={setValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="transparent"
      />
    </View>
  );
}

export function FloatingLabelDemo() {
  return (
    <Section title="Floating Label Input">
      <FloatingInput label="Email" />
      <FloatingInput label="Password" />
      <FloatingInput label="Full Name" />
    </Section>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
    paddingTop: 22,
  },
  labelWrapper: {
    position: 'absolute',
    left: 0,
    top: 22,
  },
  floatingLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
  textInput: {
    fontSize: 15,
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
});
