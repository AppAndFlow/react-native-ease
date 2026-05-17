import {
  codegenNativeComponent,
  type ViewProps,
  type HostComponent,
  type ColorValue,
} from 'react-native';
import type {
  DirectEventHandler,
  Float,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

type NativeTransitionConfig = Readonly<{
  type: string;
  duration: Int32;
  easingBezier: ReadonlyArray<Float>;
  damping: Float;
  stiffness: Float;
  mass: Float;
  loop: string;
  delay: Int32;
}>;

type NativeTransitions = Readonly<{
  defaultConfig: NativeTransitionConfig;
  transform?: NativeTransitionConfig;
  opacity?: NativeTransitionConfig;
  borderRadius?: NativeTransitionConfig;
  backgroundColor?: NativeTransitionConfig;
  border?: NativeTransitionConfig;
  shadow?: NativeTransitionConfig;
}>;

export interface NativeProps extends ViewProps {
  // Bitmask of which properties are animated (0 = none, let style handle all)
  animatedProperties?: WithDefault<Int32, 0>;

  // Animate target values
  animateOpacity?: WithDefault<Float, 1.0>;
  animateTranslateX?: WithDefault<Float, 0.0>;
  animateTranslateY?: WithDefault<Float, 0.0>;
  animateScaleX?: WithDefault<Float, 1.0>;
  animateScaleY?: WithDefault<Float, 1.0>;
  animateRotate?: WithDefault<Float, 0.0>;
  animateRotateX?: WithDefault<Float, 0.0>;
  animateRotateY?: WithDefault<Float, 0.0>;
  animateBorderRadius?: WithDefault<Float, 0.0>;
  animateBackgroundColor?: ColorValue;
  animateBorderWidth?: WithDefault<Float, 0.0>;
  animateBorderColor?: ColorValue;
  animateShadowOpacity?: WithDefault<Float, 0.0>;
  animateShadowRadius?: WithDefault<Float, 0.0>;
  animateShadowColor?: ColorValue;
  animateShadowOffsetX?: WithDefault<Float, 0.0>;
  animateShadowOffsetY?: WithDefault<Float, 0.0>;
  animateElevation?: WithDefault<Float, 0.0>;

  // Initial values for enter animations
  initialAnimateOpacity?: WithDefault<Float, 1.0>;
  initialAnimateTranslateX?: WithDefault<Float, 0.0>;
  initialAnimateTranslateY?: WithDefault<Float, 0.0>;
  initialAnimateScaleX?: WithDefault<Float, 1.0>;
  initialAnimateScaleY?: WithDefault<Float, 1.0>;
  initialAnimateRotate?: WithDefault<Float, 0.0>;
  initialAnimateRotateX?: WithDefault<Float, 0.0>;
  initialAnimateRotateY?: WithDefault<Float, 0.0>;
  initialAnimateBorderRadius?: WithDefault<Float, 0.0>;
  initialAnimateBackgroundColor?: ColorValue;
  initialAnimateBorderWidth?: WithDefault<Float, 0.0>;
  initialAnimateBorderColor?: ColorValue;
  initialAnimateShadowOpacity?: WithDefault<Float, 0.0>;
  initialAnimateShadowRadius?: WithDefault<Float, 0.0>;
  initialAnimateShadowColor?: ColorValue;
  initialAnimateShadowOffsetX?: WithDefault<Float, 0.0>;
  initialAnimateShadowOffsetY?: WithDefault<Float, 0.0>;
  initialAnimateElevation?: WithDefault<Float, 0.0>;

  // Unified transition config — one struct with per-property configs
  transitions?: NativeTransitions;

  // Transform origin (0–1 fractions, default center)
  transformOriginX?: WithDefault<Float, 0.5>;
  transformOriginY?: WithDefault<Float, 0.5>;

  // 3D perspective distance (default 1280, matches RN default)
  transformPerspective?: WithDefault<Float, 1280.0>;

  // Events
  onTransitionEnd?: DirectEventHandler<Readonly<{ finished: boolean }>>;

  // Android hardware layer optimization (no-op on iOS)
  useHardwareLayer?: WithDefault<boolean, false>;
}

export default codegenNativeComponent<NativeProps>(
  'EaseView',
) as HostComponent<NativeProps>;
