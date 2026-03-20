package expo.modules.framemetrics

import android.os.Handler
import android.os.HandlerThread
import android.view.FrameMetrics
import android.view.Window
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.CopyOnWriteArrayList

private data class FrameSample(
    val totalMs: Double,
    val animationMs: Double,
    val layoutMs: Double,
    val drawMs: Double,
)

class FrameMetricsModule : Module() {
    private val frameSamples = CopyOnWriteArrayList<FrameSample>()
    private var listener: Window.OnFrameMetricsAvailableListener? = null
    private var handlerThread: HandlerThread? = null

    override fun definition() = ModuleDefinition {
        Name("FrameMetrics")

        Function("startCollecting") {
            frameSamples.clear()

            val activity = appContext.currentActivity
                ?: throw IllegalStateException("No activity")

            val thread = HandlerThread("FrameMetricsHandler").also { it.start() }
            handlerThread = thread
            val handler = Handler(thread.looper)

            val l = Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
                frameSamples.add(FrameSample(
                    totalMs = frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION) / 1_000_000.0,
                    animationMs = frameMetrics.getMetric(FrameMetrics.ANIMATION_DURATION) / 1_000_000.0,
                    layoutMs = frameMetrics.getMetric(FrameMetrics.LAYOUT_MEASURE_DURATION) / 1_000_000.0,
                    drawMs = frameMetrics.getMetric(FrameMetrics.DRAW_DURATION) / 1_000_000.0,
                ))
            }
            listener = l

            activity.runOnUiThread {
                activity.window.addOnFrameMetricsAvailableListener(l, handler)
            }
        }

        Function("stopCollecting") {
            val activity = appContext.currentActivity
            val l = listener
            if (activity != null && l != null) {
                activity.runOnUiThread {
                    try {
                        activity.window.removeOnFrameMetricsAvailableListener(l)
                    } catch (_: Exception) {}
                }
            }
            listener = null
            handlerThread?.quitSafely()
            handlerThread = null

            val samples = frameSamples.toList()
            if (samples.isEmpty()) {
                return@Function mapOf(
                    "avgFrameTime" to 0.0,
                    "p95FrameTime" to 0.0,
                    "p99FrameTime" to 0.0,
                    "droppedFrames" to 0,
                    "totalFrames" to 0,
                    "frameDurations" to emptyList<Double>(),
                    "avgAnimationTime" to 0.0,
                    "p95AnimationTime" to 0.0,
                    "p99AnimationTime" to 0.0,
                    "avgUiThreadTime" to 0.0,
                    "p95UiThreadTime" to 0.0,
                    "p99UiThreadTime" to 0.0,
                    "avgLayoutTime" to 0.0,
                    "avgDrawTime" to 0.0,
                )
            }

            val totalDurations = samples.map { it.totalMs }.sorted()
            val avg = totalDurations.average()
            val p95 = totalDurations[(totalDurations.size * 0.95).toInt().coerceAtMost(totalDurations.size - 1)]
            val p99 = totalDurations[(totalDurations.size * 0.99).toInt().coerceAtMost(totalDurations.size - 1)]
            val dropped = totalDurations.count { it > 16.67 }

            val animDurations = samples.map { it.animationMs }.sorted()
            val uiThreadDurations = samples.map { it.animationMs + it.layoutMs + it.drawMs }.sorted()

            mapOf(
                "avgFrameTime" to avg,
                "p95FrameTime" to p95,
                "p99FrameTime" to p99,
                "droppedFrames" to dropped,
                "totalFrames" to totalDurations.size,
                "frameDurations" to samples.map { it.totalMs },
                "avgAnimationTime" to animDurations.average(),
                "p95AnimationTime" to animDurations[(animDurations.size * 0.95).toInt().coerceAtMost(animDurations.size - 1)],
                "p99AnimationTime" to animDurations[(animDurations.size * 0.99).toInt().coerceAtMost(animDurations.size - 1)],
                "avgUiThreadTime" to uiThreadDurations.average(),
                "p95UiThreadTime" to uiThreadDurations[(uiThreadDurations.size * 0.95).toInt().coerceAtMost(uiThreadDurations.size - 1)],
                "p99UiThreadTime" to uiThreadDurations[(uiThreadDurations.size * 0.99).toInt().coerceAtMost(uiThreadDurations.size - 1)],
                "avgLayoutTime" to samples.map { it.layoutMs }.average(),
                "avgDrawTime" to samples.map { it.drawMs }.average(),
            )
        }
    }
}
