#import "EaseView.h"

#import <React/RCTConversions.h>

#import <react/renderer/components/EaseViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/EaseViewSpec/EventEmitters.h>
#import <react/renderer/components/EaseViewSpec/Props.h>
#import <react/renderer/components/EaseViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

// Forward-declare private method so we can override it.
@interface RCTViewComponentView ()
- (void)invalidateLayer;
@end

using namespace facebook::react;

// Animation key constants
static NSString *const kAnimKeyOpacity = @"ease_opacity";
static NSString *const kAnimKeyTransform = @"ease_transform";
static NSString *const kAnimKeyCornerRadius = @"ease_cornerRadius";
static NSString *const kAnimKeyBackgroundColor = @"ease_backgroundColor";

static inline CGFloat degreesToRadians(CGFloat degrees) {
  return degrees * M_PI / 180.0;
}

// Compose a full CATransform3D from individual animate values.
// Order: Scale → RotateY → RotateX → RotateZ → Translate.
// Perspective (m34) is always included — invisible when no 3D rotation.
static CATransform3D composeTransform(CGFloat scaleX, CGFloat scaleY,
                                      CGFloat translateX, CGFloat translateY,
                                      CGFloat rotateZ, CGFloat rotateX,
                                      CGFloat rotateY) {
  CATransform3D t = CATransform3DIdentity;
  t.m34 = -1.0 / 850.0;
  t = CATransform3DTranslate(t, translateX, translateY, 0);
  t = CATransform3DRotate(t, rotateZ, 0, 0, 1);
  t = CATransform3DRotate(t, rotateX, 1, 0, 0);
  t = CATransform3DRotate(t, rotateY, 0, 1, 0);
  t = CATransform3DScale(t, scaleX, scaleY, 1);
  return t;
}

// Bitmask flags — must match JS constants
static const int kMaskOpacity = 1 << 0;
static const int kMaskTranslateX = 1 << 1;
static const int kMaskTranslateY = 1 << 2;
static const int kMaskScaleX = 1 << 3;
static const int kMaskScaleY = 1 << 4;
static const int kMaskRotate = 1 << 5;
static const int kMaskRotateX = 1 << 6;
static const int kMaskRotateY = 1 << 7;
static const int kMaskBorderRadius = 1 << 8;
static const int kMaskBackgroundColor = 1 << 9;
static const int kMaskAnyTransform = kMaskTranslateX | kMaskTranslateY |
                                     kMaskScaleX | kMaskScaleY | kMaskRotate |
                                     kMaskRotateX | kMaskRotateY;

@implementation EaseView {
  BOOL _isFirstMount;
  NSInteger _animationBatchId;
  NSInteger _pendingAnimationCount;
  BOOL _anyInterrupted;
  CGFloat _transformOriginX;
  CGFloat _transformOriginY;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<EaseViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const EaseViewProps>();
    _props = defaultProps;
    _isFirstMount = YES;
    _transformOriginX = 0.5;
    _transformOriginY = 0.5;
  }
  return self;
}

#pragma mark - Transform origin

- (void)updateAnchorPoint {
  CGPoint newAnchor = CGPointMake(_transformOriginX, _transformOriginY);
  if (CGPointEqualToPoint(newAnchor, self.layer.anchorPoint)) {
    return;
  }
  CGPoint oldAnchor = self.layer.anchorPoint;
  CGSize size = self.layer.bounds.size;
  CGPoint pos = self.layer.position;
  pos.x += (newAnchor.x - oldAnchor.x) * size.width;
  pos.y += (newAnchor.y - oldAnchor.y) * size.height;
  self.layer.anchorPoint = newAnchor;
  self.layer.position = pos;
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  // Temporarily reset to default anchorPoint so super's frame setting
  // computes position correctly, then re-apply our custom anchorPoint.
  CGPoint customAnchor = self.layer.anchorPoint;
  BOOL hasCustomAnchor =
      !CGPointEqualToPoint(customAnchor, CGPointMake(0.5, 0.5));
  if (hasCustomAnchor) {
    self.layer.anchorPoint = CGPointMake(0.5, 0.5);
  }

  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  if (hasCustomAnchor) {
    CGSize size = self.layer.bounds.size;
    CGPoint pos = self.layer.position;
    pos.x += (customAnchor.x - 0.5) * size.width;
    pos.y += (customAnchor.y - 0.5) * size.height;
    self.layer.anchorPoint = customAnchor;
    self.layer.position = pos;
  }
}

#pragma mark - Animation helpers

- (CATransform3D)presentationTransform {
  CALayer *pl = self.layer.presentationLayer;
  return pl ? pl.transform : self.layer.transform;
}

- (NSValue *)presentationValueForKeyPath:(NSString *)keyPath {
  CALayer *presentationLayer = self.layer.presentationLayer;
  if (presentationLayer) {
    return [presentationLayer valueForKeyPath:keyPath];
  }
  return [self.layer valueForKeyPath:keyPath];
}

- (CAAnimation *)createAnimationForKeyPath:(NSString *)keyPath
                                 fromValue:(NSValue *)fromValue
                                   toValue:(NSValue *)toValue
                                     props:(const EaseViewProps &)props
                                      loop:(BOOL)loop {
  if (props.transitionType == EaseViewTransitionType::Spring) {
    CASpringAnimation *spring =
        [CASpringAnimation animationWithKeyPath:keyPath];
    spring.fromValue = fromValue;
    spring.toValue = toValue;
    spring.damping = props.transitionDamping;
    spring.stiffness = props.transitionStiffness;
    spring.mass = props.transitionMass;
    spring.initialVelocity = 0;
    spring.duration = spring.settlingDuration;
    return spring;
  } else {
    CABasicAnimation *timing = [CABasicAnimation animationWithKeyPath:keyPath];
    timing.fromValue = fromValue;
    timing.toValue = toValue;
    timing.duration = props.transitionDuration / 1000.0;
    {
      const auto &b = props.transitionEasingBezier;
      if (b.size() == 4) {
        timing.timingFunction = [CAMediaTimingFunction
            functionWithControlPoints:(float)b[0]:(float)b[1]:(float)b[2
        ]:(float)b[3]];
      } else {
        // Fallback: easeInOut
        timing.timingFunction =
            [CAMediaTimingFunction functionWithControlPoints:0.42:0.0:0.58:1.0];
      }
    }
    if (loop) {
      if (props.transitionLoop == EaseViewTransitionLoop::Repeat) {
        timing.repeatCount = HUGE_VALF;
      } else if (props.transitionLoop == EaseViewTransitionLoop::Reverse) {
        timing.repeatCount = HUGE_VALF;
        timing.autoreverses = YES;
      }
    }
    return timing;
  }
}

- (void)applyAnimationForKeyPath:(NSString *)keyPath
                    animationKey:(NSString *)animationKey
                       fromValue:(NSValue *)fromValue
                         toValue:(NSValue *)toValue
                           props:(const EaseViewProps &)props
                            loop:(BOOL)loop {
  _pendingAnimationCount++;

  CAAnimation *animation = [self createAnimationForKeyPath:keyPath
                                                 fromValue:fromValue
                                                   toValue:toValue
                                                     props:props
                                                      loop:loop];
  [animation setValue:@(_animationBatchId) forKey:@"easeBatchId"];
  animation.delegate = self;
  [self.layer addAnimation:animation forKey:animationKey];
}

/// Compose a CATransform3D from EaseViewProps target values.
- (CATransform3D)targetTransformFromProps:(const EaseViewProps &)p {
  return composeTransform(
      p.animateScaleX, p.animateScaleY, p.animateTranslateX,
      p.animateTranslateY, degreesToRadians(p.animateRotate),
      degreesToRadians(p.animateRotateX), degreesToRadians(p.animateRotateY));
}

/// Compose a CATransform3D from EaseViewProps initial values.
- (CATransform3D)initialTransformFromProps:(const EaseViewProps &)p {
  return composeTransform(p.initialAnimateScaleX, p.initialAnimateScaleY,
                          p.initialAnimateTranslateX,
                          p.initialAnimateTranslateY,
                          degreesToRadians(p.initialAnimateRotate),
                          degreesToRadians(p.initialAnimateRotateX),
                          degreesToRadians(p.initialAnimateRotateY));
}

#pragma mark - Props update

- (void)updateProps:(const Props::Shared &)props
           oldProps:(const Props::Shared &)oldProps {
  const auto &newViewProps =
      *std::static_pointer_cast<const EaseViewProps>(props);

  [super updateProps:props oldProps:oldProps];

  [CATransaction begin];
  [CATransaction setDisableActions:YES];

  if (_transformOriginX != newViewProps.transformOriginX ||
      _transformOriginY != newViewProps.transformOriginY) {
    _transformOriginX = newViewProps.transformOriginX;
    _transformOriginY = newViewProps.transformOriginY;
    [self updateAnchorPoint];
  }

  if (_pendingAnimationCount > 0 && _eventEmitter) {
    auto emitter =
        std::static_pointer_cast<const EaseViewEventEmitter>(_eventEmitter);
    emitter->onTransitionEnd(EaseViewEventEmitter::OnTransitionEnd{
        .finished = false,
    });
  }

  _animationBatchId++;
  _pendingAnimationCount = 0;
  _anyInterrupted = NO;

  // Bitmask: which properties are animated. Non-animated = let style handle.
  int mask = newViewProps.animatedProperties;
  BOOL hasTransform = (mask & kMaskAnyTransform) != 0;

  if (_isFirstMount) {
    _isFirstMount = NO;

    // Check if initial differs from target for any masked property
    BOOL hasInitialOpacity =
        (mask & kMaskOpacity) &&
        newViewProps.initialAnimateOpacity != newViewProps.animateOpacity;

    BOOL hasInitialBorderRadius =
        (mask & kMaskBorderRadius) && newViewProps.initialAnimateBorderRadius !=
                                          newViewProps.animateBorderRadius;

    BOOL hasInitialBackgroundColor =
        (mask & kMaskBackgroundColor) &&
        newViewProps.initialAnimateBackgroundColor !=
            newViewProps.animateBackgroundColor;

    BOOL hasInitialTransform = NO;
    CATransform3D initialT = CATransform3DIdentity;
    CATransform3D targetT = CATransform3DIdentity;

    if (hasTransform) {
      initialT = [self initialTransformFromProps:newViewProps];
      targetT = [self targetTransformFromProps:newViewProps];
      hasInitialTransform = !CATransform3DEqualToTransform(initialT, targetT);
    }

    if (hasInitialOpacity || hasInitialTransform || hasInitialBorderRadius ||
        hasInitialBackgroundColor) {
      // Set initial values
      if (mask & kMaskOpacity)
        self.layer.opacity = newViewProps.initialAnimateOpacity;
      if (hasTransform)
        self.layer.transform = initialT;
      if (mask & kMaskBorderRadius) {
        self.layer.cornerRadius = newViewProps.initialAnimateBorderRadius;
        self.layer.masksToBounds =
            newViewProps.initialAnimateBorderRadius > 0 ||
            newViewProps.animateBorderRadius > 0;
      }
      if (mask & kMaskBackgroundColor)
        self.layer.backgroundColor =
            RCTUIColorFromSharedColor(
                newViewProps.initialAnimateBackgroundColor)
                .CGColor;

      // Animate from initial to target
      if (hasInitialOpacity) {
        self.layer.opacity = newViewProps.animateOpacity;
        [self applyAnimationForKeyPath:@"opacity"
                          animationKey:kAnimKeyOpacity
                             fromValue:@(newViewProps.initialAnimateOpacity)
                               toValue:@(newViewProps.animateOpacity)
                                 props:newViewProps
                                  loop:YES];
      }
      if (hasInitialTransform) {
        self.layer.transform = targetT;
        [self applyAnimationForKeyPath:@"transform"
                          animationKey:kAnimKeyTransform
                             fromValue:[NSValue valueWithCATransform3D:initialT]
                               toValue:[NSValue valueWithCATransform3D:targetT]
                                 props:newViewProps
                                  loop:YES];
      }
      if (hasInitialBorderRadius) {
        self.layer.cornerRadius = newViewProps.animateBorderRadius;
        [self
            applyAnimationForKeyPath:@"cornerRadius"
                        animationKey:kAnimKeyCornerRadius
                           fromValue:@(newViewProps.initialAnimateBorderRadius)
                             toValue:@(newViewProps.animateBorderRadius)
                               props:newViewProps
                                loop:YES];
      }
      if (hasInitialBackgroundColor) {
        self.layer.backgroundColor =
            RCTUIColorFromSharedColor(newViewProps.animateBackgroundColor)
                .CGColor;
        [self applyAnimationForKeyPath:@"backgroundColor"
                          animationKey:kAnimKeyBackgroundColor
                             fromValue:(__bridge id)RCTUIColorFromSharedColor(
                                           newViewProps
                                               .initialAnimateBackgroundColor)
                                           .CGColor
                               toValue:(__bridge id)RCTUIColorFromSharedColor(
                                           newViewProps.animateBackgroundColor)
                                           .CGColor
                                 props:newViewProps
                                  loop:YES];
      }
    } else {
      // No initial animation — set target values directly
      if (mask & kMaskOpacity)
        self.layer.opacity = newViewProps.animateOpacity;
      if (hasTransform)
        self.layer.transform = targetT;
      if (mask & kMaskBorderRadius) {
        self.layer.cornerRadius = newViewProps.animateBorderRadius;
        self.layer.masksToBounds = newViewProps.animateBorderRadius > 0;
      }
      if (mask & kMaskBackgroundColor)
        self.layer.backgroundColor =
            RCTUIColorFromSharedColor(newViewProps.animateBackgroundColor)
                .CGColor;
    }
  } else if (newViewProps.transitionType == EaseViewTransitionType::None) {
    // No transition — set values immediately
    [self.layer removeAllAnimations];
    if (mask & kMaskOpacity)
      self.layer.opacity = newViewProps.animateOpacity;
    if (hasTransform)
      self.layer.transform = [self targetTransformFromProps:newViewProps];
    if (mask & kMaskBorderRadius) {
      self.layer.cornerRadius = newViewProps.animateBorderRadius;
      self.layer.masksToBounds = newViewProps.animateBorderRadius > 0;
    }
    if (mask & kMaskBackgroundColor)
      self.layer.backgroundColor =
          RCTUIColorFromSharedColor(newViewProps.animateBackgroundColor)
              .CGColor;
    if (_eventEmitter) {
      auto emitter =
          std::static_pointer_cast<const EaseViewEventEmitter>(_eventEmitter);
      emitter->onTransitionEnd(EaseViewEventEmitter::OnTransitionEnd{
          .finished = true,
      });
    }
  } else {
    // Subsequent updates: animate changed properties
    const auto &oldViewProps =
        *std::static_pointer_cast<const EaseViewProps>(oldProps);

    if ((mask & kMaskOpacity) &&
        oldViewProps.animateOpacity != newViewProps.animateOpacity) {
      self.layer.opacity = newViewProps.animateOpacity;
      [self
          applyAnimationForKeyPath:@"opacity"
                      animationKey:kAnimKeyOpacity
                         fromValue:[self presentationValueForKeyPath:@"opacity"]
                           toValue:@(newViewProps.animateOpacity)
                             props:newViewProps
                              loop:NO];
    }

    // Check if ANY transform-related property changed
    if (hasTransform) {
      BOOL anyTransformChanged =
          oldViewProps.animateTranslateX != newViewProps.animateTranslateX ||
          oldViewProps.animateTranslateY != newViewProps.animateTranslateY ||
          oldViewProps.animateScaleX != newViewProps.animateScaleX ||
          oldViewProps.animateScaleY != newViewProps.animateScaleY ||
          oldViewProps.animateRotate != newViewProps.animateRotate ||
          oldViewProps.animateRotateX != newViewProps.animateRotateX ||
          oldViewProps.animateRotateY != newViewProps.animateRotateY;

      if (anyTransformChanged) {
        CATransform3D fromT = [self presentationTransform];
        CATransform3D toT = [self targetTransformFromProps:newViewProps];
        self.layer.transform = toT;
        [self applyAnimationForKeyPath:@"transform"
                          animationKey:kAnimKeyTransform
                             fromValue:[NSValue valueWithCATransform3D:fromT]
                               toValue:[NSValue valueWithCATransform3D:toT]
                                 props:newViewProps
                                  loop:NO];
      }
    }

    if ((mask & kMaskBorderRadius) &&
        oldViewProps.animateBorderRadius != newViewProps.animateBorderRadius) {
      self.layer.cornerRadius = newViewProps.animateBorderRadius;
      self.layer.masksToBounds = newViewProps.animateBorderRadius > 0;
      [self applyAnimationForKeyPath:@"cornerRadius"
                        animationKey:kAnimKeyCornerRadius
                           fromValue:[self presentationValueForKeyPath:
                                               @"cornerRadius"]
                             toValue:@(newViewProps.animateBorderRadius)
                               props:newViewProps
                                loop:NO];
    }

    if ((mask & kMaskBackgroundColor) &&
        oldViewProps.animateBackgroundColor !=
            newViewProps.animateBackgroundColor) {
      CGColorRef fromColor = (__bridge CGColorRef)
          [self presentationValueForKeyPath:@"backgroundColor"];
      CGColorRef toColor =
          RCTUIColorFromSharedColor(newViewProps.animateBackgroundColor)
              .CGColor;
      self.layer.backgroundColor = toColor;
      [self applyAnimationForKeyPath:@"backgroundColor"
                        animationKey:kAnimKeyBackgroundColor
                           fromValue:(__bridge id)fromColor
                             toValue:(__bridge id)toColor
                               props:newViewProps
                                loop:NO];
    }
  }

  [CATransaction commit];
}

- (void)invalidateLayer {
  [super invalidateLayer];

  // super resets layer.opacity, layer.cornerRadius, and layer.backgroundColor
  // from style props. Re-apply our animated values.
  const auto &viewProps =
      *std::static_pointer_cast<const EaseViewProps>(_props);
  int mask = viewProps.animatedProperties;

  if (!(mask & (kMaskOpacity | kMaskBorderRadius | kMaskBackgroundColor))) {
    return;
  }

  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  if (mask & kMaskOpacity) {
    [self.layer removeAnimationForKey:@"opacity"];
    self.layer.opacity = viewProps.animateOpacity;
  }
  if (mask & kMaskBorderRadius) {
    [self.layer removeAnimationForKey:@"cornerRadius"];
    self.layer.cornerRadius = viewProps.animateBorderRadius;
    self.layer.masksToBounds = viewProps.animateBorderRadius > 0;
  }
  if (mask & kMaskBackgroundColor) {
    [self.layer removeAnimationForKey:@"backgroundColor"];
    self.layer.backgroundColor =
        RCTUIColorFromSharedColor(viewProps.animateBackgroundColor).CGColor;
  }
  [CATransaction commit];
}

#pragma mark - CAAnimationDelegate

- (void)animationDidStop:(CAAnimation *)anim finished:(BOOL)flag {
  NSNumber *batchId = [anim valueForKey:@"easeBatchId"];
  if (!batchId || batchId.integerValue != _animationBatchId || !_eventEmitter) {
    return;
  }

  if (!flag) {
    _anyInterrupted = YES;
  }
  _pendingAnimationCount--;
  if (_pendingAnimationCount <= 0) {
    auto emitter =
        std::static_pointer_cast<const EaseViewEventEmitter>(_eventEmitter);
    emitter->onTransitionEnd(EaseViewEventEmitter::OnTransitionEnd{
        .finished = !_anyInterrupted,
    });
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [self.layer removeAllAnimations];
  _isFirstMount = YES;
  _pendingAnimationCount = 0;
  _anyInterrupted = NO;
  _transformOriginX = 0.5;
  _transformOriginY = 0.5;
  self.layer.anchorPoint = CGPointMake(0.5, 0.5);
  self.layer.opacity = 1.0;
  self.layer.transform = CATransform3DIdentity;
  self.layer.cornerRadius = 0;
  self.layer.masksToBounds = NO;
  self.layer.backgroundColor = nil;
}

@end
