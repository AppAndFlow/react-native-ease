import type { ColorValue } from 'react-native';

/** Cubic bezier control points: [x1, y1, x2, y2]. */
export type CubicBezier = [number, number, number, number];

/** Easing curve for timing animations. */
export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | CubicBezier;

/** Timing-based transition with fixed duration and easing curve. */
export type TimingTransition = {
  type: 'timing';
  /** Duration in milliseconds. @default 300 */
  duration?: number;
  /** Easing curve. @default 'easeInOut' */
  easing?: EasingType;
  /** Loop mode — 'repeat' restarts from the beginning, 'reverse' alternates direction. */
  loop?: 'repeat' | 'reverse';
  /** Delay in milliseconds before the animation starts. @default 0 */
  delay?: number;
};

/** Physics-based spring transition. */
export type SpringTransition = {
  type: 'spring';
  /** Friction — higher values reduce oscillation. @default 15 */
  damping?: number;
  /** Spring constant — higher values mean faster animation. @default 120 */
  stiffness?: number;
  /** Mass of the object — higher values mean slower, more momentum. @default 1 */
  mass?: number;
  /** Delay in milliseconds before the animation starts. @default 0 */
  delay?: number;
};

/** No transition — values are applied immediately without animation. */
export type NoneTransition = {
  type: 'none';
};

/** Animation transition configuration. */
export type Transition = TimingTransition | SpringTransition | NoneTransition;

/** Event fired when the animation ends. */
export type TransitionEndEvent = {
  /** True if the animation completed naturally, false if interrupted. */
  finished: boolean;
};

/** Transform origin as 0–1 fractions. Default is center (0.5, 0.5). */
export type TransformOrigin = {
  /** Horizontal origin. 0 = left, 0.5 = center, 1 = right. @default 0.5 */
  x?: number;
  /** Vertical origin. 0 = top, 0.5 = center, 1 = bottom. @default 0.5 */
  y?: number;
};

/** Animatable view properties. Unspecified properties default to their identity values. */
export type AnimateProps = {
  /** View opacity (0–1). @default 1 */
  opacity?: number;
  /** Horizontal translation in pixels. @default 0 */
  translateX?: number;
  /** Vertical translation in pixels. @default 0 */
  translateY?: number;
  /** Uniform scale factor (shorthand for scaleX + scaleY). @default 1 */
  scale?: number;
  /** Horizontal scale factor. Overrides `scale` for the X axis. @default 1 */
  scaleX?: number;
  /** Vertical scale factor. Overrides `scale` for the Y axis. @default 1 */
  scaleY?: number;
  /** Z-axis rotation in degrees. @default 0 */
  rotate?: number;
  /** X-axis rotation in degrees (3D). @default 0 */
  rotateX?: number;
  /** Y-axis rotation in degrees (3D). @default 0 */
  rotateY?: number;
  /** Border radius in pixels. Uses hardware-accelerated clipping (ViewOutlineProvider on Android, layer.cornerRadius on iOS). @default 0 */
  borderRadius?: number;
  /** Background color. Accepts any React Native color value. @default 'transparent' */
  backgroundColor?: ColorValue;
};
