package com.ease

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.MapBuilder
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
        view.onTransitionEnd = { property, finished ->
            val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
            val surfaceId = UIManagerHelper.getSurfaceId(context)
            eventDispatcher?.dispatchEvent(
                TransitionEndEvent(surfaceId, view.id, property, finished)
            )
        }
        return view
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

    @ReactProp(name = "animateScale", defaultFloat = 1f)
    fun setAnimateScale(view: EaseView, value: Float) {
        view.pendingScale = value
    }

    @ReactProp(name = "animateRotate", defaultFloat = 0f)
    fun setAnimateRotate(view: EaseView, value: Float) {
        view.pendingRotate = value
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

    @ReactProp(name = "initialAnimateScale", defaultFloat = 1f)
    fun setInitialAnimateScale(view: EaseView, value: Float) {
        view.initialAnimateScale = value
    }

    @ReactProp(name = "initialAnimateRotate", defaultFloat = 0f)
    fun setInitialAnimateRotate(view: EaseView, value: Float) {
        view.initialAnimateRotate = value
    }

    // --- Transition config setters ---

    @ReactProp(name = "transitionType")
    fun setTransitionType(view: EaseView, value: String?) {
        view.transitionType = value ?: "timing"
    }

    @ReactProp(name = "transitionDuration", defaultInt = 300)
    fun setTransitionDuration(view: EaseView, value: Int) {
        view.transitionDuration = value
    }

    @ReactProp(name = "transitionEasing")
    fun setTransitionEasing(view: EaseView, value: String?) {
        view.transitionEasing = value ?: "easeInOut"
    }

    @ReactProp(name = "transitionDamping", defaultFloat = 15f)
    fun setTransitionDamping(view: EaseView, value: Float) {
        view.transitionDamping = value
    }

    @ReactProp(name = "transitionStiffness", defaultFloat = 120f)
    fun setTransitionStiffness(view: EaseView, value: Float) {
        view.transitionStiffness = value
    }

    @ReactProp(name = "transitionMass", defaultFloat = 1f)
    fun setTransitionMass(view: EaseView, value: Float) {
        view.transitionMass = value
    }

    @ReactProp(name = "transitionLoop")
    fun setTransitionLoop(view: EaseView, value: String?) {
        view.transitionLoop = value ?: "none"
    }

    // --- Hardware layer ---

    @ReactProp(name = "useHardwareLayer", defaultBoolean = true)
    fun setUseHardwareLayer(view: EaseView, value: Boolean) {
        view.useHardwareLayer = value
    }

    // --- Prevent BaseViewManager from resetting animated properties ---

    override fun setTransformProperty(
        view: ReactViewGroup,
        transforms: ReadableArray?,
        transformOrigin: ReadableArray?
    ) {
        // No-op: we manage translationX/Y, scaleX/Y, rotation ourselves via animations.
    }

    override fun setOpacity(view: ReactViewGroup, opacity: Float) {
        // No-op: we manage opacity ourselves via animations.
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
        return MapBuilder.builder<String, Any>()
            .put("onTransitionEnd", MapBuilder.of("registrationName", "onTransitionEnd"))
            .build()
    }

    private class TransitionEndEvent(
        surfaceId: Int,
        viewId: Int,
        private val property: String,
        private val finished: Boolean
    ) : Event<TransitionEndEvent>(surfaceId, viewId) {
        override fun getEventName() = "onTransitionEnd"
        override fun getEventData(): WritableMap = Arguments.createMap().apply {
            putString("property", property)
            putBoolean("finished", finished)
        }
    }

    companion object {
        const val NAME = "EaseView"
    }
}
