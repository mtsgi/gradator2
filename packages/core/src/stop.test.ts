import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { hsl, srgb } from './color.ts';
import {
  GRADIENT_STOP_KINDS,
  createColorHint,
  createColorStop,
  isColorHint,
  isColorStop,
  type ColorHint,
  type ColorStop,
  type ConicGradientStop,
  type CreateColorStopInput,
  type GradientStop,
  type LinearGradientStop,
  type RadialGradientStop,
} from './stop.ts';
import {
  angle,
  length,
  percentage,
  type Angle,
  type Length,
  type LengthPercentage,
  type Percentage,
} from './units.ts';

describe('stop', () => {
  it('constructs color stops with and without position, and color hints', () => {
    const autoStop = createColorStop({ id: 'stop-1', color: srgb(255, 0, 0) });
    expect(autoStop).toEqual({
      kind: 'color',
      id: 'stop-1',
      color: { space: 'srgb', r: 255, g: 0, b: 0, alpha: 1 },
    });
    expect('position' in autoStop).toBe(false);

    const percentStop = createColorStop({
      id: 'stop-2',
      color: hsl(200, 100, 50),
      position: percentage(50),
    });
    expect(percentStop).toEqual({
      kind: 'color',
      id: 'stop-2',
      color: { space: 'hsl', h: 200, s: 100, l: 50, alpha: 1 },
      position: { value: 50, unit: '%' },
    });

    const hint = createColorHint({ id: 'hint-1', position: percentage(30) });
    expect(hint).toEqual({
      kind: 'hint',
      id: 'hint-1',
      position: { value: 30, unit: '%' },
    });

    expect(GRADIENT_STOP_KINDS).toEqual(['color', 'hint']);
  });

  it('infers position-omitted color stops as assignable to linear, radial, and conic stops', () => {
    const autoStop = createColorStop({ id: 'auto', color: srgb(0, 0, 0) });
    expectTypeOf(autoStop).toEqualTypeOf<ColorStop<never>>();
    expectTypeOf(autoStop).toExtend<LinearGradientStop>();
    expectTypeOf(autoStop).toExtend<RadialGradientStop>();
    expectTypeOf(autoStop).toExtend<ConicGradientStop>();
    expectTypeOf(autoStop).toExtend<GradientStop>();

    const percentStop = createColorStop({
      id: 'pct',
      color: srgb(0, 0, 0),
      position: percentage(25),
    });
    expectTypeOf(percentStop).toEqualTypeOf<ColorStop<Percentage>>();
    expectTypeOf(percentStop).toExtend<LinearGradientStop>();
    expectTypeOf(percentStop).toExtend<ConicGradientStop>();

    const lengthStop = createColorStop({
      id: 'len',
      color: srgb(0, 0, 0),
      position: length(16, 'px'),
    });
    expectTypeOf(lengthStop).toEqualTypeOf<ColorStop<Length>>();
    expectTypeOf(lengthStop).toExtend<LinearGradientStop>();
    expectTypeOf(lengthStop).not.toExtend<ConicGradientStop>();

    const angleStop = createColorStop({
      id: 'ang',
      color: srgb(0, 0, 0),
      position: angle(90, 'deg'),
    });
    expectTypeOf(angleStop).toEqualTypeOf<ColorStop<Angle>>();
    expectTypeOf(angleStop).toExtend<ConicGradientStop>();
    expectTypeOf(angleStop).not.toExtend<LinearGradientStop>();

    const fromUnionInput = (input: CreateColorStopInput<LengthPercentage>) =>
      createColorStop(input);
    const unionStop = fromUnionInput({
      id: 'union',
      color: srgb(255, 255, 255),
    });
    expectTypeOf(unionStop).toEqualTypeOf<ColorStop<LengthPercentage>>();
    expect('position' in unionStop).toBe(false);
  });

  it('narrows GradientStop union while preserving position type parameter', () => {
    const linearStops: readonly LinearGradientStop[] = [
      createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) }),
      createColorHint({ id: 'h1', position: length(40, 'px') }),
    ];

    const first = linearStops[0];
    const second = linearStops[1];

    expect(isColorStop(first)).toBe(true);
    expect(isColorHint(first)).toBe(false);
    expect(isColorHint(second)).toBe(true);
    expect(isColorStop(second)).toBe(false);

    if (isColorStop(first)) {
      expectTypeOf(first).toEqualTypeOf<ColorStop<LengthPercentage>>();
    }
    if (isColorHint(second)) {
      expectTypeOf(second).toEqualTypeOf<ColorHint<LengthPercentage>>();
    }
  });
});
