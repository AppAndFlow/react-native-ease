import { render, screen } from '@testing-library/react-native';
import { EaseText } from '../EaseText';

function getTextColor(text: ReturnType<typeof screen.getByText>) {
  const flatStyle = Array.isArray(text.props.style)
    ? Object.assign({}, ...text.props.style.filter(Boolean))
    : text.props.style;
  return flatStyle?.color;
}

describe('EaseText', () => {
  describe('interpolateColor', () => {
    it('applies interpolateColor to Text style', () => {
      render(<EaseText interpolateColor="#ff0000">Hello</EaseText>);
      const text = screen.getByText('Hello');
      expect(getTextColor(text)).toBe('#ff0000');
    });

    it('merges interpolateColor with existing style', () => {
      render(
        <EaseText
          interpolateColor="#ff0000"
          style={{ fontSize: 16, fontWeight: '600' }}
        >
          Hello
        </EaseText>,
      );
      const text = screen.getByText('Hello');
      const flatStyle = Array.isArray(text.props.style)
        ? Object.assign({}, ...text.props.style.filter(Boolean))
        : text.props.style;
      expect(getTextColor(text)).toBe('#ff0000');
      expect(flatStyle.fontSize).toBe(16);
      expect(flatStyle.fontWeight).toBe('600');
    });

    it('does not apply the target color immediately when color is omitted from a transition map', () => {
      render(
        <EaseText
          interpolateColor="#ffffff"
          initialInterpolateColor="#000000"
          transition={{ transform: { type: 'spring' } }}
        >
          Hello
        </EaseText>,
      );

      const text = screen.getByText('Hello');
      expect(getTextColor(text)).toBe('#000000');
    });

    it('does not override style when interpolateColor is not set', () => {
      render(
        <EaseText style={{ fontSize: 16, color: '#000' }}>Hello</EaseText>,
      );
      const text = screen.getByText('Hello');
      expect(text.props.style).toEqual({ fontSize: 16, color: '#000' });
    });
  });

  describe('text props passthrough', () => {
    it('passes numberOfLines and ellipsizeMode to Text', () => {
      render(
        <EaseText numberOfLines={1} ellipsizeMode="tail">
          Hello
        </EaseText>,
      );
      const text = screen.getByText('Hello');
      expect(text.props.numberOfLines).toBe(1);
      expect(text.props.ellipsizeMode).toBe('tail');
    });

    it('passes style to Text', () => {
      render(
        <EaseText style={{ fontSize: 16, fontWeight: '600' }}>Hello</EaseText>,
      );
      const text = screen.getByText('Hello');
      expect(text.props.style).toEqual({ fontSize: 16, fontWeight: '600' });
    });

    it('renders children as text', () => {
      render(<EaseText>Hello World</EaseText>);
      expect(screen.getByText('Hello World')).toBeTruthy();
    });
  });

  describe('EaseView wrapper', () => {
    it('renders text inside a view hierarchy', () => {
      render(
        <EaseText animate={{ opacity: 0.5, translateX: 100 }}>Hello</EaseText>,
      );
      const text = screen.getByText('Hello');
      expect(text).toBeTruthy();
      expect(text.parent).toBeTruthy();
    });
  });
});
