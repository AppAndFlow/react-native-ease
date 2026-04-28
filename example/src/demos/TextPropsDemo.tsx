import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { EaseText } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function TextPropsDemo() {
  const [active, setActive] = useState(false);

  return (
    <Section title="Text Props">
      <EaseText
        interpolateColor={active ? '#e94560' : '#8892b0'}
        transition={{ type: 'timing', duration: 300 }}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.truncated}
      >
        This is a very long text that will be truncated to a single line with
        ellipsis because numberOfLines is set to 1
      </EaseText>

      <EaseText
        interpolateColor={active ? '#e94560' : '#ccd6f6'}
        animate={{ opacity: active ? 1 : 0.7 }}
        transition={{ type: 'timing', duration: 300 }}
        onLongPress={() => Alert.alert('Long-press', 'onLongPress fired')}
        style={styles.selectable}
      >
        Long-press me — onLongPress fires an Alert
      </EaseText>

      <EaseText
        style={[
          styles.pressable,
          active ? styles.pressableActive : styles.pressableIdle,
        ]}
        onPress={() => Alert.alert('Pressed!', 'onPress works on EaseText')}
      >
        Tap me — onPress + instant color (style)
      </EaseText>

      <EaseText
        interpolateColor={active ? '#e94560' : '#8892b0'}
        animate={{ scale: active ? 1 : 0.95 }}
        transition={{ type: 'spring', damping: 15, stiffness: 150 }}
        numberOfLines={2}
        style={styles.multiline}
      >
        Two lines max with spring scale. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </EaseText>

      <Button
        label={active ? 'Reset' : 'Activate'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  truncated: {
    fontSize: 14,
    marginBottom: 16,
  },
  selectable: {
    fontSize: 14,
    marginBottom: 16,
  },
  pressable: {
    fontSize: 14,
    marginBottom: 16,
    textDecorationLine: 'underline',
  },
  pressableIdle: {
    color: '#8892b0',
  },
  pressableActive: {
    color: '#e94560',
  },
  multiline: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
});
