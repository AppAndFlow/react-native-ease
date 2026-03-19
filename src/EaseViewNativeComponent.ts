import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
  type HostComponent,
  type ColorValue,
} from 'react-native';

type Float = CodegenTypes.Float;
type Int32 = CodegenTypes.Int32;

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
}>;

export interface NativeProps extends ViewProps {
  // Bitmask of which properties are animated (0 = none, let style handle all)
  animatedProperties?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;

  // Animate target values
  animateOpacity?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateTranslateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateTranslateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateScaleX?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateScaleY?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateRotate?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateRotateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateRotateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateBorderRadius?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateBackgroundColor?: ColorValue;

  // Initial values for enter animations
  initialAnimateOpacity?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateTranslateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateTranslateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateScaleX?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateScaleY?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateRotate?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateRotateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateRotateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateBorderRadius?: CodegenTypes.WithDefault<
    CodegenTypes.Float,
    0.0
  >;
  initialAnimateBackgroundColor?: ColorValue;

  // Unified transition config — one struct with per-property configs
  transitions?: NativeTransitions;

  // Transform origin (0–1 fractions, default center)
  transformOriginX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.5>;
  transformOriginY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.5>;

  // Events
  onTransitionEnd?: CodegenTypes.DirectEventHandler<
    Readonly<{ finished: boolean }>
  >;

  // Android hardware layer optimization (no-op on iOS)
  useHardwareLayer?: CodegenTypes.WithDefault<boolean, false>;
}

export default codegenNativeComponent<NativeProps>(
  'EaseView',
) as HostComponent<NativeProps>;
