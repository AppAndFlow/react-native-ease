import { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

export function Button({
  label,
  onPress,
  compact,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={compact ? styles.wrapper : styles.wrapperMargin}
    >
      <EaseView
        animate={{ scale: pressed ? 0.95 : 1 }}
        transition={
          pressed
            ? { type: 'timing', duration: 100, easing: 'easeInOut' }
            : { type: 'spring', damping: 8, stiffness: 400, mass: 0.6 }
        }
        style={styles.button}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </EaseView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapperMargin: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  wrapper: {
    alignSelf: 'flex-start',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
  },
  buttonText: {
    color: '#e0e0ff',
    fontWeight: '600',
    fontSize: 14,
  },
});
