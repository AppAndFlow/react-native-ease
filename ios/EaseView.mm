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
static NSString *const kAnimKeyTransformRotateZ = @"ease_transform_rotZ";
static NSString *const kAnimKeyTransformRotateX = @"ease_transform_rotX";
static NSString *const kAnimKeyTransformRotateY = @"ease_transform_rotY";
static NSString *const kAnimKeyTransformScaleX = @"ease_transform_scX";
static NSString *const kAnimKeyTransformScaleY = @"ease_transform_scY";
static NSString *const kAnimKeyTransformTransX = @"ease_transform_trX";
static NSString *const kAnimKeyTransformTransY = @"ease_transform_trY";
static NSString *const kAnimKeyCornerRadius = @"ease_cornerRadius";
static NSString *const kAnimKeyBackgroundColor = @"ease_backgroundColor";

static inline CGFloat degreesToRadians(CGFloat degrees) {
  return degrees * M_PI / 180.0;
}

// Compose a full CATransform3D from individual animate values.
// Order: Scale → RotateY → RotateX → RotateZ → Translate.
// Default perspective (1280) matches React Native's default.
// https://github.com/facebook/react-native/blob/a98aa814/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L624
static CATransform3D composeTransform(CGFloat scaleX, CGFloat scaleY,
                                      CGFloat translateX, CGFloat translateY,
                                      CGFloat rotateZ, CGFloat rotateX,
                                      CGFloat rotateY, CGFloat perspective) {
  CATransform3D t = CATransform3DIdentity;
  t.m34 = -1.0 / perspective;
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

// Per-property transition config resolved from the transitions struct
struct EaseTransitionConfig {
  std::string type;
  int duration;
  float bezier[4];
  float damping;
  float stiffness;
  float mass;
  std::string loop;
  int delay;
};

// Convert from a codegen-generated transition config struct to our local
// EaseTransitionConfig
template <typename T>
static EaseTransitionConfig transitionConfigFromStruct(const T &src) {
  EaseTransitionConfig config;
  config.type = src.type;
  config.duration = src.duration;
  const auto &b = src.easingBezier;
  if (b.size() == 4) {
    config.bezier[0] = b[0];
    config.bezier[1] = b[1];
    config.bezier[2] = b[2];
    config.bezier[3] = b[3];
  } else {
    config.bezier[0] = 0.42f;
    config.bezier[1] = 0.0f;
    config.bezier[2] = 0.58f;
    config.bezier[3] = 1.0f;
  }
  config.damping = src.damping;
  config.stiffness = src.stiffness;
  config.mass = src.mass;
  config.loop = src.loop;
  config.delay = src.delay;
  return config;
}

// Check if a category config was explicitly set (non-empty type means JS sent
// it)
template <typename T> static bool hasConfig(const T &cfg) {
  return !cfg.type.empty();
}

static EaseTransitionConfig
transitionConfigForProperty(const std::string &name,
                            const EaseViewProps &props) {
  const auto &t = props.transitions;

  // Map property name to category, check if category override exists
  if (name == "opacity" && hasConfig(t.opacity)) {
    return transitionConfigFromStruct(t.opacity);
  } else if ((name == "translateX" || name == "translateY" ||
              name == "scaleX" || name == "scaleY" || name == "rotate" ||
              name == "rotateX" || name == "rotateY") &&
             hasConfig(t.transform)) {
    return transitionConfigFromStruct(t.transform);
  } else if (name == "borderRadius" && hasConfig(t.borderRadius)) {
    return transitionConfigFromStruct(t.borderRadius);
  } else if (name == "backgroundColor" && hasConfig(t.backgroundColor)) {
    return transitionConfigFromStruct(t.backgroundColor);
  }
  // Fallback to defaultConfig
  return transitionConfigFromStruct(t.defaultConfig);
}

// Find lowest property name with a set mask bit among transform properties
static std::string lowestTransformPropertyName(int mask) {
  if (mask & kMaskTranslateX)
    return "translateX";
  if (mask & kMaskTranslateY)
    return "translateY";
  if (mask & kMaskScaleX)
    return "scaleX";
  if (mask & kMaskScaleY)
    return "scaleY";
  if (mask & kMaskRotate)
    return "rotate";
  if (mask & kMaskRotateX)
    return "rotateX";
  if (mask & kMaskRotateY)
    return "rotateY";
  return "translateX"; // fallback
}

@implementation EaseView {
  BOOL _isFirstMount;
  BOOL _hasPendingFirstMountUpdate;
  NSInteger _animationBatchId;
  NSInteger _pendingAnimationCount;
  BOOL _anyInterrupted;
  CGFloat _transformOriginX;
  CGFloat _transformOriginY;
  CGFloat _transformPerspective;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<EaseViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const EaseViewProps>();
    _props = defaultProps;
    _isFirstMount = YES;
    _transformPerspective = 1280.0;
    _hasPendingFirstMountUpdate = NO;
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
                                    config:(EaseTransitionConfig)config
                                      loop:(BOOL)loop {
  if (config.type == "spring") {
    CASpringAnimation *spring =
        [CASpringAnimation animationWithKeyPath:keyPath];
    spring.fromValue = fromValue;
    spring.toValue = toValue;
    spring.damping = config.damping;
    spring.stiffness = config.stiffness;
    spring.mass = config.mass;
    spring.initialVelocity = 0;
    spring.duration = spring.settlingDuration;
    return spring;
  } else {
    CABasicAnimation *timing = [CABasicAnimation animationWithKeyPath:keyPath];
    timing.fromValue = fromValue;
    timing.toValue = toValue;
    timing.duration = config.duration / 1000.0;
    timing.timingFunction = [CAMediaTimingFunction
        functionWithControlPoints:config.bezier[0]:config.bezier[1
    ]:config.bezier[2]:config.bezier[3]];
    if (loop) {
      if (config.loop == "repeat") {
        timing.repeatCount = HUGE_VALF;
      } else if (config.loop == "reverse") {
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
                          config:(EaseTransitionConfig)config
                            loop:(BOOL)loop {
  _pendingAnimationCount++;

  CAAnimation *animation = [self createAnimationForKeyPath:keyPath
                                                 fromValue:fromValue
                                                   toValue:toValue
                                                    config:config
                                                      loop:loop];
  if (config.delay > 0) {
    animation.beginTime = CACurrentMediaTime() + (config.delay / 1000.0);
    animation.fillMode = kCAFillModeBackwards;
  }
  [animation setValue:@(_animationBatchId) forKey:@"easeBatchId"];
  animation.delegate = self;
  [self.layer addAnimation:animation forKey:animationKey];
}

/// Compose a CATransform3D from EaseViewProps target values.
- (CATransform3D)targetTransformFromProps:(const EaseViewProps &)p {
  return composeTransform(
      p.animateScaleX, p.animateScaleY, p.animateTranslateX,
      p.animateTranslateY, degreesToRadians(p.animateRotate),
      degreesToRadians(p.animateRotateX), degreesToRadians(p.animateRotateY),
      _transformPerspective);
}

/// Compose a CATransform3D from EaseViewProps initial values.
- (CATransform3D)initialTransformFromProps:(const EaseViewProps &)p {
  return composeTransform(
      p.initialAnimateScaleX, p.initialAnimateScaleY,
      p.initialAnimateTranslateX, p.initialAnimateTranslateY,
      degreesToRadians(p.initialAnimateRotate),
      degreesToRadians(p.initialAnimateRotateX),
      degreesToRadians(p.initialAnimateRotateY), _transformPerspective);
}

- (void)beginAnimationBatch {
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
}

- (void)applyFirstMountProps:(const EaseViewProps &)viewProps {
  int mask = viewProps.animatedProperties;
  BOOL hasTransform = (mask & kMaskAnyTransform) != 0;

  // Check if initial differs from target for any masked property
  BOOL hasInitialOpacity =
      (mask & kMaskOpacity) &&
      viewProps.initialAnimateOpacity != viewProps.animateOpacity;

  BOOL hasInitialBorderRadius =
      (mask & kMaskBorderRadius) &&
      viewProps.initialAnimateBorderRadius != viewProps.animateBorderRadius;

  BOOL hasInitialBackgroundColor = (mask & kMaskBackgroundColor) &&
                                   viewProps.initialAnimateBackgroundColor !=
                                       viewProps.animateBackgroundColor;

  BOOL hasInitialTransform = NO;
  CATransform3D initialT = CATransform3DIdentity;
  CATransform3D targetT = CATransform3DIdentity;
  int changedInitTransform = 0;

  if (hasTransform) {
    initialT = [self initialTransformFromProps:viewProps];
    targetT = [self targetTransformFromProps:viewProps];
    // Compare raw prop values (not composed matrices) so that e.g.
    // rotate 0→360 is correctly detected as a change even though the
    // resulting CATransform3D matrices are identical.
    if (viewProps.initialAnimateTranslateX != viewProps.animateTranslateX)
      changedInitTransform |= kMaskTranslateX;
    if (viewProps.initialAnimateTranslateY != viewProps.animateTranslateY)
      changedInitTransform |= kMaskTranslateY;
    if (viewProps.initialAnimateScaleX != viewProps.animateScaleX)
      changedInitTransform |= kMaskScaleX;
    if (viewProps.initialAnimateScaleY != viewProps.animateScaleY)
      changedInitTransform |= kMaskScaleY;
    if (viewProps.initialAnimateRotate != viewProps.animateRotate)
      changedInitTransform |= kMaskRotate;
    if (viewProps.initialAnimateRotateX != viewProps.animateRotateX)
      changedInitTransform |= kMaskRotateX;
    if (viewProps.initialAnimateRotateY != viewProps.animateRotateY)
      changedInitTransform |= kMaskRotateY;
    hasInitialTransform = changedInitTransform != 0;
  }

  if (hasInitialOpacity || hasInitialTransform || hasInitialBorderRadius ||
      hasInitialBackgroundColor) {
    // Set initial values after props and layout have settled for this mount.
    if (mask & kMaskOpacity)
      self.layer.opacity = viewProps.initialAnimateOpacity;
    if (hasTransform)
      self.layer.transform = [self initialTransformFromProps:viewProps];
    if (mask & kMaskBorderRadius) {
      self.layer.cornerRadius = viewProps.initialAnimateBorderRadius;
      self.layer.masksToBounds = viewProps.initialAnimateBorderRadius > 0 ||
                                 viewProps.animateBorderRadius > 0;
    }
    if (mask & kMaskBackgroundColor)
      self.layer.backgroundColor =
          RCTUIColorFromSharedColor(viewProps.initialAnimateBackgroundColor)
              .CGColor;

    // Animate from initial to target (skip if config is 'none')
    if (hasInitialOpacity) {
      EaseTransitionConfig opacityConfig =
          transitionConfigForProperty("opacity", viewProps);
      self.layer.opacity = viewProps.animateOpacity;
      if (opacityConfig.type != "none") {
        [self applyAnimationForKeyPath:@"opacity"
                          animationKey:kAnimKeyOpacity
                             fromValue:@(viewProps.initialAnimateOpacity)
                               toValue:@(viewProps.animateOpacity)
                                config:opacityConfig
                                  loop:YES];
      }
    }
    if (hasInitialTransform) {
      std::string transformName =
          lowestTransformPropertyName(changedInitTransform);
      EaseTransitionConfig transformConfig =
          transitionConfigForProperty(transformName, viewProps);
      self.layer.transform = [self targetTransformFromProps:viewProps];
      if (transformConfig.type != "none") {
        // Animate each changed sub-property individually using key paths.
        // This avoids matrix interpolation which fails for cases like
        // rotate 0→360 (identical matrices, but visually a full rotation).
        if (changedInitTransform & kMaskTranslateX) {
          [self applyAnimationForKeyPath:@"transform.translation.x"
                            animationKey:kAnimKeyTransformTransX
                               fromValue:@(viewProps.initialAnimateTranslateX)
                                 toValue:@(viewProps.animateTranslateX)
                                  config:transformConfig
                                    loop:YES];
        }
        if (changedInitTransform & kMaskTranslateY) {
          [self applyAnimationForKeyPath:@"transform.translation.y"
                            animationKey:kAnimKeyTransformTransY
                               fromValue:@(viewProps.initialAnimateTranslateY)
                                 toValue:@(viewProps.animateTranslateY)
                                  config:transformConfig
                                    loop:YES];
        }
        if (changedInitTransform & kMaskScaleX) {
          [self applyAnimationForKeyPath:@"transform.scale.x"
                            animationKey:kAnimKeyTransformScaleX
                               fromValue:@(viewProps.initialAnimateScaleX)
                                 toValue:@(viewProps.animateScaleX)
                                  config:transformConfig
                                    loop:YES];
        }
        if (changedInitTransform & kMaskScaleY) {
          [self applyAnimationForKeyPath:@"transform.scale.y"
                            animationKey:kAnimKeyTransformScaleY
                               fromValue:@(viewProps.initialAnimateScaleY)
                                 toValue:@(viewProps.animateScaleY)
                                  config:transformConfig
                                    loop:YES];
        }
        if (changedInitTransform & kMaskRotate) {
          [self applyAnimationForKeyPath:@"transform.rotation.z"
                            animationKey:kAnimKeyTransformRotateZ
                               fromValue:@(degreesToRadians(
                                             viewProps.initialAnimateRotate))
                                 toValue:@(degreesToRadians(
                                             viewProps.animateRotate))
                                  config:transformConfig
                                    loop:YES];
        }
        if (changedInitTransform & kMaskRotateX) {
          [self applyAnimationForKeyPath:@"transform.rotation.x"
                            animationKey:kAnimKeyTransformRotateX
                               fromValue:@(degreesToRadians(
                                             viewProps.initialAnimateRotateX))
                                 toValue:@(degreesToRadians(
                                             viewProps.animateRotateX))
                                  config:transformConfig
                                    loop:YES];
        }
        if (changedInitTransform & kMaskRotateY) {
          [self applyAnimationForKeyPath:@"transform.rotation.y"
                            animationKey:kAnimKeyTransformRotateY
                               fromValue:@(degreesToRadians(
                                             viewProps.initialAnimateRotateY))
                                 toValue:@(degreesToRadians(
                                             viewProps.animateRotateY))
                                  config:transformConfig
                                    loop:YES];
        }
      }
    }
    if (hasInitialBorderRadius) {
      EaseTransitionConfig brConfig =
          transitionConfigForProperty("borderRadius", viewProps);
      self.layer.cornerRadius = viewProps.animateBorderRadius;
      if (brConfig.type != "none") {
        [self applyAnimationForKeyPath:@"cornerRadius"
                          animationKey:kAnimKeyCornerRadius
                             fromValue:@(viewProps.initialAnimateBorderRadius)
                               toValue:@(viewProps.animateBorderRadius)
                                config:brConfig
                                  loop:YES];
      }
    }
    if (hasInitialBackgroundColor) {
      EaseTransitionConfig bgConfig =
          transitionConfigForProperty("backgroundColor", viewProps);
      self.layer.backgroundColor =
          RCTUIColorFromSharedColor(viewProps.animateBackgroundColor).CGColor;
      if (bgConfig.type != "none") {
        [self applyAnimationForKeyPath:@"backgroundColor"
                          animationKey:kAnimKeyBackgroundColor
                             fromValue:(__bridge id)RCTUIColorFromSharedColor(
                                           viewProps
                                               .initialAnimateBackgroundColor)
                                           .CGColor
                               toValue:(__bridge id)RCTUIColorFromSharedColor(
                                           viewProps.animateBackgroundColor)
                                           .CGColor
                                config:bgConfig
                                  loop:YES];
      }
    }

    // If all per-property configs were 'none', no animations were queued.
    // Fire onTransitionEnd immediately to match the scalar 'none' contract.
    if (_pendingAnimationCount == 0 && _eventEmitter) {
      auto emitter =
          std::static_pointer_cast<const EaseViewEventEmitter>(_eventEmitter);
      emitter->onTransitionEnd(EaseViewEventEmitter::OnTransitionEnd{
          .finished = true,
      });
    }
  } else {
    // No initial animation — set target values directly
    if (mask & kMaskOpacity)
      self.layer.opacity = viewProps.animateOpacity;
    if (hasTransform)
      self.layer.transform = [self targetTransformFromProps:viewProps];
    if (mask & kMaskBorderRadius) {
      self.layer.cornerRadius = viewProps.animateBorderRadius;
      self.layer.masksToBounds = viewProps.animateBorderRadius > 0;
    }
    if (mask & kMaskBackgroundColor)
      self.layer.backgroundColor =
          RCTUIColorFromSharedColor(viewProps.animateBackgroundColor).CGColor;
  }
}

- (void)tryApplyPendingFirstMountProps {
  if (!_hasPendingFirstMountUpdate || !_isFirstMount || self.window == nil) {
    return;
  }

  const auto &viewProps =
      *std::static_pointer_cast<const EaseViewProps>(_props);

  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  [self beginAnimationBatch];
  [self applyFirstMountProps:viewProps];
  _hasPendingFirstMountUpdate = NO;
  _isFirstMount = NO;
  [CATransaction commit];
}

#pragma mark - Props update

- (void)updateProps:(const Props::Shared &)props
           oldProps:(const Props::Shared &)oldProps {
  const auto &newViewProps =
      *std::static_pointer_cast<const EaseViewProps>(props);

  // oldProps can be null. Fall back to props so the diff is a no-op.
  const auto &oldViewProps = *std::static_pointer_cast<const EaseViewProps>(
      oldProps ? oldProps : props);

  [super updateProps:props oldProps:oldProps];

  [CATransaction begin];
  [CATransaction setDisableActions:YES];

  if (_transformOriginX != newViewProps.transformOriginX ||
      _transformOriginY != newViewProps.transformOriginY) {
    _transformOriginX = newViewProps.transformOriginX;
    _transformOriginY = newViewProps.transformOriginY;
    [self updateAnchorPoint];
  }

  if (_transformPerspective != newViewProps.transformPerspective) {
    _transformPerspective = newViewProps.transformPerspective;
  }

  // Bitmask: which properties are animated. Non-animated = let style handle.
  int mask = newViewProps.animatedProperties;
  BOOL hasTransform = (mask & kMaskAnyTransform) != 0;

  if (_isFirstMount) {
    // Delay enter animations until finalizeUpdates so Fabric has already
    // applied props and layout metrics for this mount transaction.
    _hasPendingFirstMountUpdate = YES;
  } else if (newViewProps.transitions.defaultConfig.type == "none" &&
             (!hasConfig(newViewProps.transitions.transform) ||
              newViewProps.transitions.transform.type == "none") &&
             (!hasConfig(newViewProps.transitions.opacity) ||
              newViewProps.transitions.opacity.type == "none") &&
             (!hasConfig(newViewProps.transitions.borderRadius) ||
              newViewProps.transitions.borderRadius.type == "none") &&
             (!hasConfig(newViewProps.transitions.backgroundColor) ||
              newViewProps.transitions.backgroundColor.type == "none")) {
    // All transitions are 'none' — set values immediately
    [self beginAnimationBatch];
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
    [self beginAnimationBatch];
    BOOL anyPropertyChanged = NO;

    if ((mask & kMaskOpacity) &&
        oldViewProps.animateOpacity != newViewProps.animateOpacity) {
      anyPropertyChanged = YES;
      EaseTransitionConfig opacityConfig =
          transitionConfigForProperty("opacity", newViewProps);
      if (opacityConfig.type == "none") {
        self.layer.opacity = newViewProps.animateOpacity;
        [self.layer removeAnimationForKey:kAnimKeyOpacity];
      } else {
        self.layer.opacity = newViewProps.animateOpacity;
        [self
            applyAnimationForKeyPath:@"opacity"
                        animationKey:kAnimKeyOpacity
                           fromValue:[self
                                         presentationValueForKeyPath:@"opacity"]
                             toValue:@(newViewProps.animateOpacity)
                              config:opacityConfig
                                loop:NO];
      }
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
        anyPropertyChanged = YES;
        // Determine which transform sub-properties changed for config selection
        int changedTransformMask = 0;
        if (oldViewProps.animateTranslateX != newViewProps.animateTranslateX)
          changedTransformMask |= kMaskTranslateX;
        if (oldViewProps.animateTranslateY != newViewProps.animateTranslateY)
          changedTransformMask |= kMaskTranslateY;
        if (oldViewProps.animateScaleX != newViewProps.animateScaleX)
          changedTransformMask |= kMaskScaleX;
        if (oldViewProps.animateScaleY != newViewProps.animateScaleY)
          changedTransformMask |= kMaskScaleY;
        if (oldViewProps.animateRotate != newViewProps.animateRotate)
          changedTransformMask |= kMaskRotate;
        if (oldViewProps.animateRotateX != newViewProps.animateRotateX)
          changedTransformMask |= kMaskRotateX;
        if (oldViewProps.animateRotateY != newViewProps.animateRotateY)
          changedTransformMask |= kMaskRotateY;

        std::string transformName =
            lowestTransformPropertyName(changedTransformMask);
        EaseTransitionConfig transformConfig =
            transitionConfigForProperty(transformName, newViewProps);

        if (transformConfig.type == "none") {
          self.layer.transform = [self targetTransformFromProps:newViewProps];
          [self.layer removeAnimationForKey:kAnimKeyTransform];
        } else {
          // Read "from" values from the presentation layer BEFORE setting
          // the new model transform. During an active animation, CA tracks
          // key-path values correctly. After completion, the model matrix
          // with m34 can't be reliably decomposed, so fall back to old props.
          BOOL isAnimating =
              [self.layer animationForKey:kAnimKeyTransformRotateY] != nil ||
              [self.layer animationForKey:kAnimKeyTransformRotateX] != nil ||
              [self.layer animationForKey:kAnimKeyTransformRotateZ] != nil ||
              [self.layer animationForKey:kAnimKeyTransformTransX] != nil ||
              [self.layer animationForKey:kAnimKeyTransformTransY] != nil ||
              [self.layer animationForKey:kAnimKeyTransformScaleX] != nil ||
              [self.layer animationForKey:kAnimKeyTransformScaleY] != nil;
          CGFloat fromTX, fromTY, fromSX, fromSY, fromR, fromRX, fromRY;
          if (isAnimating) {
            CALayer *pl = self.layer.presentationLayer ?: self.layer;
            fromTX =
                [[pl valueForKeyPath:@"transform.translation.x"] floatValue];
            fromTY =
                [[pl valueForKeyPath:@"transform.translation.y"] floatValue];
            fromSX = [[pl valueForKeyPath:@"transform.scale.x"] floatValue];
            fromSY = [[pl valueForKeyPath:@"transform.scale.y"] floatValue];
            fromR = [[pl valueForKeyPath:@"transform.rotation"] floatValue];
            fromRX = [[pl valueForKeyPath:@"transform.rotation.x"] floatValue];
            fromRY = [[pl valueForKeyPath:@"transform.rotation.y"] floatValue];
          } else {
            fromTX = oldViewProps.animateTranslateX;
            fromTY = oldViewProps.animateTranslateY;
            fromSX = oldViewProps.animateScaleX;
            fromSY = oldViewProps.animateScaleY;
            fromR = degreesToRadians(oldViewProps.animateRotate);
            fromRX = degreesToRadians(oldViewProps.animateRotateX);
            fromRY = degreesToRadians(oldViewProps.animateRotateY);
          }
          self.layer.transform = [self targetTransformFromProps:newViewProps];
          if (changedTransformMask & kMaskTranslateX) {
            [self applyAnimationForKeyPath:@"transform.translation.x"
                              animationKey:kAnimKeyTransformTransX
                                 fromValue:@(fromTX)
                                   toValue:@(newViewProps.animateTranslateX)
                                    config:transformConfig
                                      loop:NO];
          }
          if (changedTransformMask & kMaskTranslateY) {
            [self applyAnimationForKeyPath:@"transform.translation.y"
                              animationKey:kAnimKeyTransformTransY
                                 fromValue:@(fromTY)
                                   toValue:@(newViewProps.animateTranslateY)
                                    config:transformConfig
                                      loop:NO];
          }
          if (changedTransformMask & kMaskScaleX) {
            [self applyAnimationForKeyPath:@"transform.scale.x"
                              animationKey:kAnimKeyTransformScaleX
                                 fromValue:@(fromSX)
                                   toValue:@(newViewProps.animateScaleX)
                                    config:transformConfig
                                      loop:NO];
          }
          if (changedTransformMask & kMaskScaleY) {
            [self applyAnimationForKeyPath:@"transform.scale.y"
                              animationKey:kAnimKeyTransformScaleY
                                 fromValue:@(fromSY)
                                   toValue:@(newViewProps.animateScaleY)
                                    config:transformConfig
                                      loop:NO];
          }
          if (changedTransformMask & kMaskRotate) {
            [self applyAnimationForKeyPath:@"transform.rotation.z"
                              animationKey:kAnimKeyTransformRotateZ
                                 fromValue:@(fromR)
                                   toValue:@(degreesToRadians(
                                               newViewProps.animateRotate))
                                    config:transformConfig
                                      loop:NO];
          }
          if (changedTransformMask & kMaskRotateX) {
            [self applyAnimationForKeyPath:@"transform.rotation.x"
                              animationKey:kAnimKeyTransformRotateX
                                 fromValue:@(fromRX)
                                   toValue:@(degreesToRadians(
                                               newViewProps.animateRotateX))
                                    config:transformConfig
                                      loop:NO];
          }
          if (changedTransformMask & kMaskRotateY) {
            [self applyAnimationForKeyPath:@"transform.rotation.y"
                              animationKey:kAnimKeyTransformRotateY
                                 fromValue:@(fromRY)
                                   toValue:@(degreesToRadians(
                                               newViewProps.animateRotateY))
                                    config:transformConfig
                                      loop:NO];
          }
        }
      }
    }

    if ((mask & kMaskBorderRadius) &&
        oldViewProps.animateBorderRadius != newViewProps.animateBorderRadius) {
      anyPropertyChanged = YES;
      EaseTransitionConfig brConfig =
          transitionConfigForProperty("borderRadius", newViewProps);
      self.layer.cornerRadius = newViewProps.animateBorderRadius;
      self.layer.masksToBounds = newViewProps.animateBorderRadius > 0;
      if (brConfig.type == "none") {
        [self.layer removeAnimationForKey:kAnimKeyCornerRadius];
      } else {
        [self applyAnimationForKeyPath:@"cornerRadius"
                          animationKey:kAnimKeyCornerRadius
                             fromValue:[self presentationValueForKeyPath:
                                                 @"cornerRadius"]
                               toValue:@(newViewProps.animateBorderRadius)
                                config:brConfig
                                  loop:NO];
      }
    }

    if ((mask & kMaskBackgroundColor) &&
        oldViewProps.animateBackgroundColor !=
            newViewProps.animateBackgroundColor) {
      anyPropertyChanged = YES;
      EaseTransitionConfig bgConfig =
          transitionConfigForProperty("backgroundColor", newViewProps);
      CGColorRef toColor =
          RCTUIColorFromSharedColor(newViewProps.animateBackgroundColor)
              .CGColor;
      self.layer.backgroundColor = toColor;
      if (bgConfig.type == "none") {
        [self.layer removeAnimationForKey:kAnimKeyBackgroundColor];
      } else {
        CGColorRef fromColor = (__bridge CGColorRef)
            [self presentationValueForKeyPath:@"backgroundColor"];
        [self applyAnimationForKeyPath:@"backgroundColor"
                          animationKey:kAnimKeyBackgroundColor
                             fromValue:(__bridge id)fromColor
                               toValue:(__bridge id)toColor
                                config:bgConfig
                                  loop:NO];
      }
    }

    // If all changed properties resolved to 'none', no animations were queued.
    // Fire onTransitionEnd immediately.
    if (anyPropertyChanged && _pendingAnimationCount == 0 && _eventEmitter) {
      auto emitter =
          std::static_pointer_cast<const EaseViewEventEmitter>(_eventEmitter);
      emitter->onTransitionEnd(EaseViewEventEmitter::OnTransitionEnd{
          .finished = true,
      });
    }
  }

  [CATransaction commit];
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];
  (void)updateMask;

  [self tryApplyPendingFirstMountProps];
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  [self tryApplyPendingFirstMountProps];
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
  _hasPendingFirstMountUpdate = NO;
  _pendingAnimationCount = 0;
  _anyInterrupted = NO;
  _transformOriginX = 0.5;
  _transformOriginY = 0.5;
  _transformPerspective = 1280.0;
  self.layer.anchorPoint = CGPointMake(0.5, 0.5);
  self.layer.opacity = 1.0;
  self.layer.transform = CATransform3DIdentity;
  self.layer.cornerRadius = 0;
  self.layer.masksToBounds = NO;
  self.layer.backgroundColor = nil;
}

@end
