package com.ease

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = EaseViewManager.NAME)
class EaseViewManager : ReactViewManager() {

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): EaseView =
        EaseView(context)

    // --- Animate value setters ---

    @ReactProp(name = "animateOpacity", defaultFloat = 1f)
    fun setAnimateOpacity(view: EaseView, value: Float) {
        view.pendingOpacity = value
    }

    @ReactProp(name = "animateTranslateX", defaultFloat = 0f)
    fun setAnimateTranslateX(view: EaseView, value: Float) {
        view.pendingTranslateX = value
    }

    @ReactProp(name = "animateTranslateY", defaultFloat = 0f)
    fun setAnimateTranslateY(view: EaseView, value: Float) {
        view.pendingTranslateY = value
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
        view.initialAnimateTranslateX = value
    }

    @ReactProp(name = "initialAnimateTranslateY", defaultFloat = 0f)
    fun setInitialAnimateTranslateY(view: EaseView, value: Float) {
        view.initialAnimateTranslateY = value
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

    // --- Lifecycle ---

    override fun onAfterUpdateTransaction(view: ReactViewGroup) {
        super.onAfterUpdateTransaction(view)
        (view as? EaseView)?.applyPendingAnimateValues()
    }

    override fun onDropViewInstance(view: ReactViewGroup) {
        super.onDropViewInstance(view)
        (view as? EaseView)?.cleanup()
    }

    companion object {
        const val NAME = "EaseView"
    }
}
