import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EaseView } from '../EaseView';

// The native component is mocked by react-native's jest preset as a host View.
// We inspect the props passed to it to verify JS-level resolution.

function getNativeProps() {
  // The NativeEaseView renders as a plain <View> in tests.
  // Access props via the testID on the wrapper.
  const view = screen.getByTestId('ease');
  return view.props;
}

describe('EaseView', () => {
  describe('animate prop resolution', () => {
    it('applies identity defaults when animate is empty', () => {
      render(<EaseView testID="ease" />);
      const props = getNativeProps();
      expect(props.animateOpacity).toBe(1);
      expect(props.animateTranslateX).toBe(0);
      expect(props.animateTranslateY).toBe(0);
      expect(props.animateScaleX).toBe(1);
      expect(props.animateScaleY).toBe(1);
      expect(props.animateRotate).toBe(0);
      expect(props.animateRotateX).toBe(0);
      expect(props.animateRotateY).toBe(0);
    });

    it('passes through animate values', () => {
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5, translateX: 100, scale: 2 }}
        />,
      );
      const props = getNativeProps();
      expect(props.animateOpacity).toBe(0.5);
      expect(props.animateTranslateX).toBe(100);
      expect(props.animateScaleX).toBe(2);
      expect(props.animateScaleY).toBe(2);
      // Unspecified properties stay at identity
      expect(props.animateTranslateY).toBe(0);
      expect(props.animateRotate).toBe(0);
    });

    it('resolves scale shorthand to scaleX and scaleY', () => {
      render(<EaseView testID="ease" animate={{ scale: 1.5 }} />);
      const props = getNativeProps();
      expect(props.animateScaleX).toBe(1.5);
      expect(props.animateScaleY).toBe(1.5);
    });

    it('allows scaleX/scaleY to override scale', () => {
      render(<EaseView testID="ease" animate={{ scale: 1.2, scaleX: 0.5 }} />);
      const props = getNativeProps();
      expect(props.animateScaleX).toBe(0.5);
      expect(props.animateScaleY).toBe(1.2);
    });

    it('passes rotateX and rotateY', () => {
      render(<EaseView testID="ease" animate={{ rotateX: 45, rotateY: 90 }} />);
      const props = getNativeProps();
      expect(props.animateRotateX).toBe(45);
      expect(props.animateRotateY).toBe(90);
    });

    it('sets animatedProperties bitmask for animated keys only', () => {
      render(
        <EaseView testID="ease" animate={{ opacity: 0.5, translateX: 100 }} />,
      );
      const props = getNativeProps();
      // opacity = 1<<0 = 1, translateX = 1<<1 = 2 → 3
      expect(props.animatedProperties).toBe(3);
    });

    it('sets animatedProperties to 0 when animate is empty', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animatedProperties).toBe(0);
    });

    it('includes scale shorthand in bitmask as scaleX + scaleY', () => {
      render(<EaseView testID="ease" animate={{ scale: 2 }} />);
      // scaleX = 1<<3 = 8, scaleY = 1<<4 = 16 → 24
      expect(getNativeProps().animatedProperties).toBe(24);
    });
  });

  describe('initialAnimate resolution', () => {
    it('falls back to animate when initialAnimate is not set', () => {
      render(
        <EaseView testID="ease" animate={{ opacity: 0.5, translateY: 50 }} />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateOpacity).toBe(0.5);
      expect(props.initialAnimateTranslateY).toBe(50);
    });

    it('uses initialAnimate when provided', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ opacity: 0, translateY: 100 }}
          animate={{ opacity: 1, translateY: 0 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateOpacity).toBe(0);
      expect(props.initialAnimateTranslateY).toBe(100);
      expect(props.animateOpacity).toBe(1);
      expect(props.animateTranslateY).toBe(0);
    });

    it('fills identity values for unspecified initialAnimate properties', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ opacity: 0 }}
          animate={{ opacity: 1, scale: 2 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateOpacity).toBe(0);
      expect(props.initialAnimateScaleX).toBe(1);
      expect(props.initialAnimateScaleY).toBe(1);
    });
  });

  describe('transition defaults', () => {
    it('defaults to timing with standard values', () => {
      render(<EaseView testID="ease" />);
      const props = getNativeProps();
      expect(props.transitionType).toBe('timing');
      expect(props.transitionDuration).toBe(300);
      expect(props.transitionEasingBezier).toEqual([0.42, 0, 0.58, 1]);
      expect(props.transitionLoop).toBe('none');
    });

    it('resolves timing transition props', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            duration: 500,
            easing: 'linear',
            loop: 'reverse',
          }}
        />,
      );
      const props = getNativeProps();
      expect(props.transitionType).toBe('timing');
      expect(props.transitionDuration).toBe(500);
      expect(props.transitionEasingBezier).toEqual([0, 0, 1, 1]);
      expect(props.transitionLoop).toBe('reverse');
    });

    it('resolves spring transition props with timing defaults for unused fields', () => {
      render(
        <EaseView
          testID="ease"
          transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 2 }}
        />,
      );
      const props = getNativeProps();
      expect(props.transitionType).toBe('spring');
      expect(props.transitionDamping).toBe(20);
      expect(props.transitionStiffness).toBe(200);
      expect(props.transitionMass).toBe(2);
      // Timing-specific fields get defaults (easeInOut bezier)
      expect(props.transitionDuration).toBe(300);
      expect(props.transitionEasingBezier).toEqual([0.42, 0, 0.58, 1]);
      expect(props.transitionLoop).toBe('none');
    });

    it('uses spring defaults when only type is specified', () => {
      render(<EaseView testID="ease" transition={{ type: 'spring' }} />);
      const props = getNativeProps();
      expect(props.transitionDamping).toBe(15);
      expect(props.transitionStiffness).toBe(120);
      expect(props.transitionMass).toBe(1);
    });

    it('passes none transition type', () => {
      render(<EaseView testID="ease" transition={{ type: 'none' }} />);
      expect(getNativeProps().transitionType).toBe('none');
    });

    it('passes custom cubic bezier control points', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            duration: 400,
            easing: [0.25, 0.1, 0.25, 1.0],
          }}
        />,
      );
      const props = getNativeProps();
      expect(props.transitionEasingBezier).toEqual([0.25, 0.1, 0.25, 1.0]);
    });

    it('warns for invalid array length', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            easing: [0.25, 0.1, 0.25] as any,
          }}
        />,
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[x1, y1, x2, y2] tuple'),
      );
      spy.mockRestore();
    });

    it('warns for x-values outside 0-1', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            easing: [1.5, 0, 0.58, 1],
          }}
        />,
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('x-values (x1, x2) must be between 0 and 1'),
      );
      spy.mockRestore();
    });
  });

  describe('useHardwareLayer', () => {
    it('defaults to false', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().useHardwareLayer).toBe(false);
    });

    it('can be enabled', () => {
      render(<EaseView testID="ease" useHardwareLayer />);
      expect(getNativeProps().useHardwareLayer).toBe(true);
    });
  });

  describe('children and style', () => {
    it('renders children', () => {
      render(
        <EaseView testID="ease">
          <Text>Hello</Text>
        </EaseView>,
      );
      expect(screen.getByText('Hello')).toBeTruthy();
    });

    it('passes style through', () => {
      render(
        <EaseView
          testID="ease"
          style={{ backgroundColor: 'red', borderRadius: 8 }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red', borderRadius: 8 }),
      );
    });
  });

  describe('animate borderRadius', () => {
    it('passes animateBorderRadius to native', () => {
      render(<EaseView testID="ease" animate={{ borderRadius: 16 }} />);
      expect(getNativeProps().animateBorderRadius).toBe(16);
    });

    it('defaults animateBorderRadius to 0 when not in animate', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateBorderRadius).toBe(0);
    });

    it('sets bitmask for borderRadius (1 << 8 = 256)', () => {
      render(<EaseView testID="ease" animate={{ borderRadius: 16 }} />);
      // borderRadius = 1<<8 = 256
      expect(getNativeProps().animatedProperties).toBe(256);
    });

    it('strips style borderRadius when animate.borderRadius is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ borderRadius: 16 }}
          style={{ borderRadius: 8, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red' }),
      );
      expect(props.style.borderRadius).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('borderRadius found in both style and animate'),
      );
      spy.mockRestore();
    });

    it('keeps style borderRadius when not in animate', () => {
      render(
        <EaseView
          testID="ease"
          style={{ borderRadius: 8, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ borderRadius: 8, backgroundColor: 'red' }),
      );
    });

    it('passes initialAnimateBorderRadius', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ borderRadius: 0 }}
          animate={{ borderRadius: 16 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateBorderRadius).toBe(0);
      expect(props.animateBorderRadius).toBe(16);
    });
  });

  describe('animate backgroundColor', () => {
    it('passes color value to native', () => {
      render(<EaseView testID="ease" animate={{ backgroundColor: 'red' }} />);
      const props = getNativeProps();
      expect(props.animateBackgroundColor).toBe('red');
    });

    it('defaults animateBackgroundColor to transparent when not in animate', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateBackgroundColor).toBe('transparent');
    });

    it('sets bitmask for backgroundColor (1 << 9 = 512)', () => {
      render(<EaseView testID="ease" animate={{ backgroundColor: 'blue' }} />);
      expect(getNativeProps().animatedProperties).toBe(512);
    });

    it('strips style backgroundColor when animate.backgroundColor is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ backgroundColor: 'red' }}
          style={{ backgroundColor: 'blue', borderRadius: 8 }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(expect.objectContaining({ borderRadius: 8 }));
      expect(props.style.backgroundColor).toBeUndefined();
      spy.mockRestore();
    });

    it('keeps style backgroundColor when not in animate', () => {
      render(
        <EaseView
          testID="ease"
          style={{ backgroundColor: 'blue', borderRadius: 8 }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'blue', borderRadius: 8 }),
      );
    });

    it('passes initialAnimateBackgroundColor as ColorValue', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ backgroundColor: 'green' }}
          animate={{ backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateBackgroundColor).toBe('green');
      expect(props.animateBackgroundColor).toBe('red');
    });

    it('falls back initialAnimateBackgroundColor to animate value when no initialAnimate', () => {
      render(<EaseView testID="ease" animate={{ backgroundColor: 'red' }} />);
      const props = getNativeProps();
      expect(props.initialAnimateBackgroundColor).toBe('red');
    });
  });

  describe('style conflict handling', () => {
    it('warns when opacity is in both style and animate', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5 }}
          style={{ opacity: 1, backgroundColor: 'blue' }}
        />,
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('opacity found in both style and animate'),
      );
      spy.mockRestore();
    });

    it('strips conflicting style keys, keeps non-conflicting', () => {
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5 }}
          style={{ opacity: 1, backgroundColor: 'blue' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'blue' }),
      );
      expect(props.style.opacity).toBeUndefined();
    });

    it('does not warn when there is no conflict', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5 }}
          style={{ backgroundColor: 'red' }}
        />,
      );
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('allows opacity in style when not animated', () => {
      render(
        <EaseView
          testID="ease"
          style={{ opacity: 0.5, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ opacity: 0.5, backgroundColor: 'red' }),
      );
    });
  });
});
