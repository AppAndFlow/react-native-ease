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
  animate?: AnimateProps;
  initialAnimate?: AnimateProps;
  transition?: Transition;
  style?: EaseViewStyle | EaseViewStyle[];
};

export function EaseView({
  animate,
  initialAnimate,
  transition,
  style,
  ...rest
}: EaseViewProps) {
  const resolved = { ...IDENTITY, ...animate };
  const resolvedInitial = { ...IDENTITY, ...(initialAnimate ?? animate) };

  // Strip animated properties from style at runtime as a safety net
  let cleanStyle = style;
  if (__DEV__ && style) {
    const flat = StyleSheet.flatten(style as ViewStyle) as Record<string, unknown>;
    if (flat && ('opacity' in flat || 'transform' in flat)) {
      console.warn(
        'react-native-ease: Set opacity/transforms in the animate prop, not style. ' +
          'Animated properties in style will be ignored.'
      );
      const { opacity: _o, transform: _t, ...remaining } = flat;
      cleanStyle = remaining as EaseViewStyle;
    }
  }

  // Resolve transition config
  const transitionType = transition?.type ?? 'timing';
  const transitionDuration =
    transition?.type === 'timing' ? (transition.duration ?? 300) : 300;
  const transitionEasing =
    transition?.type === 'timing'
      ? (transition.easing ?? 'easeInOut')
      : 'easeInOut';
  const transitionDamping =
    transition?.type === 'spring' ? (transition.damping ?? 15) : 15;
  const transitionStiffness =
    transition?.type === 'spring' ? (transition.stiffness ?? 120) : 120;
  const transitionMass =
    transition?.type === 'spring' ? (transition.mass ?? 1) : 1;

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
      {...rest}
    />
  );
}
