import ExpoModulesCore
import QuartzCore
import ObjectiveC

// MARK: - Display Link Swizzle

/// Aggregates per-frame callback durations across all swizzled CADisplayLinks.
final class FrameCallbackCollector {
  static let shared = FrameCallbackCollector()

  var isCollecting = false
  private var currentFrameTimestamp: CFTimeInterval = 0
  private var currentFrameWorkMs: Double = 0
  private(set) var frameWorkTimes: [Double] = []

  func reset() {
    isCollecting = false
    currentFrameTimestamp = 0
    currentFrameWorkMs = 0
    frameWorkTimes = []
  }

  func finalize() {
    if currentFrameWorkMs > 0 {
      frameWorkTimes.append(currentFrameWorkMs)
    }
    isCollecting = false
  }

  func recordCallback(timestamp: CFTimeInterval, durationMs: Double) {
    guard isCollecting else { return }
    if timestamp != currentFrameTimestamp {
      if currentFrameTimestamp > 0 {
        frameWorkTimes.append(currentFrameWorkMs)
      }
      currentFrameTimestamp = timestamp
      currentFrameWorkMs = 0
    }
    currentFrameWorkMs += durationMs
  }
}

/// Wraps an original CADisplayLink target to measure callback duration.
final class DisplayLinkProxy: NSObject {
  let originalTarget: AnyObject
  let originalSelector: Selector

  init(target: AnyObject, selector: Selector) {
    self.originalTarget = target
    self.originalSelector = selector
    super.init()
  }

  @objc func proxyCallback(_ displayLink: CADisplayLink) {
    let start = CACurrentMediaTime()
    _ = originalTarget.perform(originalSelector, with: displayLink)
    let elapsed = (CACurrentMediaTime() - start) * 1000.0
    FrameCallbackCollector.shared.recordCallback(
      timestamp: displayLink.timestamp,
      durationMs: elapsed
    )
  }
}

private var proxyAssocKey: UInt8 = 0
private var originalFactoryIMP: IMP?
private var didSwizzle = false

private func swizzleDisplayLinkFactory() {
  guard !didSwizzle else { return }
  didSwizzle = true

  let metaCls: AnyClass = object_getClass(CADisplayLink.self)!
  let sel = NSSelectorFromString("displayLinkWithTarget:selector:")
  guard let method = class_getInstanceMethod(metaCls, sel) else { return }

  originalFactoryIMP = method_getImplementation(method)

  typealias OrigFunc = @convention(c) (AnyClass, Selector, AnyObject, Selector) -> CADisplayLink

  let block: @convention(block) (AnyObject, AnyObject, Selector) -> CADisplayLink = {
    _, target, selector in
    let proxy = DisplayLinkProxy(target: target, selector: selector)
    let orig = unsafeBitCast(originalFactoryIMP!, to: OrigFunc.self)
    let factorySel = NSSelectorFromString("displayLinkWithTarget:selector:")
    let link = orig(
      CADisplayLink.self, factorySel, proxy,
      #selector(DisplayLinkProxy.proxyCallback(_:)))
    // Keep proxy alive via associated object
    objc_setAssociatedObject(link, &proxyAssocKey, proxy, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    return link
  }

  let imp = imp_implementationWithBlock(unsafeBitCast(block, to: AnyObject.self))
  method_setImplementation(method, imp)
}

// MARK: - Module

public final class FrameMetricsModule: Module {
  private var displayLink: CADisplayLink?
  private var frameDurations: [Double] = []
  private var lastTimestamp: CFTimeInterval = 0

  public func definition() -> ModuleDefinition {
    Name("FrameMetrics")

    OnCreate {
      swizzleDisplayLinkFactory()
    }

    Function("startCollecting") {
      self.frameDurations = []
      self.lastTimestamp = 0

      let collector = FrameCallbackCollector.shared
      collector.reset()
      collector.isCollecting = true

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

      let collector = FrameCallbackCollector.shared
      collector.finalize()
      let workTimes = collector.frameWorkTimes

      let durations = self.frameDurations
      guard !durations.isEmpty else {
        return [
          "avgFrameTime": 0,
          "p95FrameTime": 0,
          "p99FrameTime": 0,
          "droppedFrames": 0,
          "totalFrames": 0,
          "frameDurations": [] as [Double],
          "avgUiThreadTime": 0,
          "p95UiThreadTime": 0,
          "p99UiThreadTime": 0,
        ]
      }

      let sorted = durations.sorted()
      let avg = sorted.reduce(0, +) / Double(sorted.count)
      let p95 = sorted[min(Int(Double(sorted.count) * 0.95), sorted.count - 1)]
      let p99 = sorted[min(Int(Double(sorted.count) * 0.99), sorted.count - 1)]
      let dropped = sorted.filter { $0 > 16.67 }.count

      var avgWork: Double = 0
      var p95Work: Double = 0
      var p99Work: Double = 0
      if !workTimes.isEmpty {
        let sortedWork = workTimes.sorted()
        avgWork = sortedWork.reduce(0, +) / Double(sortedWork.count)
        p95Work = sortedWork[min(Int(Double(sortedWork.count) * 0.95), sortedWork.count - 1)]
        p99Work = sortedWork[min(Int(Double(sortedWork.count) * 0.99), sortedWork.count - 1)]
      }

      return [
        "avgFrameTime": avg,
        "p95FrameTime": p95,
        "p99FrameTime": p99,
        "droppedFrames": dropped,
        "totalFrames": sorted.count,
        "frameDurations": durations,
        "avgUiThreadTime": avgWork,
        "p95UiThreadTime": p95Work,
        "p99UiThreadTime": p99Work,
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
