import { NativeModule, requireNativeModule, Platform } from 'expo-modules-core';

interface FrameMetricsResult {
  /** Average frame duration in ms */
  avgFrameTime: number;
  /** P95 frame duration in ms */
  p95FrameTime: number;
  /** P99 frame duration in ms */
  p99FrameTime: number;
  /** Number of frames that exceeded the frame budget */
  droppedFrames: number;
  /** Total frames collected */
  totalFrames: number;
  /** All frame durations in ms */
  frameDurations: number[];
  /** Average time spent evaluating animators (Android only) */
  avgAnimationTime?: number;
  /** P95 animation time (Android only) */
  p95AnimationTime?: number;
  /** P99 animation time (Android only) */
  p99AnimationTime?: number;
  /** Average UI thread time: anim + layout + draw (Android only) */
  avgUiThreadTime?: number;
  /** P95 UI thread time (Android only) */
  p95UiThreadTime?: number;
  /** P99 UI thread time (Android only) */
  p99UiThreadTime?: number;
  /** Average layout/measure time (Android only) */
  avgLayoutTime?: number;
  /** Average draw time (Android only) */
  avgDrawTime?: number;
}

declare class FrameMetricsModuleType extends NativeModule {
  startCollecting(): void;
  stopCollecting(): FrameMetricsResult;
}

const mod = requireNativeModule<FrameMetricsModuleType>('FrameMetrics');

export const isAndroid = Platform.OS === 'android';

export function startCollecting(): void {
  mod.startCollecting();
}

export function stopCollecting(): FrameMetricsResult {
  return mod.stopCollecting();
}

export type { FrameMetricsResult };
