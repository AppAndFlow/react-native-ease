import {
  codegenNativeComponent,
  type CodegenTypes,
  type ViewProps,
  type HostComponent,
} from 'react-native';

export interface NativeProps extends ViewProps {
  // Animate target values
  animateOpacity?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateTranslateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateTranslateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  animateScale?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  animateRotate?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;

  // Initial values for enter animations
  initialAnimateOpacity?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateTranslateX?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateTranslateY?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;
  initialAnimateScale?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  initialAnimateRotate?: CodegenTypes.WithDefault<CodegenTypes.Float, 0.0>;

  // Transition config
  transitionType?: CodegenTypes.WithDefault<'timing' | 'spring', 'timing'>;
  transitionDuration?: CodegenTypes.WithDefault<CodegenTypes.Int32, 300>;
  transitionEasing?: CodegenTypes.WithDefault<
    'linear' | 'easeIn' | 'easeOut' | 'easeInOut',
    'easeInOut'
  >;
  transitionDamping?: CodegenTypes.WithDefault<CodegenTypes.Float, 15.0>;
  transitionStiffness?: CodegenTypes.WithDefault<CodegenTypes.Float, 120.0>;
  transitionMass?: CodegenTypes.WithDefault<CodegenTypes.Float, 1.0>;
  transitionLoop?: CodegenTypes.WithDefault<
    'none' | 'repeat' | 'reverse',
    'none'
  >;

  // Android hardware layer optimization (no-op on iOS)
  useHardwareLayer?: CodegenTypes.WithDefault<boolean, true>;
}

export default codegenNativeComponent<NativeProps>(
  'EaseView',
) as HostComponent<NativeProps>;
