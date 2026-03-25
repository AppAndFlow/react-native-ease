export type FrameMetricsResult = {
  avgUiThreadTime: number;
  p95UiThreadTime: number;
  p99UiThreadTime: number;
  avgAnimationTime?: number;
  avgLayoutTime?: number;
  avgDrawTime?: number;
};

export const isAndroid = false;

export function startCollecting(): void {
  // no-op on web
}

export function stopCollecting(): FrameMetricsResult {
  return {
    avgUiThreadTime: 0,
    p95UiThreadTime: 0,
    p99UiThreadTime: 0,
  };
}
