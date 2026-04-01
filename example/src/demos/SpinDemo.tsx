import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function SpinDemo() {
  const [playing, setPlaying] = useState(false);
  const [playingWithScale, setPlayingWithScale] = useState(false);
  return (
    <>
      <Section title="Spin (Repeat Loop)">
        {playing && (
          <EaseView
            initialAnimate={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              type: 'timing',
              duration: 1000,
              easing: 'linear',
              loop: 'repeat',
            }}
            style={styles.box}
          >
            <View style={styles.indicator} />
          </EaseView>
        )}
        <Button
          label={playing ? 'Stop' : 'Start'}
          onPress={() => setPlaying((p) => !p)}
        />
      </Section>
      <Section title="Spin + Scale (Reverse Loop)">
        {playingWithScale && (
          <EaseView
            initialAnimate={{ rotate: 0, scale: 0.8 }}
            animate={{ rotate: 360, scale: 1.2 }}
            transition={{
              type: 'timing',
              duration: 1500,
              easing: 'easeInOut',
              loop: 'reverse',
            }}
            style={styles.box}
          >
            <View style={styles.indicator} />
          </EaseView>
        )}
        <Button
          label={playingWithScale ? 'Stop' : 'Start'}
          onPress={() => setPlayingWithScale((p) => !p)}
        />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});
