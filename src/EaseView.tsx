import { StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import NativeEaseView from './EaseViewNativeComponent';
import type {
  AnimateProps,
  CubicBezier,
  SingleTransition,
  Transition,
  TransitionEndEvent,
  TransformOrigin,
} from './types';

/** Identity values used as defaults for animate/initialAnimate. */
const IDENTITY = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  borderRadius: 0,
};

/** Bitmask flags — must match native constants. */
/* eslint-disable no-bitwise */
const MASK_OPACITY = 1 << 0;
const MASK_TRANSLATE_X = 1 << 1;
const MASK_TRANSLATE_Y = 1 << 2;
const MASK_SCALE_X = 1 << 3;
const MASK_SCALE_Y = 1 << 4;
const MASK_ROTATE = 1 << 5;
const MASK_ROTATE_X = 1 << 6;
const MASK_ROTATE_Y = 1 << 7;
const MASK_BORDER_RADIUS = 1 << 8;
const MASK_BACKGROUND_COLOR = 1 << 9;
/* eslint-enable no-bitwise */

/** Maps animate prop keys to style keys that conflict. */
const ANIMATE_TO_STYLE_KEYS: Record<keyof AnimateProps, string> = {
  opacity: 'opacity',
  translateX: 'transform',
  translateY: 'transform',
  scale: 'transform',
  scaleX: 'transform',
  scaleY: 'transform',
  rotate: 'transform',
  rotateX: 'transform',
  rotateY: 'transform',
  borderRadius: 'borderRadius',
  backgroundColor: 'backgroundColor',
};

/** Preset easing curves as cubic bezier control points. */
const EASING_PRESETS: Record<string, CubicBezier> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

/** Property index order for per-property arrays. */
const PROPERTY_KEYS: (keyof AnimateProps)[] = [
  'opacity',
  'translateX',
  'translateY',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
  'borderRadius',
  'backgroundColor',
];

const PROPERTY_COUNT = PROPERTY_KEYS.length;

/** Returns true if the transition is a SingleTransition (has a `type` field). */
function isSingleTransition(t: Transition): t is SingleTransition {
  return 'type' in t;
}

/** Library defaults: spring for transforms (indices 1-7), timing 300ms easeInOut for others. */
const TIMING_DEFAULT: SingleTransition = {
  type: 'timing',
  duration: 300,
  easing: 'easeInOut',
};
const SPRING_DEFAULT: SingleTransition = {
  type: 'spring',
  damping: 15,
  stiffness: 120,
  mass: 1,
};

function getLibraryDefault(index: number): SingleTransition {
  // Indices 1-7 are transforms → spring default
  // Indices 0,8,9 are opacity, borderRadius, backgroundColor → timing default
  return index >= 1 && index <= 7 ? SPRING_DEFAULT : TIMING_DEFAULT;
}

/** Resolve a SingleTransition into flat scalar values. */
function resolveSingleConfig(config: SingleTransition) {
  const type = config.type as 'timing' | 'spring' | 'none';
  const duration = config.type === 'timing' ? config.duration ?? 300 : 300;
  const rawEasing =
    config.type === 'timing' ? config.easing ?? 'easeInOut' : 'easeInOut';
  const bezier: CubicBezier = Array.isArray(rawEasing)
    ? rawEasing
    : EASING_PRESETS[rawEasing]!;
  const damping = config.type === 'spring' ? config.damping ?? 15 : 15;
  const stiffness = config.type === 'spring' ? config.stiffness ?? 120 : 120;
  const mass = config.type === 'spring' ? config.mass ?? 1 : 1;
  const loop: 'none' | 'repeat' | 'reverse' =
    config.type === 'timing' ? config.loop ?? 'none' : 'none';
  return { type, duration, bezier, damping, stiffness, mass, loop };
}

interface PerPropertyArrays {
  types: string[];
  durations: number[];
  dampings: number[];
  stiffnesses: number[];
  masses: number[];
  loops: string[];
  easingBeziers: number[];
}

function resolvePerPropertyTransitions(
  transitionMap: Exclude<Transition, SingleTransition>,
): {
  scalars: ReturnType<typeof resolveSingleConfig>;
  arrays: PerPropertyArrays;
} {
  const arrays: PerPropertyArrays = {
    types: [],
    durations: [],
    dampings: [],
    stiffnesses: [],
    masses: [],
    loops: [],
    easingBeziers: [],
  };

  const defaultConfig = transitionMap.default;

  for (let i = 0; i < PROPERTY_COUNT; i++) {
    const key = PROPERTY_KEYS[i]!;
    // Resolution order: specific key → scale shorthand (for scaleX/scaleY) → default → library default
    let config: SingleTransition;
    if (transitionMap[key] != null) {
      config = transitionMap[key]!;
    } else if (
      (key === 'scaleX' || key === 'scaleY') &&
      transitionMap.scale != null
    ) {
      config = transitionMap.scale!;
    } else if (defaultConfig != null) {
      config = defaultConfig;
    } else {
      config = getLibraryDefault(i);
    }

    const resolved = resolveSingleConfig(config);
    arrays.types.push(resolved.type);
    arrays.durations.push(resolved.duration);
    arrays.dampings.push(resolved.damping);
    arrays.stiffnesses.push(resolved.stiffness);
    arrays.masses.push(resolved.mass);
    arrays.loops.push(resolved.loop);
    arrays.easingBeziers.push(...resolved.bezier);
  }

  // Scalar props = default key values (or library defaults for opacity category)
  const scalarConfig = defaultConfig ?? TIMING_DEFAULT;
  const scalars = resolveSingleConfig(scalarConfig);

  return { scalars, arrays };
}

export type EaseViewProps = ViewProps & {
  /** Target values for animated properties. */
  animate?: AnimateProps;
  /** Starting values for enter animations. Animates to `animate` on mount. */
  initialAnimate?: AnimateProps;
  /** Animation configuration (timing or spring). */
  transition?: Transition;
  /** Called when all animations complete. Reports whether they finished naturally or were interrupted. */
  onTransitionEnd?: (event: TransitionEndEvent) => void;
  /**
   * Enable Android hardware layer during animations. The view is rasterized to
   * a GPU texture so animated property changes (opacity, scale, rotation) are
   * composited on the RenderThread without redrawing the view hierarchy.
   *
   * **Trade-offs:**
   * - Faster rendering of opacity/scale/rotation animations.
   * - Uses additional GPU memory for the off-screen texture.
   * - Children that overflow the view's layout bounds are clipped by the
   *   texture, which can cause visual artifacts with `translateX`/`translateY`.
   *
   * Best suited for views that animate opacity, scale, or rotation without
   * overflowing children. No-op on iOS where Core Animation already composites
   * off the main thread.
   * @default false
   */
  useHardwareLayer?: boolean;
  /** Pivot point for scale and rotation as 0–1 fractions. @default { x: 0.5, y: 0.5 } (center) */
  transformOrigin?: TransformOrigin;
};

export function EaseView({
  animate,
  initialAnimate,
  transition,
  onTransitionEnd,
  useHardwareLayer = false,
  transformOrigin,
  style,
  ...rest
}: EaseViewProps) {
  // Compute bitmask of which properties are animated.
  // Native uses this to skip non-animated properties (lets style handle them).
  /* eslint-disable no-bitwise */
  let animatedProperties = 0;
  if (animate?.opacity != null) animatedProperties |= MASK_OPACITY;
  if (animate?.translateX != null) animatedProperties |= MASK_TRANSLATE_X;
  if (animate?.translateY != null) animatedProperties |= MASK_TRANSLATE_Y;
  if (animate?.scaleX != null || animate?.scale != null)
    animatedProperties |= MASK_SCALE_X;
  if (animate?.scaleY != null || animate?.scale != null)
    animatedProperties |= MASK_SCALE_Y;
  if (animate?.rotate != null) animatedProperties |= MASK_ROTATE;
  if (animate?.rotateX != null) animatedProperties |= MASK_ROTATE_X;
  if (animate?.rotateY != null) animatedProperties |= MASK_ROTATE_Y;
  if (animate?.borderRadius != null) animatedProperties |= MASK_BORDER_RADIUS;
  if (animate?.backgroundColor != null)
    animatedProperties |= MASK_BACKGROUND_COLOR;
  /* eslint-enable no-bitwise */

  // Resolve animate values (identity defaults for non-animated — safe values).
  const resolved = {
    ...IDENTITY,
    ...animate,
    scaleX: animate?.scaleX ?? animate?.scale ?? IDENTITY.scaleX,
    scaleY: animate?.scaleY ?? animate?.scale ?? IDENTITY.scaleY,
    rotateX: animate?.rotateX ?? IDENTITY.rotateX,
    rotateY: animate?.rotateY ?? IDENTITY.rotateY,
  };

  // Resolve initialAnimate:
  // - No initialAnimate: same as resolved (no enter animation)
  // - With initialAnimate: use initial values for animated properties,
  //   falling back to identity defaults.
  const initial = initialAnimate ?? animate;
  const resolvedInitial = {
    ...IDENTITY,
    ...initial,
    scaleX: initial?.scaleX ?? initial?.scale ?? IDENTITY.scaleX,
    scaleY: initial?.scaleY ?? initial?.scale ?? IDENTITY.scaleY,
    rotateX: initial?.rotateX ?? IDENTITY.rotateX,
    rotateY: initial?.rotateY ?? IDENTITY.rotateY,
  };

  // Resolve backgroundColor — passed as ColorValue directly (codegen handles conversion)
  const animBgColor = animate?.backgroundColor ?? 'transparent';
  const initialBgColor = initialAnimate?.backgroundColor ?? animBgColor;

  // Strip style keys that conflict with animated properties
  let cleanStyle: ViewProps['style'] = style;
  if (animate && style) {
    const flat = StyleSheet.flatten(style) as Record<string, unknown>;
    if (flat) {
      const conflicting = new Set<string>();
      for (const key of Object.keys(animate) as (keyof AnimateProps)[]) {
        if (animate[key] != null) {
          const styleKey = ANIMATE_TO_STYLE_KEYS[key];
          if (styleKey && styleKey in flat) {
            conflicting.add(styleKey);
          }
        }
      }
      if (conflicting.size > 0) {
        if (__DEV__) {
          console.warn(
            `react-native-ease: ${[...conflicting].join(
              ', ',
            )} found in both style and animate. ` +
              'The animated value takes priority; the style value will be ignored.',
          );
        }
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(flat)) {
          if (!conflicting.has(k)) {
            cleaned[k] = v;
          }
        }
        cleanStyle = cleaned as ViewStyle;
      }
    }
  }

  // Resolve transition config — single config or per-property map
  const isMap = transition != null && !isSingleTransition(transition);
  const singleTransition = transition == null || isMap ? undefined : transition;

  // Single config resolution (used when single transition or as scalars for map)
  let transitionType: 'timing' | 'spring' | 'none';
  let transitionDuration: number;
  let bezier: CubicBezier;
  let transitionDamping: number;
  let transitionStiffness: number;
  let transitionMass: number;
  let transitionLoop: 'none' | 'repeat' | 'reverse';
  let perPropertyArrays: PerPropertyArrays | undefined;

  if (isMap) {
    const { scalars, arrays } = resolvePerPropertyTransitions(transition);
    transitionType = scalars.type;
    transitionDuration = scalars.duration;
    bezier = scalars.bezier;
    transitionDamping = scalars.damping;
    transitionStiffness = scalars.stiffness;
    transitionMass = scalars.mass;
    transitionLoop = scalars.loop;
    perPropertyArrays = arrays;
  } else {
    transitionType = singleTransition?.type ?? 'timing';
    transitionDuration =
      singleTransition?.type === 'timing'
        ? singleTransition.duration ?? 300
        : 300;
    const rawEasing =
      singleTransition?.type === 'timing'
        ? singleTransition.easing ?? 'easeInOut'
        : 'easeInOut';
    if (__DEV__) {
      if (Array.isArray(rawEasing)) {
        if ((rawEasing as number[]).length !== 4) {
          console.warn(
            'react-native-ease: Custom easing must be a [x1, y1, x2, y2] tuple (got length ' +
              (rawEasing as number[]).length +
              ').',
          );
        }
        if (
          rawEasing[0] < 0 ||
          rawEasing[0] > 1 ||
          rawEasing[2] < 0 ||
          rawEasing[2] > 1
        ) {
          console.warn(
            'react-native-ease: Easing x-values (x1, x2) must be between 0 and 1.',
          );
        }
      }
    }
    bezier = Array.isArray(rawEasing) ? rawEasing : EASING_PRESETS[rawEasing]!;
    transitionDamping =
      singleTransition?.type === 'spring' ? singleTransition.damping ?? 15 : 15;
    transitionStiffness =
      singleTransition?.type === 'spring'
        ? singleTransition.stiffness ?? 120
        : 120;
    transitionMass =
      singleTransition?.type === 'spring' ? singleTransition.mass ?? 1 : 1;
    transitionLoop =
      singleTransition?.type === 'timing'
        ? singleTransition.loop ?? 'none'
        : 'none';
  }
  const bezier: CubicBezier = Array.isArray(rawEasing)
    ? rawEasing
    : EASING_PRESETS[rawEasing]!;
  const transitionDamping =
    transition?.type === 'spring' ? transition.damping ?? 15 : 15;
  const transitionStiffness =
    transition?.type === 'spring' ? transition.stiffness ?? 120 : 120;
  const transitionMass =
    transition?.type === 'spring' ? transition.mass ?? 1 : 1;
  const transitionLoop =
    transition?.type === 'timing' ? transition.loop ?? 'none' : 'none';
  const transitionDelay =
    transition?.type === 'timing' || transition?.type === 'spring'
      ? transition.delay ?? 0
      : 0;


  const handleTransitionEnd = onTransitionEnd
    ? (event: { nativeEvent: { finished: boolean } }) =>
        onTransitionEnd(event.nativeEvent)
    : undefined;

  return (
    <NativeEaseView
      style={cleanStyle}
      onTransitionEnd={handleTransitionEnd}
      animatedProperties={animatedProperties}
      animateOpacity={resolved.opacity}
      animateTranslateX={resolved.translateX}
      animateTranslateY={resolved.translateY}
      animateScaleX={resolved.scaleX}
      animateScaleY={resolved.scaleY}
      animateRotate={resolved.rotate}
      animateRotateX={resolved.rotateX}
      animateRotateY={resolved.rotateY}
      animateBorderRadius={resolved.borderRadius}
      animateBackgroundColor={animBgColor}
      initialAnimateOpacity={resolvedInitial.opacity}
      initialAnimateTranslateX={resolvedInitial.translateX}
      initialAnimateTranslateY={resolvedInitial.translateY}
      initialAnimateScaleX={resolvedInitial.scaleX}
      initialAnimateScaleY={resolvedInitial.scaleY}
      initialAnimateRotate={resolvedInitial.rotate}
      initialAnimateRotateX={resolvedInitial.rotateX}
      initialAnimateRotateY={resolvedInitial.rotateY}
      initialAnimateBorderRadius={resolvedInitial.borderRadius}
      initialAnimateBackgroundColor={initialBgColor}
      transitionType={transitionType}
      transitionDuration={transitionDuration}
      transitionEasingBezier={bezier}
      transitionDamping={transitionDamping}
      transitionStiffness={transitionStiffness}
      transitionMass={transitionMass}
      transitionLoop={transitionLoop}
      transitionDelay={transitionDelay}
      perPropertyTransitionTypes={perPropertyArrays?.types}
      perPropertyTransitionDurations={perPropertyArrays?.durations}
      perPropertyTransitionDampings={perPropertyArrays?.dampings}
      perPropertyTransitionStiffnesses={perPropertyArrays?.stiffnesses}
      perPropertyTransitionMasses={perPropertyArrays?.masses}
      perPropertyTransitionLoops={perPropertyArrays?.loops}
      perPropertyTransitionEasingBeziers={perPropertyArrays?.easingBeziers}

      useHardwareLayer={useHardwareLayer}
      transformOriginX={transformOrigin?.x ?? 0.5}
      transformOriginY={transformOrigin?.y ?? 0.5}
      {...rest}
    />
  );
}
