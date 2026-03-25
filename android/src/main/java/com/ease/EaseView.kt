package com.ease

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.Outline
import android.view.View
import android.view.ViewOutlineProvider
import android.view.animation.PathInterpolator
import androidx.dynamicanimation.animation.DynamicAnimation
import androidx.dynamicanimation.animation.SpringAnimation
import androidx.dynamicanimation.animation.SpringForce
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.sqrt

class EaseView(context: Context) : ReactViewGroup(context) {

    // --- Previous animate values (for change detection) ---
    private var prevOpacity: Float? = null
    private var prevTranslateX: Float? = null
    private var prevTranslateY: Float? = null
    private var prevScaleX: Float? = null
    private var prevScaleY: Float? = null
    private var prevRotate: Float? = null
    private var prevRotateX: Float? = null
    private var prevRotateY: Float? = null
    private var prevBorderRadius: Float? = null
    private var prevBackgroundColor: Int? = null
    private var currentBackgroundColor: Int = Color.TRANSPARENT

    // --- First mount tracking ---
    private var isFirstMount: Boolean = true

    // --- Transition configs (set by ViewManager via ReadableMap) ---
    private var transitionConfigs: Map<String, TransitionConfig> = emptyMap()

    data class TransitionConfig(
        val type: String,
        val duration: Int,
        val easingBezier: FloatArray,
        val damping: Float,
        val stiffness: Float,
        val mass: Float,
        val loop: String,
        val delay: Long
    )

    fun setTransitionsFromMap(map: ReadableMap?) {
        if (map == null) {
            transitionConfigs = emptyMap()
            return
        }
        val configs = mutableMapOf<String, TransitionConfig>()
        val keys = listOf("defaultConfig", "transform", "opacity", "borderRadius", "backgroundColor")
        for (key in keys) {
            if (map.hasKey(key)) {
                val configMap = map.getMap(key) ?: continue
                val bezierArray = configMap.getArray("easingBezier")!!
                configs[key] = TransitionConfig(
                    type = configMap.getString("type")!!,
                    duration = configMap.getInt("duration"),
                    easingBezier = floatArrayOf(
                        bezierArray.getDouble(0).toFloat(),
                        bezierArray.getDouble(1).toFloat(),
                        bezierArray.getDouble(2).toFloat(),
                        bezierArray.getDouble(3).toFloat()
                    ),
                    damping = configMap.getDouble("damping").toFloat(),
                    stiffness = configMap.getDouble("stiffness").toFloat(),
                    mass = configMap.getDouble("mass").toFloat(),
                    loop = configMap.getString("loop")!!,
                    delay = configMap.getInt("delay").toLong()
                )
            }
        }
        transitionConfigs = configs
    }

    /** Map property name to category key, then fall back to defaultConfig. */
    fun getTransitionConfig(name: String): TransitionConfig {
        val categoryKey = when (name) {
            "opacity" -> "opacity"
            "translateX", "translateY", "scaleX", "scaleY",
            "rotate", "rotateX", "rotateY" -> "transform"
            "borderRadius" -> "borderRadius"
            "backgroundColor" -> "backgroundColor"
            else -> null
        }
        if (categoryKey != null) {
            transitionConfigs[categoryKey]?.let { return it }
        }
        return transitionConfigs["defaultConfig"]!!
    }

    private fun allTransitionsNone(): Boolean {
        val defaultConfig = transitionConfigs["defaultConfig"]
        if (defaultConfig == null || defaultConfig.type != "none") return false
        val categories = listOf("transform", "opacity", "borderRadius", "backgroundColor")
        return categories.all { key ->
            val config = transitionConfigs[key]
            config == null || config.type == "none"
        }
    }

    companion object {
        // Bitmask flags — must match JS constants
        const val MASK_OPACITY = 1 shl 0
        const val MASK_TRANSLATE_X = 1 shl 1
        const val MASK_TRANSLATE_Y = 1 shl 2
        const val MASK_SCALE_X = 1 shl 3
        const val MASK_SCALE_Y = 1 shl 4
        const val MASK_ROTATE = 1 shl 5
        const val MASK_ROTATE_X = 1 shl 6
        const val MASK_ROTATE_Y = 1 shl 7
        const val MASK_BORDER_RADIUS = 1 shl 8
        const val MASK_BACKGROUND_COLOR = 1 shl 9
    }

    // --- Transform origin (0–1 fractions) ---
    var transformOriginX: Float = 0.5f
        set(value) {
            field = value
            applyTransformOrigin()
        }
    var transformOriginY: Float = 0.5f
        set(value) {
            field = value
            applyTransformOrigin()
        }

    // --- Border radius (hardware-accelerated via outline clipping) ---
    // Animated via ObjectAnimator("animateBorderRadius") — setter invalidates outline each frame.
    private var _borderRadius: Float = 0f

    @Suppress("unused") // Used by ObjectAnimator via reflection
    fun getAnimateBorderRadius(): Float = _borderRadius
    @Suppress("unused") // Used by ObjectAnimator via reflection
    fun setAnimateBorderRadius(value: Float) {
        if (_borderRadius != value) {
            _borderRadius = value
            if (value > 0f) {
                clipToOutline = true
            } else {
                clipToOutline = false
            }
            invalidateOutline()
        }
    }

    // --- Hardware layer ---
    var useHardwareLayer: Boolean = false

    // --- Event callback ---
    var onTransitionEnd: ((finished: Boolean) -> Unit)? = null
    private var activeAnimationCount: Int = 0
    private var animationBatchId: Int = 0
    private var pendingBatchAnimationCount: Int = 0
    private var anyInterrupted: Boolean = false
    private var savedLayerType: Int = View.LAYER_TYPE_NONE

    // --- Initial animate values (set by ViewManager) ---
    var initialAnimateOpacity: Float = 1.0f
    var initialAnimateTranslateX: Float = 0.0f
    var initialAnimateTranslateY: Float = 0.0f
    var initialAnimateScaleX: Float = 1.0f
    var initialAnimateScaleY: Float = 1.0f
    var initialAnimateRotate: Float = 0.0f
    var initialAnimateRotateX: Float = 0.0f
    var initialAnimateRotateY: Float = 0.0f
    var initialAnimateBorderRadius: Float = 0.0f
    var initialAnimateBackgroundColor: Int = Color.TRANSPARENT

    // --- Pending animate values (buffered per-view, applied in onAfterUpdateTransaction) ---
    var pendingOpacity: Float = 1.0f
    var pendingTranslateX: Float = 0.0f
    var pendingTranslateY: Float = 0.0f
    var pendingScaleX: Float = 1.0f
    var pendingScaleY: Float = 1.0f
    var pendingRotate: Float = 0.0f
    var pendingRotateX: Float = 0.0f
    var pendingRotateY: Float = 0.0f
    var pendingBorderRadius: Float = 0.0f
    var pendingBackgroundColor: Int = Color.TRANSPARENT

    // --- Running animations ---
    private val runningAnimators = mutableMapOf<String, Animator>()
    private val runningSpringAnimations = mutableMapOf<DynamicAnimation.ViewProperty, SpringAnimation>()
    private val pendingDelayedRunnables = mutableListOf<Runnable>()

    // --- Animated properties bitmask (set by ViewManager) ---
    var animatedProperties: Int = 0

    init {
        // Set camera distance for 3D perspective rotations (rotateX/rotateY)
        cameraDistance = resources.displayMetrics.density * 850f

        // ViewOutlineProvider reads _borderRadius dynamically — set once, invalidated on each frame.
        outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setRoundRect(0, 0, view.width, view.height, _borderRadius)
            }
        }
    }

    // --- Hardware layer management ---

    private fun onEaseAnimationStart() {
        if (activeAnimationCount == 0 && useHardwareLayer) {
            savedLayerType = layerType
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }
        activeAnimationCount++
    }

    private fun onEaseAnimationEnd() {
        activeAnimationCount--
        if (activeAnimationCount <= 0) {
            activeAnimationCount = 0
            if (useHardwareLayer && layerType == View.LAYER_TYPE_HARDWARE) {
                setLayerType(savedLayerType, null)
            }
        }
    }

    // --- Transform origin ---

    fun applyTransformOrigin() {
        if (width > 0 && height > 0) {
            pivotX = width * transformOriginX
            pivotY = height * transformOriginY
        }
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        applyTransformOrigin()
    }

    fun applyPendingAnimateValues() {
        applyAnimateValues(pendingOpacity, pendingTranslateX, pendingTranslateY, pendingScaleX, pendingScaleY, pendingRotate, pendingRotateX, pendingRotateY, pendingBorderRadius, pendingBackgroundColor)
    }

    private fun applyAnimateValues(
        opacity: Float,
        translateX: Float,
        translateY: Float,
        scaleX: Float,
        scaleY: Float,
        rotate: Float,
        rotateX: Float,
        rotateY: Float,
        borderRadius: Float,
        backgroundColor: Int
    ) {
        if (pendingBatchAnimationCount > 0) {
            onTransitionEnd?.invoke(false)
        }

        animationBatchId++
        pendingBatchAnimationCount = 0
        anyInterrupted = false

        // Bitmask: which properties are animated. Non-animated = let style handle.
        val mask = animatedProperties

        if (isFirstMount) {
            isFirstMount = false

            val hasInitialAnimation =
                (mask and MASK_OPACITY != 0 && initialAnimateOpacity != opacity) ||
                (mask and MASK_TRANSLATE_X != 0 && initialAnimateTranslateX != translateX) ||
                (mask and MASK_TRANSLATE_Y != 0 && initialAnimateTranslateY != translateY) ||
                (mask and MASK_SCALE_X != 0 && initialAnimateScaleX != scaleX) ||
                (mask and MASK_SCALE_Y != 0 && initialAnimateScaleY != scaleY) ||
                (mask and MASK_ROTATE != 0 && initialAnimateRotate != rotate) ||
                (mask and MASK_ROTATE_X != 0 && initialAnimateRotateX != rotateX) ||
                (mask and MASK_ROTATE_Y != 0 && initialAnimateRotateY != rotateY) ||
                (mask and MASK_BORDER_RADIUS != 0 && initialAnimateBorderRadius != borderRadius) ||
                (mask and MASK_BACKGROUND_COLOR != 0 && initialAnimateBackgroundColor != backgroundColor)

            if (hasInitialAnimation) {
                // Set initial values for animated properties
                if (mask and MASK_OPACITY != 0) this.alpha = initialAnimateOpacity
                if (mask and MASK_TRANSLATE_X != 0) this.translationX = initialAnimateTranslateX
                if (mask and MASK_TRANSLATE_Y != 0) this.translationY = initialAnimateTranslateY
                if (mask and MASK_SCALE_X != 0) this.scaleX = initialAnimateScaleX
                if (mask and MASK_SCALE_Y != 0) this.scaleY = initialAnimateScaleY
                if (mask and MASK_ROTATE != 0) this.rotation = initialAnimateRotate
                if (mask and MASK_ROTATE_X != 0) this.rotationX = initialAnimateRotateX
                if (mask and MASK_ROTATE_Y != 0) this.rotationY = initialAnimateRotateY
                if (mask and MASK_BORDER_RADIUS != 0) setAnimateBorderRadius(initialAnimateBorderRadius)
                if (mask and MASK_BACKGROUND_COLOR != 0) applyBackgroundColor(initialAnimateBackgroundColor)

                // Animate properties that differ from initial to target
                if (mask and MASK_OPACITY != 0 && initialAnimateOpacity != opacity) {
                    animateProperty("alpha", DynamicAnimation.ALPHA, initialAnimateOpacity, opacity, getTransitionConfig("opacity"), loop = true)
                }
                if (mask and MASK_TRANSLATE_X != 0 && initialAnimateTranslateX != translateX) {
                    animateProperty("translationX", DynamicAnimation.TRANSLATION_X, initialAnimateTranslateX, translateX, getTransitionConfig("translateX"), loop = true)
                }
                if (mask and MASK_TRANSLATE_Y != 0 && initialAnimateTranslateY != translateY) {
                    animateProperty("translationY", DynamicAnimation.TRANSLATION_Y, initialAnimateTranslateY, translateY, getTransitionConfig("translateY"), loop = true)
                }
                if (mask and MASK_SCALE_X != 0 && initialAnimateScaleX != scaleX) {
                    animateProperty("scaleX", DynamicAnimation.SCALE_X, initialAnimateScaleX, scaleX, getTransitionConfig("scaleX"), loop = true)
                }
                if (mask and MASK_SCALE_Y != 0 && initialAnimateScaleY != scaleY) {
                    animateProperty("scaleY", DynamicAnimation.SCALE_Y, initialAnimateScaleY, scaleY, getTransitionConfig("scaleY"), loop = true)
                }
                if (mask and MASK_ROTATE != 0 && initialAnimateRotate != rotate) {
                    animateProperty("rotation", DynamicAnimation.ROTATION, initialAnimateRotate, rotate, getTransitionConfig("rotate"), loop = true)
                }
                if (mask and MASK_ROTATE_X != 0 && initialAnimateRotateX != rotateX) {
                    animateProperty("rotationX", DynamicAnimation.ROTATION_X, initialAnimateRotateX, rotateX, getTransitionConfig("rotateX"), loop = true)
                }
                if (mask and MASK_ROTATE_Y != 0 && initialAnimateRotateY != rotateY) {
                    animateProperty("rotationY", DynamicAnimation.ROTATION_Y, initialAnimateRotateY, rotateY, getTransitionConfig("rotateY"), loop = true)
                }
                if (mask and MASK_BORDER_RADIUS != 0 && initialAnimateBorderRadius != borderRadius) {
                    animateProperty("animateBorderRadius", null, initialAnimateBorderRadius, borderRadius, getTransitionConfig("borderRadius"), loop = true)
                }
                if (mask and MASK_BACKGROUND_COLOR != 0 && initialAnimateBackgroundColor != backgroundColor) {
                    animateBackgroundColor(initialAnimateBackgroundColor, backgroundColor, getTransitionConfig("backgroundColor"), loop = true)
                }

                // If all per-property configs were 'none', no animations were queued.
                // Fire onTransitionEnd immediately to match the scalar 'none' contract.
                if (pendingBatchAnimationCount == 0) {
                    onTransitionEnd?.invoke(true)
                }
            } else {
                // No initial animation — set target values directly (skip non-animated)
                if (mask and MASK_OPACITY != 0) this.alpha = opacity
                if (mask and MASK_TRANSLATE_X != 0) this.translationX = translateX
                if (mask and MASK_TRANSLATE_Y != 0) this.translationY = translateY
                if (mask and MASK_SCALE_X != 0) this.scaleX = scaleX
                if (mask and MASK_SCALE_Y != 0) this.scaleY = scaleY
                if (mask and MASK_ROTATE != 0) this.rotation = rotate
                if (mask and MASK_ROTATE_X != 0) this.rotationX = rotateX
                if (mask and MASK_ROTATE_Y != 0) this.rotationY = rotateY
                if (mask and MASK_BORDER_RADIUS != 0) setAnimateBorderRadius(borderRadius)
                if (mask and MASK_BACKGROUND_COLOR != 0) applyBackgroundColor(backgroundColor)
            }
        } else if (allTransitionsNone()) {
            // No transition (scalar) — set values immediately, cancel running animations
            cancelAllAnimations()
            if (mask and MASK_OPACITY != 0) this.alpha = opacity
            if (mask and MASK_TRANSLATE_X != 0) this.translationX = translateX
            if (mask and MASK_TRANSLATE_Y != 0) this.translationY = translateY
            if (mask and MASK_SCALE_X != 0) this.scaleX = scaleX
            if (mask and MASK_SCALE_Y != 0) this.scaleY = scaleY
            if (mask and MASK_ROTATE != 0) this.rotation = rotate
            if (mask and MASK_ROTATE_X != 0) this.rotationX = rotateX
            if (mask and MASK_ROTATE_Y != 0) this.rotationY = rotateY
            if (mask and MASK_BORDER_RADIUS != 0) setAnimateBorderRadius(borderRadius)
            if (mask and MASK_BACKGROUND_COLOR != 0) applyBackgroundColor(backgroundColor)
            onTransitionEnd?.invoke(true)
        } else {
            // Subsequent updates: animate changed properties (skip non-animated)
            var anyPropertyChanged = false

            if (prevOpacity != null && mask and MASK_OPACITY != 0 && prevOpacity != opacity) {
                anyPropertyChanged = true
                val config = getTransitionConfig("opacity")
                if (config.type == "none") {
                    cancelSpringForProperty("alpha")
                    runningAnimators["alpha"]?.cancel()
                    runningAnimators.remove("alpha")
                    this.alpha = opacity
                } else {
                    val from = getCurrentValue("alpha")
                    animateProperty("alpha", DynamicAnimation.ALPHA, from, opacity, config)
                }
            }

            if (prevTranslateX != null && mask and MASK_TRANSLATE_X != 0 && prevTranslateX != translateX) {
                anyPropertyChanged = true
                val config = getTransitionConfig("translateX")
                if (config.type == "none") {
                    cancelSpringForProperty("translationX")
                    runningAnimators["translationX"]?.cancel()
                    runningAnimators.remove("translationX")
                    this.translationX = translateX
                } else {
                    val from = getCurrentValue("translationX")
                    animateProperty("translationX", DynamicAnimation.TRANSLATION_X, from, translateX, config)
                }
            }

            if (prevTranslateY != null && mask and MASK_TRANSLATE_Y != 0 && prevTranslateY != translateY) {
                anyPropertyChanged = true
                val config = getTransitionConfig("translateY")
                if (config.type == "none") {
                    cancelSpringForProperty("translationY")
                    runningAnimators["translationY"]?.cancel()
                    runningAnimators.remove("translationY")
                    this.translationY = translateY
                } else {
                    val from = getCurrentValue("translationY")
                    animateProperty("translationY", DynamicAnimation.TRANSLATION_Y, from, translateY, config)
                }
            }

            if (prevScaleX != null && mask and MASK_SCALE_X != 0 && prevScaleX != scaleX) {
                anyPropertyChanged = true
                val config = getTransitionConfig("scaleX")
                if (config.type == "none") {
                    cancelSpringForProperty("scaleX")
                    runningAnimators["scaleX"]?.cancel()
                    runningAnimators.remove("scaleX")
                    this.scaleX = scaleX
                } else {
                    val from = getCurrentValue("scaleX")
                    animateProperty("scaleX", DynamicAnimation.SCALE_X, from, scaleX, config)
                }
            }

            if (prevScaleY != null && mask and MASK_SCALE_Y != 0 && prevScaleY != scaleY) {
                anyPropertyChanged = true
                val config = getTransitionConfig("scaleY")
                if (config.type == "none") {
                    cancelSpringForProperty("scaleY")
                    runningAnimators["scaleY"]?.cancel()
                    runningAnimators.remove("scaleY")
                    this.scaleY = scaleY
                } else {
                    val from = getCurrentValue("scaleY")
                    animateProperty("scaleY", DynamicAnimation.SCALE_Y, from, scaleY, config)
                }
            }

            if (prevRotate != null && mask and MASK_ROTATE != 0 && prevRotate != rotate) {
                anyPropertyChanged = true
                val config = getTransitionConfig("rotate")
                if (config.type == "none") {
                    cancelSpringForProperty("rotation")
                    runningAnimators["rotation"]?.cancel()
                    runningAnimators.remove("rotation")
                    this.rotation = rotate
                } else {
                    val from = getCurrentValue("rotation")
                    animateProperty("rotation", DynamicAnimation.ROTATION, from, rotate, config)
                }
            }

            if (prevRotateX != null && mask and MASK_ROTATE_X != 0 && prevRotateX != rotateX) {
                anyPropertyChanged = true
                val config = getTransitionConfig("rotateX")
                if (config.type == "none") {
                    cancelSpringForProperty("rotationX")
                    runningAnimators["rotationX"]?.cancel()
                    runningAnimators.remove("rotationX")
                    this.rotationX = rotateX
                } else {
                    val from = getCurrentValue("rotationX")
                    animateProperty("rotationX", DynamicAnimation.ROTATION_X, from, rotateX, config)
                }
            }

            if (prevRotateY != null && mask and MASK_ROTATE_Y != 0 && prevRotateY != rotateY) {
                anyPropertyChanged = true
                val config = getTransitionConfig("rotateY")
                if (config.type == "none") {
                    cancelSpringForProperty("rotationY")
                    runningAnimators["rotationY"]?.cancel()
                    runningAnimators.remove("rotationY")
                    this.rotationY = rotateY
                } else {
                    val from = getCurrentValue("rotationY")
                    animateProperty("rotationY", DynamicAnimation.ROTATION_Y, from, rotateY, config)
                }
            }

            if (prevBorderRadius != null && mask and MASK_BORDER_RADIUS != 0 && prevBorderRadius != borderRadius) {
                anyPropertyChanged = true
                val config = getTransitionConfig("borderRadius")
                if (config.type == "none") {
                    runningAnimators["animateBorderRadius"]?.cancel()
                    runningAnimators.remove("animateBorderRadius")
                    setAnimateBorderRadius(borderRadius)
                } else {
                    val from = getCurrentValue("animateBorderRadius")
                    animateProperty("animateBorderRadius", null, from, borderRadius, config)
                }
            }

            if (prevBackgroundColor != null && mask and MASK_BACKGROUND_COLOR != 0 && prevBackgroundColor != backgroundColor) {
                anyPropertyChanged = true
                val config = getTransitionConfig("backgroundColor")
                if (config.type == "none") {
                    runningAnimators["backgroundColor"]?.cancel()
                    runningAnimators.remove("backgroundColor")
                    applyBackgroundColor(backgroundColor)
                } else {
                    animateBackgroundColor(getCurrentBackgroundColor(), backgroundColor, config)
                }
            }

            // If all changed properties resolved to 'none', no animations were queued.
            // Fire onTransitionEnd immediately.
            if (anyPropertyChanged && pendingBatchAnimationCount == 0) {
                onTransitionEnd?.invoke(true)
            }
        }

        prevOpacity = opacity
        prevTranslateX = translateX
        prevTranslateY = translateY
        prevScaleX = scaleX
        prevScaleY = scaleY
        prevRotate = rotate
        prevRotateX = rotateX
        prevRotateY = rotateY
        prevBorderRadius = borderRadius
        prevBackgroundColor = backgroundColor
    }

    private fun getCurrentValue(propertyName: String): Float = when (propertyName) {
        "alpha" -> this.alpha
        "translationX" -> this.translationX
        "translationY" -> this.translationY
        "scaleX" -> this.scaleX
        "scaleY" -> this.scaleY
        "rotation" -> this.rotation
        "rotationX" -> this.rotationX
        "rotationY" -> this.rotationY
        "animateBorderRadius" -> getAnimateBorderRadius()
        else -> 0f
    }

    private fun getCurrentBackgroundColor(): Int {
        return currentBackgroundColor
    }

    private fun applyBackgroundColor(color: Int) {
        currentBackgroundColor = color
        setBackgroundColor(color)
    }

    private fun animateBackgroundColor(fromColor: Int, toColor: Int, config: TransitionConfig, loop: Boolean = false) {
        runningAnimators["backgroundColor"]?.cancel()

        val batchId = animationBatchId
        pendingBatchAnimationCount++

        val animator = ValueAnimator.ofArgb(fromColor, toColor).apply {
            duration = config.duration.toLong()
            startDelay = config.delay

            interpolator = PathInterpolator(
                config.easingBezier[0], config.easingBezier[1],
                config.easingBezier[2], config.easingBezier[3]
            )
            if (loop && config.loop != "none") {
                repeatCount = ValueAnimator.INFINITE
                repeatMode = if (config.loop == "reverse") ValueAnimator.REVERSE else ValueAnimator.RESTART
            }
            addUpdateListener { animation ->
                val color = animation.animatedValue as Int
                this@EaseView.currentBackgroundColor = color
                this@EaseView.setBackgroundColor(color)
            }
            addListener(object : AnimatorListenerAdapter() {
                private var cancelled = false
                override fun onAnimationStart(animation: Animator) {
                    this@EaseView.onEaseAnimationStart()
                }
                override fun onAnimationCancel(animation: Animator) { cancelled = true }
                override fun onAnimationEnd(animation: Animator) {
                    this@EaseView.onEaseAnimationEnd()
                    if (batchId == animationBatchId) {
                        if (cancelled) anyInterrupted = true
                        pendingBatchAnimationCount--
                        if (pendingBatchAnimationCount <= 0) {
                            onTransitionEnd?.invoke(!anyInterrupted)
                        }
                    }
                }
            })
        }

        runningAnimators["backgroundColor"] = animator
        animator.start()
    }

    private fun animateProperty(
        propertyName: String,
        viewProperty: DynamicAnimation.ViewProperty?,
        fromValue: Float,
        toValue: Float,
        config: TransitionConfig,
        loop: Boolean = false
    ) {
        if (config.type == "none") {
            // Set immediately — cancel any running animation for this property
            cancelSpringForProperty(propertyName)
            runningAnimators[propertyName]?.cancel()
            runningAnimators.remove(propertyName)
            ObjectAnimator.ofFloat(this, propertyName, toValue).apply {
                duration = 0
                start()
            }
            return
        }
        if (config.type == "spring" && viewProperty != null) {
            animateSpring(viewProperty, toValue, config)
        } else {
            animateTiming(propertyName, fromValue, toValue, config, loop)
        }
    }

    private fun animateTiming(propertyName: String, fromValue: Float, toValue: Float, config: TransitionConfig, loop: Boolean = false) {
        cancelSpringForProperty(propertyName)
        runningAnimators[propertyName]?.cancel()

        val batchId = animationBatchId
        pendingBatchAnimationCount++

        val animator = ObjectAnimator.ofFloat(this, propertyName, fromValue, toValue).apply {
            duration = config.duration.toLong()
            startDelay = config.delay

            interpolator = PathInterpolator(
                config.easingBezier[0], config.easingBezier[1],
                config.easingBezier[2], config.easingBezier[3]
            )
            if (loop && config.loop != "none") {
                repeatCount = ObjectAnimator.INFINITE
                repeatMode = if (config.loop == "reverse") {
                    ObjectAnimator.REVERSE
                } else {
                    ObjectAnimator.RESTART
                }
            }
            addListener(object : AnimatorListenerAdapter() {
                private var cancelled = false
                override fun onAnimationStart(animation: Animator) {
                    this@EaseView.onEaseAnimationStart()
                }
                override fun onAnimationCancel(animation: Animator) {
                    cancelled = true
                }
                override fun onAnimationEnd(animation: Animator) {
                    this@EaseView.onEaseAnimationEnd()
                    if (batchId == animationBatchId) {
                        if (cancelled) anyInterrupted = true
                        pendingBatchAnimationCount--
                        if (pendingBatchAnimationCount <= 0) {
                            onTransitionEnd?.invoke(!anyInterrupted)
                        }
                    }
                }
            })
        }

        runningAnimators[propertyName] = animator
        animator.start()
    }

    private fun animateSpring(viewProperty: DynamicAnimation.ViewProperty, toValue: Float, config: TransitionConfig) {
        cancelTimingForViewProperty(viewProperty)

        // Cancel any existing spring so we get a fresh end listener with the current batchId.
        runningSpringAnimations[viewProperty]?.let { existing ->
            if (existing.isRunning) {
                existing.cancel()
            }
        }
        runningSpringAnimations.remove(viewProperty)

        val batchId = animationBatchId
        pendingBatchAnimationCount++

        val dampingRatio = (config.damping / (2.0f * sqrt(config.stiffness * config.mass)))
            .coerceAtLeast(0.01f)

        val spring = SpringAnimation(this, viewProperty).apply {
            spring = SpringForce(toValue).apply {
                this.dampingRatio = dampingRatio
                this.stiffness = config.stiffness
            }
            addUpdateListener { _, _, _ ->
                // First update — enable hardware layer
                if (activeAnimationCount == 0) {
                    this@EaseView.onEaseAnimationStart()
                }
            }
            addEndListener { _, canceled, _, _ ->
                this@EaseView.onEaseAnimationEnd()
                if (batchId == animationBatchId) {
                    if (canceled) anyInterrupted = true
                    pendingBatchAnimationCount--
                    if (pendingBatchAnimationCount <= 0) {
                        onTransitionEnd?.invoke(!anyInterrupted)
                    }
                }
            }
        }

        onEaseAnimationStart()
        runningSpringAnimations[viewProperty] = spring
        if (config.delay > 0) {
            val runnable = Runnable { spring.start() }
            pendingDelayedRunnables.add(runnable)
            postDelayed(runnable, config.delay)
        } else {
            spring.start()
        }
    }

    private fun cancelAllAnimations() {
        for (runnable in pendingDelayedRunnables) {
            removeCallbacks(runnable)
        }
        pendingDelayedRunnables.clear()
        for (animator in runningAnimators.values) {
            animator.cancel()
        }
        runningAnimators.clear()
        for (spring in runningSpringAnimations.values) {
            if (spring.isRunning) {
                spring.cancel()
            }
        }
        runningSpringAnimations.clear()
    }

    private fun cancelTimingForViewProperty(viewProperty: DynamicAnimation.ViewProperty) {
        val propertyName = when (viewProperty) {
            DynamicAnimation.ALPHA -> "alpha"
            DynamicAnimation.TRANSLATION_X -> "translationX"
            DynamicAnimation.TRANSLATION_Y -> "translationY"
            DynamicAnimation.SCALE_X -> "scaleX"
            DynamicAnimation.SCALE_Y -> "scaleY"
            DynamicAnimation.ROTATION -> "rotation"
            DynamicAnimation.ROTATION_X -> "rotationX"
            DynamicAnimation.ROTATION_Y -> "rotationY"
            else -> return
        }
        runningAnimators[propertyName]?.cancel()
        runningAnimators.remove(propertyName)
    }

    private fun cancelSpringForProperty(propertyName: String) {
        val viewProperty = when (propertyName) {
            "alpha" -> DynamicAnimation.ALPHA
            "translationX" -> DynamicAnimation.TRANSLATION_X
            "translationY" -> DynamicAnimation.TRANSLATION_Y
            "scaleX" -> DynamicAnimation.SCALE_X
            "scaleY" -> DynamicAnimation.SCALE_Y
            "rotation" -> DynamicAnimation.ROTATION
            "rotationX" -> DynamicAnimation.ROTATION_X
            "rotationY" -> DynamicAnimation.ROTATION_Y
            else -> return
        }
        runningSpringAnimations[viewProperty]?.let { spring ->
            if (spring.isRunning) {
                spring.cancel()
            }
        }
        runningSpringAnimations.remove(viewProperty)
    }

    fun cleanup() {
        for (runnable in pendingDelayedRunnables) {
            removeCallbacks(runnable)
        }
        pendingDelayedRunnables.clear()
        for (animator in runningAnimators.values) {
            animator.cancel()
        }
        runningAnimators.clear()

        for (spring in runningSpringAnimations.values) {
            if (spring.isRunning) {
                spring.cancel()
            }
        }
        runningSpringAnimations.clear()

        if (activeAnimationCount > 0 && layerType == View.LAYER_TYPE_HARDWARE) {
            setLayerType(savedLayerType, null)
        }
        activeAnimationCount = 0

        prevOpacity = null
        prevTranslateX = null
        prevTranslateY = null
        prevScaleX = null
        prevScaleY = null
        prevRotate = null
        prevRotateX = null
        prevRotateY = null
        prevBorderRadius = null
        prevBackgroundColor = null

        this.alpha = 1f
        this.translationX = 0f
        this.translationY = 0f
        this.scaleX = 1f
        this.scaleY = 1f
        this.rotation = 0f
        this.rotationX = 0f
        this.rotationY = 0f
        setAnimateBorderRadius(0f)
        applyBackgroundColor(Color.TRANSPARENT)

        isFirstMount = true
        transitionConfigs = emptyMap()
    }
}
