import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
  type HostComponent,
  type ColorValue,
} from 'react-native';

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

  // Transition config
  transitionType?: CodegenTypes.WithDefault<
    'timing' | 'spring' | 'none',
    'timing'
  >;
  transitionDuration?: CodegenTypes.WithDefault<CodegenTypes.Int32, 300>;
  // Easing cubic bezier control points [x1, y1, x2, y2] (default: easeInOut)
  transitionEasingBezier?: ReadonlyArray<CodegenTypes.Float>;
  transitionDamping?: CodegenTypes.WithDefault<CodegenTypes.Float, 15.0>;
  transitionStiffness?: CodegenTypes.WithDefault<CodegenTypes.Float, 120.0>;
  transitionMass?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  transitionLoop?: CodegenTypes.WithDefault<
    'none' | 'repeat' | 'reverse',
    'none'
  >;
  transitionDelay?: CodegenTypes.WithDefault<CodegenTypes.Int32, 0>;

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
