import { Text, type ColorValue, type TextProps } from 'react-native';
import { EaseView } from './EaseView';
import { useColorTransition } from './useColorTransition';
import type {
  AnimateProps,
  TextAnimateProps,
  Transition,
  TransitionEndEvent,
  TransformOrigin,
  TransformPerspective,
} from './types';

export type EaseTextProps = TextProps & {
  /** Target values for animated properties (transforms, opacity). Animated natively via EaseView. */
  animate?: TextAnimateProps;
  /** Starting values for enter animations. Animates to `animate` on mount. */
  initialAnimate?: TextAnimateProps;
  /** Animation configuration (timing or spring). */
  transition?: Transition;
  /** Called when all animations complete. Reports whether they finished naturally or were interrupted. */
  onTransitionEnd?: (event: TransitionEndEvent) => void;
  /**
   * Enable Android hardware layer during animations.
   * @default false
   */
  useHardwareLayer?: boolean;
  /** Pivot point for scale and rotation as 0–1 fractions. @default { x: 0.5, y: 0.5 } (center) */
  transformOrigin?: TransformOrigin;
  /**
   * Distance of the camera from the z=0 plane for 3D transforms (rotateX, rotateY).
   * @default 1280
   */
  transformPerspective?: TransformPerspective;
  /**
   * Smoothly interpolates the text color using JS (requestAnimationFrame).
   * Follows the `color` key in `transition`, or falls back to `default`.
   * For instant color changes with zero JS cost, use `style.color` instead.
   */
  interpolateColor?: ColorValue;
  /**
   * Initial color for mount animation. Interpolates from this color to `interpolateColor` on mount.
   * Only used when `interpolateColor` is also set.
   */
  initialInterpolateColor?: ColorValue;
};

export function EaseText({
  animate,
  initialAnimate,
  transition,
  onTransitionEnd,
  useHardwareLayer,
  transformOrigin,
  transformPerspective,
  interpolateColor,
  initialInterpolateColor,
  style,
  children,
  ...textProps
}: EaseTextProps) {
  // Interpolate color with requestAnimationFrame, respecting transition config
  const interpolatedColor = useColorTransition(
    interpolateColor,
    transition,
    initialInterpolateColor,
  );

  // Merge interpolated color into text style (overrides style.color if set)
  const textStyle =
    interpolatedColor != null ? [style, { color: interpolatedColor }] : style;

  return (
    <EaseView
      animate={animate as AnimateProps | undefined}
      initialAnimate={initialAnimate as AnimateProps | undefined}
      transition={transition}
      onTransitionEnd={onTransitionEnd}
      useHardwareLayer={useHardwareLayer}
      transformOrigin={transformOrigin}
      transformPerspective={transformPerspective}
    >
      <Text style={textStyle} {...textProps}>
        {children}
      </Text>
    </EaseView>
  );
}
