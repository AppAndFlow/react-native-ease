package com.ease

import android.graphics.Color
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.Event
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = EaseViewManager.NAME)
class EaseViewManager : ReactViewManager() {

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): EaseView {
        val view = EaseView(context)
        view.onTransitionEnd = { finished ->
            val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
            val surfaceId = UIManagerHelper.getSurfaceId(context)
            eventDispatcher?.dispatchEvent(
                TransitionEndEvent(surfaceId, view.id, finished)
            )
        }
        return view
    }

    // --- Animated properties bitmask ---

    @ReactProp(name = "animatedProperties", defaultInt = 0)
    fun setAnimatedProperties(view: EaseView, value: Int) {
        view.animatedProperties = value
    }

    // --- Animate value setters ---

    @ReactProp(name = "animateOpacity", defaultFloat = 1f)
    fun setAnimateOpacity(view: EaseView, value: Float) {
        view.pendingOpacity = value
    }

    @ReactProp(name = "animateTranslateX", defaultFloat = 0f)
    fun setAnimateTranslateX(view: EaseView, value: Float) {
        view.pendingTranslateX = PixelUtil.toPixelFromDIP(value)
    }

    @ReactProp(name = "animateTranslateY", defaultFloat = 0f)
    fun setAnimateTranslateY(view: EaseView, value: Float) {
        view.pendingTranslateY = PixelUtil.toPixelFromDIP(value)
    }

    @ReactProp(name = "animateScaleX", defaultFloat = 1f)
    fun setAnimateScaleX(view: EaseView, value: Float) {
        view.pendingScaleX = value
    }

    @ReactProp(name = "animateScaleY", defaultFloat = 1f)
    fun setAnimateScaleY(view: EaseView, value: Float) {
        view.pendingScaleY = value
    }

    @ReactProp(name = "animateRotate", defaultFloat = 0f)
    fun setAnimateRotate(view: EaseView, value: Float) {
        view.pendingRotate = value
    }

    @ReactProp(name = "animateRotateX", defaultFloat = 0f)
    fun setAnimateRotateX(view: EaseView, value: Float) {
        view.pendingRotateX = value
    }

    @ReactProp(name = "animateRotateY", defaultFloat = 0f)
    fun setAnimateRotateY(view: EaseView, value: Float) {
        view.pendingRotateY = value
    }

    // --- Initial animate value setters ---

    @ReactProp(name = "initialAnimateOpacity", defaultFloat = 1f)
    fun setInitialAnimateOpacity(view: EaseView, value: Float) {
        view.initialAnimateOpacity = value
    }

    @ReactProp(name = "initialAnimateTranslateX", defaultFloat = 0f)
    fun setInitialAnimateTranslateX(view: EaseView, value: Float) {
        view.initialAnimateTranslateX = PixelUtil.toPixelFromDIP(value)
    }

    @ReactProp(name = "initialAnimateTranslateY", defaultFloat = 0f)
    fun setInitialAnimateTranslateY(view: EaseView, value: Float) {
        view.initialAnimateTranslateY = PixelUtil.toPixelFromDIP(value)
    }

    @ReactProp(name = "initialAnimateScaleX", defaultFloat = 1f)
    fun setInitialAnimateScaleX(view: EaseView, value: Float) {
        view.initialAnimateScaleX = value
    }

    @ReactProp(name = "initialAnimateScaleY", defaultFloat = 1f)
    fun setInitialAnimateScaleY(view: EaseView, value: Float) {
        view.initialAnimateScaleY = value
    }

    @ReactProp(name = "initialAnimateRotate", defaultFloat = 0f)
    fun setInitialAnimateRotate(view: EaseView, value: Float) {
        view.initialAnimateRotate = value
    }

    @ReactProp(name = "initialAnimateRotateX", defaultFloat = 0f)
    fun setInitialAnimateRotateX(view: EaseView, value: Float) {
        view.initialAnimateRotateX = value
    }

    @ReactProp(name = "initialAnimateRotateY", defaultFloat = 0f)
    fun setInitialAnimateRotateY(view: EaseView, value: Float) {
        view.initialAnimateRotateY = value
    }

    @ReactProp(name = "initialAnimateBorderRadius", defaultFloat = 0f)
    fun setInitialAnimateBorderRadius(view: EaseView, value: Float) {
        view.initialAnimateBorderRadius = PixelUtil.toPixelFromDIP(value)
    }

    // --- Transitions config (single ReadableMap) ---

    @ReactProp(name = "transitions")
    fun setTransitions(view: EaseView, value: ReadableMap?) {
        view.setTransitionsFromMap(value)
    }

    // --- Border radius ---

    @ReactProp(name = "animateBorderRadius", defaultFloat = 0f)
    fun setAnimateBorderRadius(view: EaseView, value: Float) {
        view.pendingBorderRadius = PixelUtil.toPixelFromDIP(value)
    }

    // --- Background color ---

    @ReactProp(name = "animateBackgroundColor", customType = "Color")
    fun setAnimateBackgroundColor(view: EaseView, value: Int?) {
        view.pendingBackgroundColor = value ?: Color.TRANSPARENT
    }

    @ReactProp(name = "initialAnimateBackgroundColor", customType = "Color")
    fun setInitialAnimateBackgroundColor(view: EaseView, value: Int?) {
        view.initialAnimateBackgroundColor = value ?: Color.TRANSPARENT
    }

    // --- Hardware layer ---

    @ReactProp(name = "useHardwareLayer", defaultBoolean = false)
    fun setUseHardwareLayer(view: EaseView, value: Boolean) {
        view.useHardwareLayer = value
    }

    // --- Transform origin ---

    @ReactProp(name = "transformOriginX", defaultFloat = 0.5f)
    fun setTransformOriginX(view: EaseView, value: Float) {
        view.transformOriginX = value
    }

    @ReactProp(name = "transformOriginY", defaultFloat = 0.5f)
    fun setTransformOriginY(view: EaseView, value: Float) {
        view.transformOriginY = value
    }

    // --- Lifecycle ---

    override fun onAfterUpdateTransaction(view: ReactViewGroup) {
        super.onAfterUpdateTransaction(view)
        (view as? EaseView)?.applyPendingAnimateValues()
    }

    override fun onDropViewInstance(view: ReactViewGroup) {
        super.onDropViewInstance(view)
        (view as? EaseView)?.cleanup()
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
        return mapOf(
            "onTransitionEnd" to mapOf("registrationName" to "onTransitionEnd")
        )
    }

    private class TransitionEndEvent(
        surfaceId: Int,
        viewId: Int,
        private val finished: Boolean
    ) : Event<TransitionEndEvent>(surfaceId, viewId) {
        override fun getEventName() = "onTransitionEnd"
        override fun getEventData(): WritableMap = Arguments.createMap().apply {
            putBoolean("finished", finished)
        }
    }

    companion object {
        const val NAME = "EaseView"
    }
}
