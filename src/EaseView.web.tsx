/// <reference lib="dom" />
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>;

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
  // Spring type: approximate duration from damping/stiffness/mass.
  // A critically-damped spring settles in ~4-5 time constants.
  // tau = 2 * mass / damping, settle ~ 4 * tau
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
  ...rest
}: EaseViewProps) {
  const resolved = resolveAnimateValues(animate);
  const hasInitial = initialAnimate != null;
  const [mounted, setMounted] = useState(!hasInitial);
  const divRef = useRef<HTMLDivElement>(null);
  const animationNameRef = useRef<string | null>(null);

  // For initialAnimate: render initial values first, then animate on mount.
  useEffect(() => {
    if (hasInitial) {
      // Force a layout read to flush initial styles before enabling transitions.
      divRef.current?.getBoundingClientRect();
      setMounted(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle transitionend event.
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      // Only fire for our own transitions, not children bubbling up.
      if (e.target !== e.currentTarget) return;
      // Fire once per batch — use opacity as the sentinel property.
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform')
        return;
      onTransitionEnd?.({ finished: true });
    },
    [onTransitionEnd],
  );

  // Determine which values to render.
  const displayValues =
    !mounted && hasInitial ? resolveAnimateValues(initialAnimate) : resolved;

  const duration = resolveDuration(transition);
  const easing = resolveEasing(transition);

  // Build computed styles.
  const transformStr = buildTransform(displayValues);
  const originX = ((transformOrigin?.x ?? 0.5) * 100).toFixed(1);
  const originY = ((transformOrigin?.y ?? 0.5) * 100).toFixed(1);

  const transitionType = transition?.type ?? 'timing';
  const loopMode = transition?.type === 'timing' ? transition.loop : undefined;

  // Build CSS transition string.
  const transitionCss =
    transitionType === 'none' || (!mounted && hasInitial)
      ? 'none'
      : TRANSITION_PROPS.map((prop) => `${prop} ${duration}ms ${easing}`).join(
          ', ',
        );

  // Handle loop animations via CSS @keyframes.
  useEffect(() => {
    const el = divRef.current;
    if (!loopMode || !el) {
      // Clean up any existing animation.
      if (animationNameRef.current && el) {
        el.style.animation = '';
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

    const fromBlock = [
      `opacity: ${fromValues.opacity}`,
      `transform: ${fromTransform}`,
      `border-radius: ${fromValues.borderRadius}px`,
      fromValues.backgroundColor
        ? `background-color: ${fromValues.backgroundColor}`
        : '',
    ]
      .filter(Boolean)
      .join('; ');

    const toBlock = [
      `opacity: ${toValues.opacity}`,
      `transform: ${toTransform}`,
      `border-radius: ${toValues.borderRadius}px`,
      toValues.backgroundColor
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
    el.style.animation = `${name} ${duration}ms ${easing} infinite ${direction}`;

    return () => {
      styleEl.remove();
      el.style.animation = '';
      animationNameRef.current = null;
    };
  }, [loopMode, animate, initialAnimate, duration, easing]);

  const computedStyle: React.CSSProperties = {
    ...style,
    opacity: displayValues.opacity,
    transform: transformStr,
    transformOrigin: `${originX}% ${originY}%`,
    borderRadius:
      displayValues.borderRadius > 0
        ? displayValues.borderRadius
        : style?.borderRadius,
    backgroundColor: displayValues.backgroundColor ?? style?.backgroundColor,
    transition: loopMode ? 'none' : transitionCss,
    // Spring approximation: use the same CSS transition with estimated duration.
    // CSS does not natively support spring physics, so this is a best-effort
    // timing approximation using an ease-out curve for a spring-like feel.
    ...(transitionType === 'spring' && !loopMode
      ? {
          transition: TRANSITION_PROPS.map(
            (prop) =>
              `${prop} ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
          ).join(', '),
        }
      : {}),
    willChange: 'transform, opacity',
  };

  return (
    <div
      ref={divRef}
      style={computedStyle}
      onTransitionEnd={onTransitionEnd ? handleTransitionEnd : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
