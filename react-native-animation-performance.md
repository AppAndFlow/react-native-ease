---
slug: react-native-animation-performance
title: React Native Animation Performance — How Different Libraries Compare
authors: [appandflow]
tags: [react-native, performance, animation, benchmarks]
---

At [App & Flow](https://appandflow.com), we build React Native apps and tools for product teams that need fluid, native-feeling UIs. One thing that stuck with us: a slowly translating background image that would occasionally stutter. The culprit is that Reanimated still runs on the UI thread every frame — so if your app does any significant work during that frame (layout, re-renders, other updates), the animation budget shrinks and the background stutters.

Core Animation, by contrast, hands animations off to the OS render server and never touches your thread again. So we built [react-native-ease](https://github.com/AppAndFlow/react-native-ease) — a declarative animation library that drives everything through platform APIs (Core Animation on iOS, ObjectAnimator on Android) with no JS loop, no worklets, and no shadow tree commits per frame. But that raised a question we needed to answer honestly: **how much does the choice of animation library actually matter?**

So we measured it. Across four approaches, two platforms, release builds, and both high-end and mid-range devices, we tracked per-frame UI thread overhead. This post shares what we found, and tries to answer the questions that actually matter: how large is the frame penalty? In what kinds of apps does it matter? And what should you prioritize when choosing an animation library?

<!-- truncate -->

## The Approaches

We compared four animation approaches:

- **Ease** — react-native-ease, using platform APIs directly. Animations are fully described on the JS side via props, then driven natively without any per-frame JS involvement.
- **Reanimated (Shared Values)** — the standard worklet-based approach. Animation values are driven on the UI thread via a C++ worklet runtime, but each frame still updates props through the shadow tree.
- **Reanimated (CSS Animations)** — Reanimated's newer CSS animation API. Declarative like Ease, but still backed by Reanimated's animation engine.
- **RN Animated** — React Native's built-in `Animated` API with `useNativeDriver: true`. Animation values are driven on the native side, but the implementation depends on the platform.

We also tested Reanimated with its static feature flags enabled — specifically `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` and `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS`, which allow Reanimated to skip the shadow tree commit when only non-layout props (like `transform` and `opacity`) are updated. This is a meaningful optimization worth calling out separately.

> **Note:** RN 0.85 introduced a new Shared Animation Backend that will eventually make the feature flags unnecessary by handling shadow tree bypass at a lower level. Reanimated's integration is in progress but not yet released, so it isn't included here. See [What's Coming](#whats-coming-rn-085s-new-animation-backend).

## How We Measured

We built a benchmark screen into the example app that animates N views simultaneously in a loop (translateX, 2s, linear, repeating). We used a custom Expo native module to measure per-frame overhead:

- **iOS:** We swizzle `CADisplayLink`'s factory method to intercept all display link callbacks registered by any framework. We measure wall-clock time spent in each callback, aggregated per frame by timestamp.
- **Android:** We use `Window.OnFrameMetricsAvailableListener`, which reports `ANIMATION_DURATION`, `LAYOUT_MEASURE_DURATION`, and `DRAW_DURATION` from the platform's frame metrics system.

We ran 5-second collection windows in release builds. All benchmarks reported here are from release builds — debug adds significant overhead from Hermes parsing JS instead of precompiled AOT bytecode, and the shadow tree running extra validation. A Reanimated animation that takes 3ms per frame in release can easily take 10ms+ in debug.

## The Results

### Android (UI thread time per frame: anim + layout + draw, ms)

| Views | Approach | Avg | P95 | P99 |
|-------|----------|-----|-----|-----|
| 10 | Ease | 0.21 | 0.33 | 0.48 |
| 10 | Reanimated SV | 1.15 | 1.70 | 1.94 |
| 10 | Reanimated SV (FF) | 0.75 | 1.53 | 2.26 |
| 10 | Reanimated CSS | 0.99 | 1.44 | 1.62 |
| 10 | Reanimated CSS (FF) | 0.45 | 0.80 | 1.35 |
| 10 | RN Animated | 0.36 | 0.62 | 0.98 |
| 100 | Ease | 0.36 | 0.56 | 0.71 |
| 100 | Reanimated SV | 2.71 | 3.09 | 3.20 |
| 100 | Reanimated SV (FF) | 1.81 | 2.29 | 2.63 |
| 100 | Reanimated CSS | 2.19 | 2.67 | 2.97 |
| 100 | Reanimated CSS (FF) | 1.01 | 1.91 | 2.25 |
| 100 | RN Animated | 0.71 | 1.08 | 1.36 |
| 500 | Ease | 0.60 | 0.75 | 0.87 |
| 500 | Reanimated SV | 8.31 | 9.26 | 9.59 |
| 500 | Reanimated SV (FF) | 5.37 | 6.36 | 6.89 |
| 500 | Reanimated CSS | 5.50 | 6.34 | 6.88 |
| 500 | Reanimated CSS (FF) | 2.37 | 2.86 | 3.22 |
| 500 | RN Animated | 1.60 | 1.88 | 3.84 |

### iOS (Display link callback time per frame, ms)

| Views | Approach | Avg | P95 | P99 |
|-------|----------|-----|-----|-----|
| 10 | Ease | 0.01 | 0.02 | 0.03 |
| 10 | Reanimated SV | 1.33 | 1.67 | 1.90 |
| 10 | Reanimated SV (FF) | 1.08 | 1.59 | 1.68 |
| 10 | Reanimated CSS | 1.06 | 1.34 | 1.50 |
| 10 | Reanimated CSS (FF) | 0.63 | 1.01 | 1.08 |
| 10 | RN Animated | 0.83 | 1.18 | 1.31 |
| 100 | Ease | 0.01 | 0.01 | 0.02 |
| 100 | Reanimated SV | 3.72 | 5.21 | 5.68 |
| 100 | Reanimated SV (FF) | 3.33 | 4.50 | 4.75 |
| 100 | Reanimated CSS | 2.71 | 3.83 | 4.91 |
| 100 | Reanimated CSS (FF) | 2.48 | 3.39 | 3.79 |
| 100 | RN Animated | 3.32 | 4.28 | 4.55 |
| 500 | Ease | 0.01 | 0.01 | 0.02 |
| 500 | Reanimated SV | 6.84 | 7.69 | 8.10 |
| 500 | Reanimated SV (FF) | 6.54 | 7.32 | 7.45 |
| 500 | Reanimated CSS | 4.16 | 4.59 | 4.71 |
| 500 | Reanimated CSS (FF) | 3.70 | 4.22 | 4.33 |
| 500 | RN Animated | 4.91 | 5.66 | 5.89 |

## Why the Differences Exist

### The shadow tree tax

Every frame, Reanimated's worklet computes new values and applies them by committing a prop update through the shadow tree. That commit traverses the shadow tree — Yoga layout, prop diffing, view mutations. When you animate `transform` or `opacity` (properties that don't affect layout), this work is entirely wasted.

Reanimated's feature flags (`ANDROID/IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS`) bypass this by updating visual props directly on the UI layer without a shadow tree commit. On Android with 100 views, enabling these flags cuts Reanimated SV overhead from 2.71ms to 1.81ms — about 33% improvement. CSS animations with FF drops from 2.19ms to 1.01ms, more than halving it. The gains are consistent across all view counts.

### Why Ease shows near-zero on iOS

Ease registers a `CAAnimation` on each view's layer and walks away. Core Animation runs in a dedicated render server process that Apple runs separately from your app process entirely — it's not even on your main thread. That's why Ease measures ~0.01ms on iOS: there is genuinely almost no main-thread work per frame.

On Android, ObjectAnimator runs on the UI thread, but the overhead is minimal because there's no shadow tree involvement and no worklet runtime — just direct property updates.

### RN Animated

`RN Animated` with `useNativeDriver: true` also avoids the JS thread per frame, but it still goes through a different native animation pipeline that carries some overhead. It performs surprisingly well at low-to-mid view counts on Android, but starts to lag at higher counts.

## What Does This Mean in Practice?

At 10 views, all approaches are comfortably within one frame budget (16.67ms at 60 fps). The differences — fractions of a millisecond — are real but not meaningful on their own.

At 100 views, Reanimated is spending 2–4ms per frame on animation overhead alone, leaving less headroom for the rest of your frame work (layout, rendering, your custom code). On a mid-range device that's already close to budget, this starts to matter.

At 500 views, Reanimated SV without feature flags approaches the entire frame budget on both platforms. This is an extreme scenario, but it illustrates that the overhead is not constant — it scales linearly with the number of animated views.

**The practical answer:** it matters most when animations are long-running or slow — like skeleton loaders, background parallax, or ambient UI effects — where a single dropped frame is immediately noticeable and other app work (data fetching, rendering, user interaction) is likely happening at the same time. It also matters for anything in a list, where you can easily have hundreds of animated items simultaneously. And on very low-end devices, where even small per-frame overhead can push a frame over budget, the choice of library becomes the difference between smooth and janky. For short one-shot transitions — a button press feedback, a toast appearing, a modal sliding in — the overhead is negligible and any library works fine.

It's also worth noting that Ease only covers this specific use case. Gesture-driven animations (scroll-linked, drag, swipe) and animations that affect layout properties (width, height, padding) still require Reanimated or RN Animated. Ease is purpose-built for declarative, trigger-based animations on visual properties.

## What's Coming: RN 0.85's New Animation Backend

React Native 0.85 (released April 7, 2025) ships an experimental "Shared Animation Backend" — a unified animation engine built directly into the renderer. Notably, this was a joint project: Software Mansion engineers (the Reanimated team) co-authored much of the RN core implementation alongside Meta, and the feature is explicitly designed to power both Animated and Reanimated going forward.

The Reanimated integration is [already in progress](https://github.com/software-mansion/react-native-reanimated/pull/8875) — Software Mansion co-built the RN side and has an open PR to adopt it. Once shipped, Reanimated won't need workarounds like `SYNCHRONOUSLY_UPDATE_UI_PROPS` — shadow tree bypass will be built in by default. Expect its performance to land closer to what we measured with all feature flags enabled, or RN Animated. This matters because the feature flags aren't always safe to enable today — they can cause visual bugs depending on your app, so many projects leave them off.

That said, the architectural difference remains. Ease has no per-frame animation engine at all — the platform drives everything outside the JS layer entirely. Even with a faster backend, Reanimated still computes values and applies prop updates every frame via its worklet runtime. That overhead doesn't disappear, it just gets more efficient. We'll re-run benchmarks once the Reanimated integration ships.

## Reproduce It Yourself

The benchmark is built into the example app. Clone the repo, run `yarn example ios` or `yarn example android`, and tap **Benchmark** from the demo screen. The source is in `example/src/demos/BenchmarkDemo.tsx` and the native measurement module is in `example/modules/frame-metrics/`.

Run release builds (`yarn example ios --configuration Release` / `yarn example android --variant release`) for comparable numbers.
