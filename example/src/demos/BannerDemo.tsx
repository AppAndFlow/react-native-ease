import { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function BannerDemo() {
  const [playing, setPlaying] = useState(false);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const BANNER_WIDTH = SCREEN_WIDTH - 80;
  const bannerContainerStyle = {
    width: BANNER_WIDTH,
    height: 60,
    overflow: 'hidden' as const,
    borderRadius: 12,
  };
  const bannerTrackStyle = { flexDirection: 'row' as const, height: 60 };
  const bannerSlideStyle = {
    width: BANNER_WIDTH,
    height: 60,
    backgroundColor: '#4a90d9',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  return (
    <Section title="Scrolling Banner">
      <View style={bannerContainerStyle}>
        {playing && (
          <EaseView
            initialAnimate={{ translateX: 0 }}
            animate={{ translateX: -BANNER_WIDTH }}
            transition={{
              type: 'timing',
              duration: 5000,
              easing: 'linear',
              loop: 'repeat',
            }}
            style={bannerTrackStyle}
            useHardwareLayer={false}
          >
            <View style={bannerSlideStyle}>
              <Text style={styles.bannerText}>react-native-ease</Text>
            </View>
            <View style={bannerSlideStyle}>
              <Text style={styles.bannerText}>react-native-ease</Text>
            </View>
          </EaseView>
        )}
      </View>
      <Button
        label={playing ? 'Stop' : 'Start'}
        onPress={() => setPlaying((p) => !p)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  bannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
