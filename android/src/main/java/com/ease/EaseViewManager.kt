package com.ease

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.views.view.ReactViewManager
import com.facebook.react.viewmanagers.EaseViewManagerDelegate
import com.facebook.react.viewmanagers.EaseViewManagerInterface

@ReactModule(name = EaseViewManager.NAME)
class EaseViewManager :
    ReactViewManager(),
    EaseViewManagerInterface<EaseView> {

    private val delegate = EaseViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<EaseView> = delegate

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): EaseView =
        EaseView(context)

    // --- Animate value setters (buffered on the view instance) ---

    override fun setAnimateOpacity(view: EaseView, value: Float) {
        view.pendingOpacity = value
    }

    override fun setAnimateTranslateX(view: EaseView, value: Float) {
        view.pendingTranslateX = value
    }

    override fun setAnimateTranslateY(view: EaseView, value: Float) {
        view.pendingTranslateY = value
    }

    override fun setAnimateScale(view: EaseView, value: Float) {
        view.pendingScale = value
    }

    override fun setAnimateRotate(view: EaseView, value: Float) {
        view.pendingRotate = value
    }

    // --- Initial animate value setters ---

    override fun setInitialAnimateOpacity(view: EaseView, value: Float) {
        view.initialAnimateOpacity = value
    }

    override fun setInitialAnimateTranslateX(view: EaseView, value: Float) {
        view.initialAnimateTranslateX = value
    }

    override fun setInitialAnimateTranslateY(view: EaseView, value: Float) {
        view.initialAnimateTranslateY = value
    }

    override fun setInitialAnimateScale(view: EaseView, value: Float) {
        view.initialAnimateScale = value
    }

    override fun setInitialAnimateRotate(view: EaseView, value: Float) {
        view.initialAnimateRotate = value
    }

    // --- Transition config setters ---

    override fun setTransitionType(view: EaseView, value: String?) {
        view.transitionType = value ?: "timing"
    }

    override fun setTransitionDuration(view: EaseView, value: Int) {
        view.transitionDuration = value
    }

    override fun setTransitionEasing(view: EaseView, value: String?) {
        view.transitionEasing = value ?: "easeInOut"
    }

    override fun setTransitionDamping(view: EaseView, value: Float) {
        view.transitionDamping = value
    }

    override fun setTransitionStiffness(view: EaseView, value: Float) {
        view.transitionStiffness = value
    }

    override fun setTransitionMass(view: EaseView, value: Float) {
        view.transitionMass = value
    }

    // --- Lifecycle ---

    override fun onAfterUpdateTransaction(view: EaseView) {
        super.onAfterUpdateTransaction(view)
        view.applyPendingAnimateValues()
    }

    override fun onDropViewInstance(view: EaseView) {
        super.onDropViewInstance(view)
        view.cleanup()
    }

    companion object {
        const val NAME = "EaseView"
    }
}
