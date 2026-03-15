import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import type {
  AnimateProps,
  CubicBezier,
  Transition,
  TransitionEndEvent,
  TransformOrigin,
} from './types';

/** Identity values used as defaults for animate/initialAnimate. */
const IDENTITY: Required<Omit<AnimateProps, 'scale' | 'backgroundColor'>> = {
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

/** Preset easing curves as cubic bezier control points. */
const EASING_PRESETS: Record<string, CubicBezier> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

export type EaseViewProps = {
  animate?: AnimateProps;
  initialAnimate?: AnimateProps;
  transition?: Transition;
  onTransitionEnd?: (event: TransitionEndEvent) => void;
  /** No-op on web. */
  useHardwareLayer?: boolean;
  transformOrigin?: TransformOrigin;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

function resolveAnimateValues(props: AnimateProps | undefined): Required<
  Omit<AnimateProps, 'scale' | 'backgroundColor'>
> & {
  backgroundColor?: string;
} {
  return {
    ...IDENTITY,
    ...props,
    scaleX: props?.scaleX ?? props?.scale ?? IDENTITY.scaleX,
    scaleY: props?.scaleY ?? props?.scale ?? IDENTITY.scaleY,
    rotateX: props?.rotateX ?? IDENTITY.rotateX,
    rotateY: props?.rotateY ?? IDENTITY.rotateY,
    backgroundColor: props?.backgroundColor as string | undefined,
  };
}

function buildTransform(vals: ReturnType<typeof resolveAnimateValues>): string {
  const parts: string[] = [];
  if (vals.translateX !== 0 || vals.translateY !== 0) {
    parts.push(`translate(${vals.translateX}px, ${vals.translateY}px)`);
  }
  if (vals.scaleX !== 1 || vals.scaleY !== 1) {
    parts.push(
      vals.scaleX === vals.scaleY
        ? `scale(${vals.scaleX})`
        : `scale(${vals.scaleX}, ${vals.scaleY})`,
    );
  }
  if (vals.rotate !== 0) {
    parts.push(`rotate(${vals.rotate}deg)`);
  }
  if (vals.rotateX !== 0) {
    parts.push(`rotateX(${vals.rotateX}deg)`);
  }
  if (vals.rotateY !== 0) {
    parts.push(`rotateY(${vals.rotateY}deg)`);
  }
  return parts.length > 0 ? parts.join(' ') : 'none';
}

function resolveEasing(transition: Transition | undefined): string {
  if (!transition || transition.type !== 'timing') {
    return 'cubic-bezier(0.42, 0, 0.58, 1)';
  }
  const easing = transition.easing ?? 'easeInOut';
  const bezier: CubicBezier = Array.isArray(easing)
    ? easing
    : EASING_PRESETS[easing]!;
  return `cubic-bezier(${bezier[0]}, ${bezier[1]}, ${bezier[2]}, ${bezier[3]})`;
}

function resolveDuration(transition: Transition | undefined): number {
  if (!transition) return 300;
  if (transition.type === 'timing') return transition.duration ?? 300;
  if (transition.type === 'none') return 0;
  const damping = transition.damping ?? 15;
  const mass = transition.mass ?? 1;
  const tau = (2 * mass) / damping;
  return Math.round(tau * 4 * 1000);
}

/** CSS transition properties that we animate. */
const TRANSITION_PROPS = [
  'opacity',
  'transform',
  'border-radius',
  'background-color',
];

/** Counter for unique keyframe names. */
let keyframeCounter = 0;

export function EaseView({
  animate,
  initialAnimate,
  transition,
  onTransitionEnd,
  useHardwareLayer: _useHardwareLayer,
  transformOrigin,
  style,
  children,
}: EaseViewProps) {
  const resolved = resolveAnimateValues(animate);
  const hasInitial = initialAnimate != null;
  const [mounted, setMounted] = useState(!hasInitial);
  // On web, View ref gives us the underlying DOM element.
  const viewRef = useRef<React.ComponentRef<typeof View>>(null);
  const animationNameRef = useRef<string | null>(null);

  const getElement = useCallback(
    () => viewRef.current as unknown as HTMLElement | null,
    [],
  );

  // For initialAnimate: render initial values first, then animate on mount.
  useEffect(() => {
    if (hasInitial) {
      getElement()?.getBoundingClientRect();
      setMounted(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayValues =
    !mounted && hasInitial ? resolveAnimateValues(initialAnimate) : resolved;

  const duration = resolveDuration(transition);
  const easing = resolveEasing(transition);

  const originX = ((transformOrigin?.x ?? 0.5) * 100).toFixed(1);
  const originY = ((transformOrigin?.y ?? 0.5) * 100).toFixed(1);

  const transitionType = transition?.type ?? 'timing';
  const loopMode = transition?.type === 'timing' ? transition.loop : undefined;

  const transitionCss =
    transitionType === 'none' || (!mounted && hasInitial)
      ? 'none'
      : TRANSITION_PROPS.map((prop) => `${prop} ${duration}ms ${easing}`).join(
          ', ',
        );

  // Apply CSS transition/animation properties imperatively (not in RN style spec).
  useEffect(() => {
    const el = getElement();
    if (!el) return;

    if (!loopMode) {
      const springTransition =
        transitionType === 'spring'
          ? TRANSITION_PROPS.map(
              (prop) =>
                `${prop} ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
            ).join(', ')
          : null;
      el.style.transition = springTransition ?? transitionCss;
    }
    el.style.transformOrigin = `${originX}% ${originY}%`;
  });

  // Handle transitionend event via DOM listener.
  useEffect(() => {
    const el = getElement();
    if (!el || !onTransitionEnd) return;

    const handler = (e: TransitionEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform')
        return;
      onTransitionEnd({ finished: true });
    };

    el.addEventListener('transitionend', handler);
    return () => el.removeEventListener('transitionend', handler);
  }, [onTransitionEnd, getElement]);

  // Handle loop animations via CSS @keyframes.
  useEffect(() => {
    const el = getElement();
    if (!loopMode || !el) {
      if (animationNameRef.current) {
        const cleanEl = getElement();
        if (cleanEl) cleanEl.style.animation = '';
        animationNameRef.current = null;
      }
      return;
    }

    const fromValues = initialAnimate
      ? resolveAnimateValues(initialAnimate)
      : resolveAnimateValues(undefined);
    const toValues = resolveAnimateValues(animate);

    const fromTransform = buildTransform(fromValues);
    const toTransform = buildTransform(toValues);

    const name = `ease-loop-${++keyframeCounter}`;
    animationNameRef.current = name;

    // Only include border-radius/background-color in keyframes when explicitly
    // set by the user, to avoid overriding values from the style prop.
    const hasBorderRadius =
      initialAnimate?.borderRadius != null || animate?.borderRadius != null;
    const hasBgColor =
      initialAnimate?.backgroundColor != null ||
      animate?.backgroundColor != null;

    const fromBlock = [
      `opacity: ${fromValues.opacity}`,
      `transform: ${fromTransform}`,
      hasBorderRadius ? `border-radius: ${fromValues.borderRadius}px` : '',
      hasBgColor && fromValues.backgroundColor
        ? `background-color: ${fromValues.backgroundColor}`
        : '',
    ]
      .filter(Boolean)
      .join('; ');

    const toBlock = [
      `opacity: ${toValues.opacity}`,
      `transform: ${toTransform}`,
      hasBorderRadius ? `border-radius: ${toValues.borderRadius}px` : '',
      hasBgColor && toValues.backgroundColor
        ? `background-color: ${toValues.backgroundColor}`
        : '',
    ]
      .filter(Boolean)
      .join('; ');

    const keyframes = `@keyframes ${name} { from { ${fromBlock} } to { ${toBlock} } }`;

    const styleEl = document.createElement('style');
    styleEl.textContent = keyframes;
    document.head.appendChild(styleEl);

    const direction = loopMode === 'reverse' ? 'alternate' : 'normal';
    el.style.transition = 'none';
    el.style.animation = `${name} ${duration}ms ${easing} infinite ${direction}`;

    return () => {
      styleEl.remove();
      el.style.animation = '';
      animationNameRef.current = null;
    };
  }, [loopMode, animate, initialAnimate, duration, easing, getElement]);

  // Build animated style using RN transform array format.
  // react-native-web converts these to CSS transform strings.
  const animatedStyle: ViewStyle = {
    opacity: displayValues.opacity,
    transform: [
      { translateX: displayValues.translateX },
      { translateY: displayValues.translateY },
      { scaleX: displayValues.scaleX },
      { scaleY: displayValues.scaleY },
      { rotate: `${displayValues.rotate}deg` },
      { rotateX: `${displayValues.rotateX}deg` },
      { rotateY: `${displayValues.rotateY}deg` },
    ],
    ...(displayValues.borderRadius > 0
      ? { borderRadius: displayValues.borderRadius }
      : {}),
    ...(displayValues.backgroundColor
      ? { backgroundColor: displayValues.backgroundColor }
      : {}),
  };

  return (
    <View ref={viewRef} style={[style, animatedStyle]}>
      {children}
    </View>
  );
}
