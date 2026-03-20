import ExpoModulesCore
import QuartzCore

public final class FrameMetricsModule: Module {
  private var displayLink: CADisplayLink?
  private var frameDurations: [Double] = []
  private var lastTimestamp: CFTimeInterval = 0

  public func definition() -> ModuleDefinition {
    Name("FrameMetrics")

    Function("startCollecting") {
      self.frameDurations = []
      self.lastTimestamp = 0

      DispatchQueue.main.async {
        self.displayLink?.invalidate()
        let link = CADisplayLink(target: self, selector: #selector(self.onFrame(_:)))
        link.add(to: .main, forMode: .common)
        self.displayLink = link
      }
    }

    Function("stopCollecting") { () -> [String: Any] in
      DispatchQueue.main.sync {
        self.displayLink?.invalidate()
        self.displayLink = nil
      }

      let durations = self.frameDurations
      guard !durations.isEmpty else {
        return [
          "avgFrameTime": 0,
          "p95FrameTime": 0,
          "p99FrameTime": 0,
          "droppedFrames": 0,
          "totalFrames": 0,
          "frameDurations": [] as [Double],
        ]
      }

      let sorted = durations.sorted()
      let avg = sorted.reduce(0, +) / Double(sorted.count)
      let p95 = sorted[Int(Double(sorted.count) * 0.95)]
      let p99 = sorted[Int(min(Double(sorted.count) * 0.99, Double(sorted.count - 1)))]
      let dropped = sorted.filter { $0 > 16.67 }.count

      return [
        "avgFrameTime": avg,
        "p95FrameTime": p95,
        "p99FrameTime": p99,
        "droppedFrames": dropped,
        "totalFrames": sorted.count,
        "frameDurations": durations,
      ]
    }
  }

  @objc private func onFrame(_ link: CADisplayLink) {
    let now = link.timestamp
    if lastTimestamp > 0 {
      let duration = (now - lastTimestamp) * 1000
      frameDurations.append(duration)
    }
    lastTimestamp = now
  }
}
