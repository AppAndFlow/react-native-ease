import { useEffect, useRef, useState } from 'react';
import { processColor } from 'react-native';
import type { SingleTransition, Transition } from './types';

type RGBA = [number, number, number, number];

/** Parse a React Native color to RGBA components (0–255, alpha 0–1). */
function parseColor(color: unknown): RGBA | null {
  const processed = processColor(color as string);
  if (processed == null || typeof processed !== 'number') return null;
  /* eslint-disable no-bitwise */
  const a = ((processed >>> 24) & 0xff) / 255;
  const r = (processed >> 16) & 0xff;
  const g = (processed >> 8) & 0xff;
  const b = processed & 0xff;
  /* eslint-enable no-bitwise */
  return [r, g, b, a];
}

/** Convert RGBA to hex string. */
function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const ri = Math.round(r);
  const gi = Math.round(g);
  const bi = Math.round(b);
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  if (a < 1) {
    return `#${hex(ri)}${hex(gi)}${hex(bi)}${hex(Math.round(a * 255))}`;
  }
  return `#${hex(ri)}${hex(gi)}${hex(bi)}`;
}

/** Built-in easing functions. */
const easings: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - (1 - t) ** 3,
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
};

/** Resolve the color transition config. Follows the same logic as EaseView:
 * color category → default fallback. No transition = instant. */
function resolveColorConfig(transition?: Transition): {
  duration: number;
  easing: (t: number) => number;
  delay: number;
} {
  const defaults = { duration: 300, easing: easings.easeInOut!, delay: 0 };

  if (transition == null) return defaults;

  let config: SingleTransition | undefined;
  if ('type' in transition) {
    config = transition;
  } else {
    config = transition.color ?? transition.default;
  }

  if (!config || config.type === 'none') {
    return { duration: 0, easing: easings.linear!, delay: 0 };
  }

  if (config.type === 'spring') {
    // Approximate spring as 500ms easeOut — real spring physics for a color
    // interpolation on the JS thread isn't worth the complexity.
    return {
      duration: 500,
      easing: easings.easeOut!,
      delay: config.delay ?? 0,
    };
  }

  return {
    duration: config.duration ?? 300,
    easing:
      typeof config.easing === 'string'
        ? easings[config.easing] ?? easings.easeInOut!
        : easings.easeInOut!,
    delay: config.delay ?? 0,
  };
}

/**
 * Interpolates a color value over time using requestAnimationFrame.
 * Respects the `color` or `default` key from the transition config.
 *
 * On first render, `initialColor` is displayed immediately and will animate
 * to `targetColor` if it differs. Subsequent changes to `targetColor` animate
 * from the current displayed color. `transition` updates take effect on the
 * next color change.
 */
export function useColorTransition(
  targetColor: unknown,
  transition?: Transition,
  initialColor?: unknown,
): string | undefined {
  const { duration, easing, delay } = resolveColorConfig(transition);

  const initialColorRef = useRef(initialColor);
  const currentRGBA = useRef<RGBA | null>(null);
  const animRef = useRef<{ rafId: number; id: number } | null>(null);
  const batchId = useRef(0);
  const isFirstRender = useRef(true);

  const [displayColor, setDisplayColor] = useState<string | undefined>(() => {
    const startColor = initialColorRef.current ?? targetColor;
    if (startColor == null) return undefined;
    const parsed = parseColor(startColor);
    if (!parsed) return undefined;
    currentRGBA.current = parsed;
    return rgbaToHex(...parsed);
  });

  useEffect(() => {
    if (targetColor == null) {
      currentRGBA.current = null;
      setDisplayColor(undefined);
      return;
    }

    const toRGBA = parseColor(targetColor);
    if (!toRGBA) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const fromRGBA = currentRGBA.current;

      if (
        !fromRGBA ||
        (fromRGBA[0] === toRGBA[0] &&
          fromRGBA[1] === toRGBA[1] &&
          fromRGBA[2] === toRGBA[2] &&
          fromRGBA[3] === toRGBA[3])
      ) {
        currentRGBA.current = toRGBA;
        setDisplayColor(rgbaToHex(...toRGBA));
        return;
      }
    }

    const fromRGBA = currentRGBA.current ?? toRGBA;

    if (animRef.current) {
      cancelAnimationFrame(animRef.current.rafId);
      animRef.current = null;
    }

    if (duration === 0) {
      currentRGBA.current = toRGBA;
      setDisplayColor(rgbaToHex(...toRGBA));
      return;
    }

    batchId.current++;
    const thisBatch = batchId.current;
    const startTime = performance.now() + delay;

    const tick = (now: number) => {
      if (batchId.current !== thisBatch) return;

      const elapsed = now - startTime;
      if (elapsed < 0) {
        animRef.current = { rafId: requestAnimationFrame(tick), id: thisBatch };
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const t = easing(progress);

      const r = fromRGBA[0] + (toRGBA[0] - fromRGBA[0]) * t;
      const g = fromRGBA[1] + (toRGBA[1] - fromRGBA[1]) * t;
      const b = fromRGBA[2] + (toRGBA[2] - fromRGBA[2]) * t;
      const a = fromRGBA[3] + (toRGBA[3] - fromRGBA[3]) * t;

      const current: RGBA = [r, g, b, a];
      currentRGBA.current = current;
      setDisplayColor(rgbaToHex(...current));

      if (progress < 1) {
        animRef.current = { rafId: requestAnimationFrame(tick), id: thisBatch };
      } else {
        animRef.current = null;
      }
    };

    animRef.current = { rafId: requestAnimationFrame(tick), id: thisBatch };

    return () => {
      if (animRef.current?.id === thisBatch) {
        cancelAnimationFrame(animRef.current.rafId);
        animRef.current = null;
      }
    };
  }, [targetColor, duration, easing, delay]);

  return displayColor;
}
