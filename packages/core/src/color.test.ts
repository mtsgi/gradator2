import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import {
  COLOR_SPACES,
  hsl,
  isColorSpace,
  isHslColor,
  isSrgbColor,
  srgb,
  type Color,
  type HslColor,
  type SrgbColor,
} from './color.ts';

describe('color', () => {
  it('constructs srgb and hsl colors with default and explicit alpha', () => {
    expect(srgb(255, 128, 0)).toEqual({ space: 'srgb', r: 255, g: 128, b: 0, alpha: 1 });
    expect(srgb(10, 20, 30, 0.5)).toEqual({ space: 'srgb', r: 10, g: 20, b: 30, alpha: 0.5 });

    expect(hsl(210, 80, 50)).toEqual({ space: 'hsl', h: 210, s: 80, l: 50, alpha: 1 });
    expect(hsl(120, 60, 40, 0.25)).toEqual({ space: 'hsl', h: 120, s: 60, l: 40, alpha: 0.25 });
  });

  it('checks supported color space names', () => {
    for (const space of COLOR_SPACES) {
      expect(isColorSpace(space)).toBe(true);
    }
    expect(isColorSpace('oklch')).toBe(false);
    expect(isColorSpace(123)).toBe(false);
  });

  it('narrows Color union by space discriminant without clamping or range checking', () => {
    const rgbColor: Color = srgb(300, -10, 0, 1.5);
    const hslColor: Color = hsl(400, 120, -5, -0.2);

    expect(isSrgbColor(rgbColor)).toBe(true);
    expect(isHslColor(rgbColor)).toBe(false);
    expect(isHslColor(hslColor)).toBe(true);
    expect(isSrgbColor(hslColor)).toBe(false);

    expect(rgbColor).toEqual({ space: 'srgb', r: 300, g: -10, b: 0, alpha: 1.5 });
    expect(hslColor).toEqual({ space: 'hsl', h: 400, s: 120, l: -5, alpha: -0.2 });

    const assertNarrowing = (color: Color) => {
      if (isSrgbColor(color)) {
        expectTypeOf(color).toEqualTypeOf<SrgbColor>();
      }
      if (isHslColor(color)) {
        expectTypeOf(color).toEqualTypeOf<HslColor>();
      }
    };
    assertNarrowing(rgbColor);
    assertNarrowing(hslColor);
  });
});
