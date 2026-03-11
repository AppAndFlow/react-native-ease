import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { EaseView } from 'react-native-ease';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 40;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

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

function FadeDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <Section title="Fade">
      <EaseView
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ type: 'timing', duration: 300, easing: 'easeOut' }}
        style={styles.box}
      />
      <Pressable style={styles.button} onPress={() => setVisible((v) => !v)}>
        <Text style={styles.buttonText}>{visible ? 'Hide' : 'Show'}</Text>
      </Pressable>
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
      <Pressable style={styles.button} onPress={() => setMoved((v) => !v)}>
        <Text style={styles.buttonText}>{moved ? 'Back' : 'Slide'}</Text>
      </Pressable>
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
      <Pressable style={styles.button} onPress={() => setKey((k) => k + 1)}>
        <Text style={styles.buttonText}>Replay</Text>
      </Pressable>
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
      <Pressable style={styles.button} onPress={() => setRotated((v) => !v)}>
        <Text style={styles.buttonText}>Rotate</Text>
      </Pressable>
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
      <Pressable style={styles.button} onPress={() => setActive((v) => !v)}>
        <Text style={styles.buttonText}>{active ? 'Reset' : 'Animate'}</Text>
      </Pressable>
    </Section>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>react-native-ease</Text>
          <Text style={styles.subtitle}>
            Native animations, zero JS overhead
          </Text>
          <ButtonDemo />
          <BannerDemo />
          <FadeDemo />
          <SlideDemo />
          <EnterDemo />
          <RotateDemo />
          <CombinedDemo />
        </ScrollView>
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
  section: {
    marginBottom: 28,
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
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 16,
    alignSelf: 'flex-start',
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
