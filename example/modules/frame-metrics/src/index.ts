import { NativeModule, requireNativeModule, Platform } from 'expo-modules-core';

interface FrameMetricsResult {
  /** Average UI/main thread work time per frame (ms) */
  avgUiThreadTime: number;
  /** P95 UI/main thread work time (ms) */
  p95UiThreadTime: number;
  /** P99 UI/main thread work time (ms) */
  p99UiThreadTime: number;
  /** Average time spent evaluating animators (Android only) */
  avgAnimationTime?: number;
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
