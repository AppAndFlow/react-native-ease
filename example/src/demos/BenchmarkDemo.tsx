import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated as RNAnimated,
  Easing as RNEasing,
  Pressable,
} from 'react-native';
import { EaseView } from 'react-native-ease';
import Animated, {
  createCSSAnimatedComponent,
  css,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  isAndroid,
  startCollecting,
  stopCollecting,
  type FrameMetricsResult,
} from '../../modules/frame-metrics/src';

const ANIMATION_DISTANCE = 100;
const ANIMATION_DURATION = 2000;
const BENCHMARK_DURATION = 5000;
const SETTLE_DELAY = 500;

const BOX_SIZE = 20;
const BOX_MARGIN = 2;

// ---------------------------------------------------------------------------
// Animation approaches
// ---------------------------------------------------------------------------

function EaseBox() {
  return (
    <EaseView
      initialAnimate={{ translateX: 0 }}
      animate={{ translateX: ANIMATION_DISTANCE }}
      transition={{
        type: 'timing',
        duration: ANIMATION_DURATION,
        easing: 'linear',
        loop: 'reverse',
      }}
      style={styles.box}
    />
  );
}

function EaseApproach({ count }: { count: number }) {
  return (
    <View style={styles.boxContainer}>
      {Array.from({ length: count }, (_, i) => (
        <EaseBox key={i} />
      ))}
    </View>
  );
}

function ReanimatedSVBox() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(ANIMATION_DISTANCE, {
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
      }),
      -1,
      true,
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[styles.box, animatedStyle]} />;
}

function ReanimatedSVApproach({ count }: { count: number }) {
  return (
    <View style={styles.boxContainer}>
      {Array.from({ length: count }, (_, i) => (
        <ReanimatedSVBox key={i} />
      ))}
    </View>
  );
}

const CSSView = createCSSAnimatedComponent(View);

const slideKeyframes = css.keyframes({
  from: { transform: [{ translateX: 0 }] },
  to: { transform: [{ translateX: ANIMATION_DISTANCE }] },
});

const cssStyles = css.create({
  box: {
    animationName: slideKeyframes,
    animationDuration: `${ANIMATION_DURATION}ms`,
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationTimingFunction: 'linear',
  },
});

function ReanimatedCSSBox() {
  return <CSSView style={[styles.box, cssStyles.box]} />;
}

function ReanimatedCSSApproach({ count }: { count: number }) {
  return (
    <View style={styles.boxContainer}>
      {Array.from({ length: count }, (_, i) => (
        <ReanimatedCSSBox key={i} />
      ))}
    </View>
  );
}

function AnimatedBox() {
  const translateX = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(translateX, {
          toValue: ANIMATION_DISTANCE,
          duration: ANIMATION_DURATION,
          easing: RNEasing.linear,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateX, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: RNEasing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [translateX]);

  return (
    <RNAnimated.View style={[styles.box, { transform: [{ translateX }] }]} />
  );
}

function AnimatedApproach({ count }: { count: number }) {
  return (
    <View style={styles.boxContainer}>
      {Array.from({ length: count }, (_, i) => (
        <AnimatedBox key={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Approach registry
// ---------------------------------------------------------------------------

const APPROACHES = [
  { key: 'ease', label: 'Ease', color: '#4a90d9', component: EaseApproach },
  {
    key: 'reanimated-sv',
    label: 'Reanimated SV',
    color: '#6c5ce7',
    component: ReanimatedSVApproach,
  },
  {
    key: 'reanimated-css',
    label: 'Reanimated CSS',
    color: '#a55eea',
    component: ReanimatedCSSApproach,
  },
  {
    key: 'animated',
    label: 'RN Animated',
    color: '#e17055',
    component: AnimatedApproach,
  },
] as const;

type ApproachKey = (typeof APPROACHES)[number]['key'];

// ---------------------------------------------------------------------------
// Benchmark component
// ---------------------------------------------------------------------------

export function BenchmarkDemo() {
  const [viewCount, setViewCount] = useState(100);
  const [activeApproach, setActiveApproach] = useState<ApproachKey | null>(
    null,
  );
  const [results, setResults] = useState<
    Partial<Record<ApproachKey, FrameMetricsResult>>
  >({});
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef(false);

  const runSingle = useCallback(
    (key: ApproachKey): Promise<FrameMetricsResult | null> => {
      return new Promise((resolve) => {
        setActiveApproach(key);

        // Let views mount and settle
        setTimeout(() => {
          if (abortRef.current) {
            resolve(null);
            return;
          }
          startCollecting();

          setTimeout(() => {
            const result = stopCollecting();
            setActiveApproach(null);
            resolve(result);
          }, BENCHMARK_DURATION);
        }, SETTLE_DELAY);
      });
    },
    [],
  );

  const runBenchmark = useCallback(
    async (keys: ApproachKey[]) => {
      abortRef.current = false;
      setRunning(true);
      setResults({});

      for (const key of keys) {
        if (abortRef.current) {
          break;
        }
        setStatusText(
          `Running: ${APPROACHES.find((a) => a.key === key)?.label}...`,
        );
        const result = await runSingle(key);
        if (result) {
          setResults((prev) => ({ ...prev, [key]: result }));
        }
        // Brief pause between approaches
        await new Promise((r) => setTimeout(r, 300));
      }

      setStatusText('');
      setRunning(false);
    },
    [runSingle],
  );

  const stopBenchmark = useCallback(() => {
    abortRef.current = true;
    try {
      stopCollecting();
    } catch {}
    setActiveApproach(null);
    setRunning(false);
    setStatusText('');
  }, []);

  // Render the active approach
  const ActiveComponent = activeApproach
    ? APPROACHES.find((a) => a.key === activeApproach)?.component
    : null;

  return (
    <View>
      <Text style={styles.title}>Animation Benchmark</Text>
      <Text style={styles.subtitle}>
        Measures per-frame time with {viewCount} simultaneously animating views.
        {'\n'}Lower is better.
      </Text>

      {/* View count slider */}
      <View style={styles.sliderSection}>
        <Text style={styles.sliderLabel}>Views: {viewCount}</Text>
        <View style={styles.sliderRow}>
          {[10, 50, 100, 200, 500].map((n) => (
            <Pressable
              key={n}
              style={[
                styles.countButton,
                viewCount === n && styles.countButtonActive,
              ]}
              onPress={() => !running && setViewCount(n)}
            >
              <Text
                style={[
                  styles.countButtonText,
                  viewCount === n && styles.countButtonTextActive,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Run buttons */}
      <View style={styles.buttonRow}>
        {running ? (
          <Pressable
            style={[styles.runButton, styles.stopButton]}
            onPress={stopBenchmark}
          >
            <Text style={styles.runButtonText}>Stop</Text>
          </Pressable>
        ) : (
          <>
            {APPROACHES.map((a) => (
              <Pressable
                key={a.key}
                style={[styles.runButton, { backgroundColor: a.color }]}
                onPress={() => runBenchmark([a.key])}
              >
                <Text style={styles.runButtonText}>{a.label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.runButton, styles.runAllButton]}
              onPress={() => runBenchmark(APPROACHES.map((a) => a.key))}
            >
              <Text style={styles.runButtonText}>Run All</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Status / active animation area */}
      {running && (
        <View style={styles.animationArea}>
          <Text style={styles.runningLabel}>{statusText}</Text>
          {activeApproach && ActiveComponent && (
            <ActiveComponent count={viewCount} />
          )}
        </View>
      )}

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsSectionTitle}>Results</Text>

          {/* Primary table: main thread work per frame */}
          <Text style={styles.subtitleText}>
            {isAndroid
              ? 'UI thread time per frame: anim + layout + draw (ms). Lower is better.'
              : 'Display link callback time per frame (ms). Lower is better.'}
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellLabel]}>
              Approach
            </Text>
            <Text style={styles.tableCell}>Avg</Text>
            <Text style={styles.tableCell}>P95</Text>
            <Text style={styles.tableCell}>P99</Text>
          </View>
          {APPROACHES.filter((a) => results[a.key]).map((a) => {
            const r = results[a.key]!;
            const avg = r.avgUiThreadTime;
            const p95 = r.p95UiThreadTime;
            const p99 = r.p99UiThreadTime;
            return (
              <View key={a.key} style={styles.tableRow}>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellLabel,
                    { color: a.color },
                  ]}
                >
                  {a.label}
                </Text>
                <Text style={[styles.tableCell, overheadColor(avg)]}>
                  {avg.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, overheadColor(p95)]}>
                  {p95.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, overheadColor(p99)]}>
                  {p99.toFixed(2)}
                </Text>
              </View>
            );
          })}

          {/* Android-only: full breakdown */}
          {isAndroid && (
            <>
              <Text style={[styles.resultsSectionTitle, styles.breakdownTitle]}>
                UI Thread Breakdown (avg ms)
              </Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableCellLabel]}>
                  Approach
                </Text>
                <Text style={styles.tableCell}>Anim</Text>
                <Text style={styles.tableCell}>Layout</Text>
                <Text style={styles.tableCell}>Draw</Text>
              </View>
              {APPROACHES.filter((a) => results[a.key]).map((a) => {
                const r = results[a.key]!;
                return (
                  <View key={a.key} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tableCellLabel,
                        { color: a.color },
                      ]}
                    >
                      {a.label}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        overheadColor(r.avgAnimationTime ?? 0),
                      ]}
                    >
                      {(r.avgAnimationTime ?? 0).toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>
                      {(r.avgLayoutTime ?? 0).toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>
                      {(r.avgDrawTime ?? 0).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </View>
      )}
    </View>
  );
}

function overheadColor(overheadMs: number): { color: string } {
  if (overheadMs < 2) {
    return { color: '#2ecc71' };
  }
  if (overheadMs < 5) {
    return { color: '#f39c12' };
  }
  return { color: '#e74c3c' };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8888aa',
    marginBottom: 20,
    lineHeight: 18,
  },
  sliderSection: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e0ff',
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
  },
  countButtonActive: {
    backgroundColor: '#4a90d9',
  },
  countButtonText: {
    color: '#8888aa',
    fontWeight: '600',
    fontSize: 14,
  },
  countButtonTextActive: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  runButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  runAllButton: {
    backgroundColor: '#2a2a4a',
  },
  stopButton: {
    backgroundColor: '#d94a4a',
  },
  runButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  animationArea: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    maxHeight: 200,
    overflow: 'hidden',
  },
  runningLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8888aa',
    marginBottom: 8,
  },
  boxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    backgroundColor: '#4a90d9',
    borderRadius: 4,
    margin: BOX_MARGIN,
  },
  resultsSection: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
  },
  resultsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e0ff',
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 13,
    color: '#8888aa',
    marginBottom: 12,
  },
  breakdownTitle: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#e0e0ff',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  tableCellLabel: {
    flex: 1.5,
    textAlign: 'left',
    fontWeight: '600',
  },
});
