# Agent Instructions for react-native-ease

## Overview

`react-native-ease` is a React Native library that provides declarative, native-powered animations via a single `EaseView` component. It uses Core Animation (iOS) and ObjectAnimator/SpringAnimation (Android) — no JS animation loop, no worklets, no C++ runtime.

**Fabric (new architecture) only.** Does not support the old architecture.

## Project Structure

```
src/                          # TypeScript source (library)
  EaseView.tsx                # React component — flattens props to native
  EaseViewNativeComponent.ts  # Codegen spec — defines native props/events
  types.ts                    # Public TypeScript types
  index.tsx                   # Public exports
  __tests__/                  # Jest tests

ios/
  EaseView.h                  # Native view header (ObjC++)
  EaseView.mm                 # Native view implementation (Core Animation)

android/src/main/java/com/ease/
  EaseView.kt                 # Native view (ObjectAnimator/SpringAnimation)
  EaseViewManager.kt          # ViewManager with @ReactProp setters
  EasePackage.kt              # Package registration

example/                      # Demo app (separate workspace)
  src/App.tsx                 # Main demo screen with animation examples
  src/ComparisonScreen.tsx    # Comparison with Reanimated
  src/components/             # Shared demo components (Section, Button, TabBar)
```

## Architecture

The JS component (`EaseView.tsx`) takes structured props (`animate`, `transition`, etc.) and flattens them into individual native props defined in the codegen spec (`EaseViewNativeComponent.ts`). When those flat props change on the native side, the native view diffs previous vs new values and creates platform-native animations.

**Prop flattening example:**
```
animate={{ opacity: 0.5, scale: 1.2 }}  →  animateOpacity=0.5, animateScale=1.2
transition={{ type: 'spring', damping: 10 }}  →  transitionType="spring", transitionDamping=10
```

**Key design pattern:** All animation logic lives on the native side. The JS layer is purely a prop resolver — no animation state, no timers, no refs.

## Adding a New Animatable Property

1. Add to `AnimateProps` in `src/types.ts`
2. Add `animate<Prop>` and `initialAnimate<Prop>` codegen props in `src/EaseViewNativeComponent.ts`
3. Add default to `IDENTITY` in `src/EaseView.tsx` and pass the flat props to `NativeEaseView`
4. **iOS:** Handle the new property in `updateProps:` — diff old/new, read presentation value, create animation
5. **Android:** Add `pending<Prop>` field, `@ReactProp` setter in `EaseViewManager.kt`, and handle in `applyAnimateValues()`
6. **Recycle:** Reset the new property to its identity value in `prepareForRecycle` (iOS) and `cleanup()` (Android). Fabric recycles views — any property not reset will leak stale values to the next user of the view.
7. Add tests and update README
8. Add an example/demo in the example app (`example/src/App.tsx` or a new screen)

## Development Commands

```sh
yarn                          # Install dependencies
yarn test                     # Jest tests (JS layer)
yarn lint                     # ESLint + TypeScript check
yarn format:check             # Prettier + clang-format check
yarn format:write             # Auto-fix formatting
yarn prepare                  # Build JS module (bob build)
yarn example start            # Start Metro for example app
yarn example ios              # Build and run example on iOS
yarn example android          # Build and run example on Android
```

## Pre-commit Checklist

Before committing, always run:

```sh
yarn format:write && yarn lint && yarn test
```

**Important:** Run `yarn format:write` (not `format:check`) first to auto-fix formatting before linting. This avoids redundant Prettier errors in lint output.

Lefthook pre-commit hooks enforce ESLint and TypeScript checks. Fix all failures before committing.

**Formatting tools:**
- **Prettier** for TypeScript/JavaScript files
- **clang-format** for Objective-C++, Kotlin, and C++ files

## Codegen

React Native Codegen generates the native component interface from `src/EaseViewNativeComponent.ts`. The generated spec name is `EaseViewSpec`.

After changing the codegen spec, you need to rebuild the example app for the native side to pick up changes. On iOS, `pod install` in `example/ios/` may also be needed.

## Testing

- Unit tests are in `src/__tests__/` and test JS prop resolution and native prop passing
- Uses `@testing-library/react-native` with a mocked native component
- **No native integration tests** — test native behavior by running the example app on a device/simulator
- Example app has demos for all features; use it to verify changes visually

## Commit Style

Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, etc.

## Key Gotchas

- **Style/animate conflict:** `style` can contain any `ViewStyle` property. If a property appears in both `style` and `animate`, the animated value wins and the style value is stripped. A dev warning is logged. Properties like `opacity` in `style` work fine when not in `animate` — the bitmask tells native which properties are animated vs style-managed.
- **View recycling:** Fabric recycles native views. `prepareForRecycle` (iOS) and `cleanup()` (Android) must reset ALL mutable view properties (opacity, translation, scale, rotation) to identity. Missing a reset causes stale values to leak across hot reloads or view reuse.
- **translateX/translateY are in DIPs (density-independent pixels) on the JS side.** Android `EaseViewManager` converts to pixels via `PixelUtil.toPixelFromDIP()`. iOS codegen handles this automatically.
- **iOS uses `CALayer` key-path animations** (`transform.scale.x`, `transform.translation.x`, etc.), not the `transform` property directly. This means `anchorPoint` controls the pivot for scale/rotation.
- **iOS `anchorPoint` changes shift visual position.** The `updateLayoutMetrics:oldLayoutMetrics:` override compensates for this — don't change it without understanding the position math.
- **Spring damping ratio on Android is derived** from `damping`, `stiffness`, and `mass` using: `dampingRatio = damping / (2 * sqrt(stiffness * mass))`. iOS passes these values directly to `CASpringAnimation`.
- **Animation batching:** Both platforms track animation batches with a generation ID. When new animations start, any pending old-batch callbacks are fired as interrupted (`finished: false`).
- **Loop only works with timing animations**, not springs. Loop requires `initialAnimate` to define the start value.

## Android UI Automation (agent-device)

The example app has looping animations (Pulse, Banner) that prevent Android's `uiautomator` from reaching idle state, which breaks `agent-device snapshot` and `find` commands.

### Workaround
Before using `agent-device snapshot -i` or `find` on Android, either:

1. **Stop looping animations in the app** — tap the Stop button on Pulse and Banner demos, OR
2. **Disable system animations** (less ideal — also affects recording):
   ```bash
   adb shell settings put global window_animation_scale 0
   adb shell settings put global transition_animation_scale 0
   adb shell settings put global animator_duration_scale 0
   # Re-enable after: set all back to 1
   ```

### iOS
No workaround needed — `agent-device` uses XCTest accessibility on iOS which doesn't require idle state.

### Android validation flow
```bash
# 1. Open app
agent-device open ease.example --platform android --device "SM G996W"

# 2. Stop looping demos (tap Stop buttons) or disable system animations

# 3. Now snapshot works
agent-device snapshot -i

# 4. Navigate and interact by ref
agent-device press @e9  # e.g. Replay button

# 5. Screenshot/record
agent-device screenshot /tmp/screenshot.png
```
