// @ts-ignore – uniwind is an optional peer dependency
import { withUniwind } from 'uniwind';
import { EaseView as BaseEaseView } from './EaseView';

type EaseViewComponent = typeof BaseEaseView;

export const EaseView: EaseViewComponent = withUniwind(
  BaseEaseView,
) as EaseViewComponent;

export type { EaseViewProps } from './EaseView';
export type {
  AnimateProps,
  CubicBezier,
  Transition,
  SingleTransition,
  TransitionMap,
  TimingTransition,
  SpringTransition,
  NoneTransition,
  EasingType,
  TransitionEndEvent,
  TransformOrigin,
} from './types';
