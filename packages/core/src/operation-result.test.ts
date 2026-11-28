import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { srgb } from './color.ts';
import {
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
  type CircleRadialGradient,
  type ConicGradient,
  type EllipseRadialGradient,
  type Gradient,
  type LinearGradient,
  type RadialGradient,
  type UnspecifiedShapeRadialGradient,
} from './gradient.ts';
import { createOperationFailure, createOperationSuccess } from './operation-internal.ts';
import {
  GRADIENT_OPERATION_ERROR_CODES,
  isGradientOperationFailure,
  isGradientOperationSuccess,
  type GradientOperationFailure,
  type GradientOperationResult,
  type GradientOperationSuccess,
  type GradientVariantOf,
} from './operation-result.ts';
import { createColorStop } from './stop.ts';
import { percentage } from './units.ts';

describe('operation-result', () => {
  it('exposes all operation error codes and narrows success/failure results', () => {
    expect(GRADIENT_OPERATION_ERROR_CODES).toEqual([
      'STOP_NOT_FOUND',
      'DUPLICATE_STOP_ID',
      'INVALID_STOP_ID',
      'INVALID_STOP_INDEX',
      'INVALID_STOP_PATCH',
      'INCOMPATIBLE_STOP_POSITION',
      'INVALID_GEOMETRY',
    ]);

    const linear = createLinearGradient({
      id: 'g1',
      stops: [createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) })],
    });

    const success: GradientOperationResult<LinearGradient> = createOperationSuccess(linear);
    const failure: GradientOperationResult<LinearGradient> = createOperationFailure(
      'STOP_NOT_FOUND',
      'Stop not found',
      { stopId: 'missing' },
    );

    expect(isGradientOperationSuccess(success)).toBe(true);
    expect(isGradientOperationFailure(success)).toBe(false);
    expect(isGradientOperationSuccess(failure)).toBe(false);
    expect(isGradientOperationFailure(failure)).toBe(true);

    const checkNarrowing = (result: GradientOperationResult<LinearGradient>) => {
      if (isGradientOperationSuccess(result)) {
        expectTypeOf(result).toEqualTypeOf<GradientOperationSuccess<LinearGradient>>();
        return result.gradient;
      }
      if (isGradientOperationFailure(result)) {
        expectTypeOf(result).toEqualTypeOf<GradientOperationFailure>();
        return result.error;
      }
      return undefined;
    };

    expect(checkNarrowing(success)).toBe(linear);
    const error = checkNarrowing(failure);
    expect(error).toEqual({
      code: 'STOP_NOT_FOUND',
      message: 'Stop not found',
      stopId: 'missing',
    });
    expect(error !== undefined && 'index' in error).toBe(false);
  });

  it('normalizes literal and tuple gradient inputs while preserving gradient kind and radial shape branches', () => {
    const constLinear = {
      kind: 'linear',
      id: 'lin-const',
      repeating: false,
      stops: [
        {
          kind: 'color',
          id: 's1',
          color: { space: 'srgb', r: 255, g: 0, b: 0, alpha: 1 },
          position: { value: 0, unit: '%' },
        },
      ],
    } as const;

    const constCircle = {
      kind: 'radial',
      id: 'rad-circle-const',
      repeating: false,
      shape: 'circle',
      size: { kind: 'length', radius: { value: 40, unit: 'px' } },
      stops: [],
    } as const;

    const constEllipse = {
      kind: 'radial',
      id: 'rad-ellipse-const',
      repeating: true,
      shape: 'ellipse',
      stops: [],
    } as const;

    const constUnspecified = {
      kind: 'radial',
      id: 'rad-unspecified-const',
      repeating: false,
      stops: [],
    } as const;

    const constConic = {
      kind: 'conic',
      id: 'conic-const',
      repeating: false,
      stops: [],
    } as const;

    expectTypeOf<GradientVariantOf<typeof constLinear>>().toEqualTypeOf<LinearGradient>();
    expectTypeOf<GradientVariantOf<typeof constCircle>>().toEqualTypeOf<CircleRadialGradient>();
    expectTypeOf<GradientVariantOf<typeof constEllipse>>().toEqualTypeOf<EllipseRadialGradient>();
    expectTypeOf<
      GradientVariantOf<typeof constUnspecified>
    >().toEqualTypeOf<UnspecifiedShapeRadialGradient>();
    expectTypeOf<GradientVariantOf<typeof constConic>>().toEqualTypeOf<ConicGradient>();
    expectTypeOf<GradientVariantOf<RadialGradient>>().toEqualTypeOf<RadialGradient>();
    expectTypeOf<GradientVariantOf<Gradient>>().toEqualTypeOf<Gradient>();
    expectTypeOf<GradientVariantOf<typeof constLinear | typeof constConic>>().toEqualTypeOf<
      LinearGradient | ConicGradient
    >();

    const runtimeLinear = createLinearGradient({ id: 'l', stops: [] });
    const runtimeRadial = createRadialGradient({ id: 'r', shape: 'circle', stops: [] });
    const runtimeConic = createConicGradient({ id: 'c', stops: [] });
    expect([runtimeLinear.kind, runtimeRadial.kind, runtimeConic.kind]).toEqual([
      'linear',
      'radial',
      'conic',
    ]);
  });
});
