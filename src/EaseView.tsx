import { StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import NativeEaseView from './EaseViewNativeComponent';
import type { AnimateProps, Transition } from './types';

export type EaseViewStyle = Omit<ViewStyle, 'opacity' | 'transform'>;

const IDENTITY: Required<AnimateProps> = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotate: 0,
};

export type EaseViewProps = Omit<ViewProps, 'style'> & {
  /** Target values for animated properties. */
  animate?: AnimateProps;
  /** Starting values for enter animations. Animates to `animate` on mount. */
  initialAnimate?: AnimateProps;
  /** Animation configuration (timing or spring). */
  transition?: Transition;
  /**
   * Use a hardware layer during animations on Android for smoother rendering.
   * The view is rasterized to a GPU texture while animating so property changes
   * are composited on the RenderThread. No-op on iOS where Core Animation
   * already runs off the main thread.
   * @default true
   */
  useHardwareLayer?: boolean;
  /** Non-animated styles (layout, colors, borders, etc.). `opacity` and `transform` are excluded — use `animate` instead. */
  style?: EaseViewStyle | EaseViewStyle[];
};

export function EaseView({
  animate,
  initialAnimate,
  transition,
  useHardwareLayer = true,
  style,
  ...rest
}: EaseViewProps) {
  const resolved = { ...IDENTITY, ...animate };
  const resolvedInitial = { ...IDENTITY, ...(initialAnimate ?? animate) };

  // Strip animated properties from style at runtime as a safety net
  let cleanStyle = style;
  if (__DEV__ && style) {
    const flat = StyleSheet.flatten(style as ViewStyle) as Record<
      string,
      unknown
    >;
    if (flat && ('opacity' in flat || 'transform' in flat)) {
      console.warn(
        'react-native-ease: Set opacity/transforms in the animate prop, not style. ' +
          'Animated properties in style will be ignored.',
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { opacity: _o, transform: _t, ...remaining } = flat;
      cleanStyle = remaining as EaseViewStyle;
    }
  }

  // Resolve transition config
  const transitionType = transition?.type ?? 'timing';
  const transitionDuration =
    transition?.type === 'timing' ? transition.duration ?? 300 : 300;
  const transitionEasing =
    transition?.type === 'timing'
      ? transition.easing ?? 'easeInOut'
      : 'easeInOut';
  const transitionDamping =
    transition?.type === 'spring' ? transition.damping ?? 15 : 15;
  const transitionStiffness =
    transition?.type === 'spring' ? transition.stiffness ?? 120 : 120;
  const transitionMass =
    transition?.type === 'spring' ? transition.mass ?? 1 : 1;
  const transitionLoop =
    transition?.type === 'timing' ? transition.loop ?? 'none' : 'none';

  return (
    <NativeEaseView
      style={cleanStyle}
      animateOpacity={resolved.opacity}
      animateTranslateX={resolved.translateX}
      animateTranslateY={resolved.translateY}
      animateScale={resolved.scale}
      animateRotate={resolved.rotate}
      initialAnimateOpacity={resolvedInitial.opacity}
      initialAnimateTranslateX={resolvedInitial.translateX}
      initialAnimateTranslateY={resolvedInitial.translateY}
      initialAnimateScale={resolvedInitial.scale}
      initialAnimateRotate={resolvedInitial.rotate}
      transitionType={transitionType}
      transitionDuration={transitionDuration}
      transitionEasing={transitionEasing}
      transitionDamping={transitionDamping}
      transitionStiffness={transitionStiffness}
      transitionMass={transitionMass}
      transitionLoop={transitionLoop}
      useHardwareLayer={useHardwareLayer}
      {...rest}
    />
  );
}
