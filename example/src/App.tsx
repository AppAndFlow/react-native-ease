import { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { EaseView, type TransitionEndEvent } from 'react-native-ease';

import ComparisonScreen from './ComparisonScreen';
import { Section } from './components/Section';
import { TabBar, type Screen } from './components/TabBar';
import { Button } from './components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 20px scrollContent padding + 20px section padding on each side
const BANNER_WIDTH = SCREEN_WIDTH - 80;

function ButtonDemo() {
  const [pressed, setPressed] = useState(false);

  return (
    <Section title="Animated Button">
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <EaseView
          animate={{ scale: pressed ? 0.95 : 1 }}
          transition={
            pressed
              ? { type: 'timing', duration: 100, easing: 'easeInOut' }
              : { type: 'spring', damping: 15, stiffness: 300, mass: 0.8 }
          }
          style={styles.animatedButton}
        >
          <Text style={styles.animatedButtonText}>Press Me</Text>
        </EaseView>
      </Pressable>
    </Section>
  );
}

function BannerDemo() {
  return (
    <Section title="Scrolling Banner">
      <View style={styles.bannerContainer}>
        <EaseView
          initialAnimate={{ translateX: 0 }}
          animate={{ translateX: -BANNER_WIDTH }}
          transition={{
            type: 'timing',
            duration: 5000,
            easing: 'linear',
            loop: 'repeat',
          }}
          style={styles.bannerTrack}
          useHardwareLayer={false}
        >
          <View style={styles.bannerSlide}>
            <Text style={styles.bannerText}>react-native-ease</Text>
          </View>
          <View style={styles.bannerSlide}>
            <Text style={styles.bannerText}>react-native-ease</Text>
          </View>
        </EaseView>
      </View>
    </Section>
  );
}

function PulseDemo() {
  return (
    <Section title="Pulse (Reverse Loop)">
      <EaseView
        initialAnimate={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.3, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 800,
          easing: 'easeInOut',
          loop: 'reverse',
        }}
        style={styles.pulse}
      />
    </Section>
  );
}

function FadeDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <Section title="Fade">
      <EaseView
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ type: 'timing', duration: 300, easing: 'easeOut' }}
        style={styles.box}
      />
      <Button
        label={visible ? 'Hide' : 'Show'}
        onPress={() => setVisible((v) => !v)}
      />
    </Section>
  );
}

function SlideDemo() {
  const [moved, setMoved] = useState(false);
  return (
    <Section title="Slide (Spring)">
      <EaseView
        animate={{ translateX: moved ? 150 : 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
        style={styles.box}
      />
      <Button
        label={moved ? 'Back' : 'Slide'}
        onPress={() => setMoved((v) => !v)}
      />
    </Section>
  );
}

function EnterDemo() {
  const [key, setKey] = useState(0);
  return (
    <Section title="Enter Animation">
      <EaseView
        key={key}
        initialAnimate={{ opacity: 0, translateY: 30, scale: 0.8 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 120, mass: 1 }}
        style={styles.box}
      />
      <Button label="Replay" onPress={() => setKey((k) => k + 1)} />
    </Section>
  );
}

function RotateDemo() {
  const [rotated, setRotated] = useState(false);
  return (
    <Section title="Rotate">
      <EaseView
        animate={{ rotate: rotated ? 180 : 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
        style={styles.box}
      />
      <Button label="Rotate" onPress={() => setRotated((v) => !v)} />
    </Section>
  );
}

function TransformOriginDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Transform Origin">
      <View style={styles.originRow}>
        <EaseView
          animate={{ rotate: active ? 45 : 0, scale: active ? 1.15 : 1 }}
          transformOrigin={{ x: 0, y: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
          style={styles.originBox}
        >
          <Text style={styles.originLabel}>top-left</Text>
        </EaseView>
        <EaseView
          animate={{ rotate: active ? 45 : 0, scale: active ? 1.15 : 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
          style={styles.originBox}
        >
          <Text style={styles.originLabel}>center</Text>
        </EaseView>
        <EaseView
          animate={{ rotate: active ? 45 : 0, scale: active ? 1.15 : 1 }}
          transformOrigin={{ x: 1, y: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
          style={styles.originBox}
        >
          <Text style={styles.originLabel}>bottom-right</Text>
        </EaseView>
      </View>
      <Button
        label={active ? 'Reset' : 'Rotate'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

function ExitDemo() {
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

function InterruptDemo() {
  const [moved, setMoved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <Section title="Interrupt Detection">
      <Text style={styles.interruptHint}>
        Tap quickly to interrupt the animation
      </Text>
      <EaseView
        animate={{ translateX: moved ? 200 : 0 }}
        transition={{ type: 'timing', duration: 1000, easing: 'easeInOut' }}
        onTransitionEnd={({ finished }) => {
          setStatus(finished ? 'Finished' : 'Interrupted!');
        }}
        style={styles.box}
      />
      <View style={styles.interruptRow}>
        <Button label="Toggle" compact onPress={() => setMoved((v) => !v)} />
        <Text
          style={[
            styles.statusText,
            status === 'Interrupted!'
              ? styles.statusInterrupted
              : styles.statusFinished,
          ]}
        >
          {status ?? ' '}
        </Text>
      </View>
    </Section>
  );
}

function CombinedDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Combined">
      <EaseView
        animate={{
          opacity: active ? 1 : 0.3,
          scale: active ? 1.2 : 1,
          translateY: active ? -20 : 0,
          rotate: active ? 15 : 0,
        }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
        style={styles.box}
      />
      <Button
        label={active ? 'Reset' : 'Animate'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

function DemosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>🍃 react-native-ease</Text>
      <Text style={styles.subtitle}>
        Native animations, zero JS overhead{'\n'}by App&Flow
      </Text>
      <ButtonDemo />
      <BannerDemo />
      <PulseDemo />
      <FadeDemo />
      <SlideDemo />
      <EnterDemo />
      <ExitDemo />
      <InterruptDemo />
      <RotateDemo />
      <TransformOriginDemo />
      <CombinedDemo />
    </ScrollView>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('demos');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <TabBar screen={screen} onChangeScreen={setScreen} />
        {screen === 'demos' ? <DemosScreen /> : <ComparisonScreen />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8888aa',
    marginBottom: 32,
  },
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interruptHint: {
    color: '#8888aa',
    fontSize: 13,
    marginBottom: 12,
  },
  interruptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusFinished: {
    color: '#4ade80',
  },
  statusInterrupted: {
    color: '#f87171',
  },
  pulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90d9',
  },
  exitContainer: {
    width: 80,
    height: 80,
  },
  originRow: {
    flexDirection: 'row',
    gap: 16,
  },
  originBox: {
    width: 70,
    height: 70,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  animatedButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
  },
  animatedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: 60,
    overflow: 'hidden',
    borderRadius: 12,
  },
  bannerTrack: {
    flexDirection: 'row',
    height: 60,
  },
  bannerSlide: {
    width: BANNER_WIDTH,
    height: 60,
    backgroundColor: '#4a90d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
