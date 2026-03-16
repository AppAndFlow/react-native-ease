import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { EaseView } from 'react-native-ease';
import { scheduleOnUI } from 'react-native-worklets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 20px scrollContent padding + 20px section padding on each side
const SLIDE_WIDTH = SCREEN_WIDTH - 80;

function EaseBanner() {
  return (
    <View style={styles.bannerContainer}>
      <EaseView
        initialAnimate={{ translateX: 0 }}
        animate={{ translateX: -SLIDE_WIDTH }}
        transition={{
          type: 'timing',
          duration: 3000,
          easing: 'linear',
          loop: 'repeat',
        }}
        style={styles.bannerTrack}
      >
        <View style={[styles.bannerSlide, styles.easeBanner]}>
          <Text style={styles.bannerText}>🍃 react-native-ease</Text>
        </View>
        <View style={[styles.bannerSlide, styles.easeBanner]}>
          <Text style={styles.bannerText}>🍃 react-native-ease</Text>
        </View>
      </EaseView>
    </View>
  );
}

function ReanimatedBanner() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-SLIDE_WIDTH, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.bannerContainer}>
      <Animated.View style={[styles.bannerTrack, animatedStyle]}>
        <View style={[styles.bannerSlide, styles.reanimatedBanner]}>
          <Text style={styles.bannerText}>🏇 react-native-reanimated</Text>
        </View>
        <View style={[styles.bannerSlide, styles.reanimatedBanner]}>
          <Text style={styles.bannerText}>🏇 react-native-reanimated</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function LagSwitch() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const id = setInterval(() => {
      scheduleOnUI(() => {
        'worklet';
        const start = Date.now();
        while (Date.now() - start < 500) {
          // block UI thread
        }
      });
    }, 800);
    return () => clearInterval(id);
  }, [enabled]);

  return (
    <View style={styles.lagSwitch}>
      <View style={styles.lagSwitchHeader}>
        <View style={styles.lagSwitchInfo}>
          <Text style={styles.lagSwitchTitle}>UI Thread Lag Switch</Text>
          <Text style={styles.lagSwitchDesc}>
            Blocks native UI thread — ease keeps running
          </Text>
        </View>
        <Pressable
          style={[styles.lagToggle, enabled && styles.lagToggleEnabled]}
          onPress={() => setEnabled((v) => !v)}
        >
          <Text style={styles.lagToggleText}>{enabled ? 'ON' : 'OFF'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ComparisonDemo() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Ease vs Reanimated</Text>
      <Text style={styles.subtitle}>
        Toggle the lag switch to block the UI thread.{'\n'}ease uses native
        animation APIs that run on the render thread,{'\n'}so animations stay
        smooth even when the UI thread is blocked.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍃 react-native-ease</Text>
        <EaseBanner />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏇 react-native-reanimated</Text>
        <ReanimatedBanner />
      </View>

      <LagSwitch />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8888aa',
    marginBottom: 28,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e0ff',
    marginBottom: 16,
  },
  bannerContainer: {
    width: SLIDE_WIDTH,
    height: 60,
    overflow: 'hidden',
    borderRadius: 12,
  },
  bannerTrack: {
    flexDirection: 'row',
    height: 60,
  },
  bannerSlide: {
    width: SLIDE_WIDTH,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  easeBanner: {
    backgroundColor: '#4a90d9',
  },
  reanimatedBanner: {
    backgroundColor: '#6c5ce7',
  },
  bannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lagSwitch: {
    marginTop: 8,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
  },
  lagSwitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lagSwitchInfo: {
    flex: 1,
    marginRight: 16,
  },
  lagSwitchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e0ff',
  },
  lagSwitchDesc: {
    fontSize: 12,
    color: '#8888aa',
    marginTop: 4,
  },
  lagToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
  },
  lagToggleEnabled: {
    backgroundColor: '#d94a4a',
  },
  lagToggleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
