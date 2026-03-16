import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { EaseView, type TransitionEndEvent } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function ExitDemo() {
  const [show, setShow] = useState(true);
  const [exiting, setExiting] = useState(false);

  const handleTransitionEnd = ({ finished }: TransitionEndEvent) => {
    if (finished) {
      setShow(false);
      setExiting(false);
    }
  };

  return (
    <Section title="Exit Animation">
      <View style={styles.exitContainer}>
        {show && (
          <EaseView
            animate={{
              opacity: exiting ? 0 : 1,
              scale: exiting ? 0.8 : 1,
              translateY: exiting ? 20 : 0,
            }}
            transition={{ type: 'timing', duration: 300, easing: 'easeIn' }}
            onTransitionEnd={exiting ? handleTransitionEnd : undefined}
            style={styles.box}
          />
        )}
      </View>
      <Button
        label={show ? 'Remove' : 'Show Again'}
        onPress={() => {
          if (show) {
            setExiting(true);
          } else {
            setShow(true);
          }
        }}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  exitContainer: {
    width: 80,
    height: 80,
  },
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7ab8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
