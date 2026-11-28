import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import {
  ANGLE_UNITS,
  LENGTH_UNITS,
  PERCENTAGE_UNIT,
  angle,
  isAngle,
  isAnglePercentage,
  isAngleUnit,
  isLength,
  isLengthPercentage,
  isLengthUnit,
  isPercentage,
  isPercentageUnit,
  length,
  percentage,
  type Angle,
  type AnglePercentage,
  type Length,
  type LengthPercentage,
  type Percentage,
  type StopPosition,
} from './units.ts';

describe('units', () => {
  it('constructs angle, length, and percentage values with unit information', () => {
    expect(angle(45)).toEqual({ value: 45, unit: 'deg' });
    expect(angle(0.25, 'turn')).toEqual({ value: 0.25, unit: 'turn' });
    expect(length(16)).toEqual({ value: 16, unit: 'px' });
    expect(length(2, 'rem')).toEqual({ value: 2, unit: 'rem' });
    expect(percentage(50)).toEqual({ value: 50, unit: '%' });
  });

  it('validates unit tags via unit type guards', () => {
    for (const unit of ANGLE_UNITS) {
      expect(isAngleUnit(unit)).toBe(true);
      expect(isLengthUnit(unit)).toBe(false);
      expect(isPercentageUnit(unit)).toBe(false);
    }

    for (const unit of LENGTH_UNITS) {
      expect(isLengthUnit(unit)).toBe(true);
      expect(isAngleUnit(unit)).toBe(false);
      expect(isPercentageUnit(unit)).toBe(false);
    }

    expect(isPercentageUnit(PERCENTAGE_UNIT)).toBe(true);
    expect(isAngleUnit('%')).toBe(false);
    expect(isLengthUnit('%')).toBe(false);

    expect(isAngleUnit('px')).toBe(false);
    expect(isAngleUnit(45)).toBe(false);
    expect(isLengthUnit('deg')).toBe(false);
    expect(isLengthUnit(null)).toBe(false);
    expect(isPercentageUnit('percent')).toBe(false);
  });

  it('narrows StopPosition values by unit tag without validating numeric ranges', () => {
    const a: StopPosition = angle(720, 'deg');
    const l: StopPosition = length(-24, 'px');
    const p: StopPosition = percentage(150);

    expect(isAngle(a)).toBe(true);
    expect(isLength(a)).toBe(false);
    expect(isPercentage(a)).toBe(false);
    expect(isAnglePercentage(a)).toBe(true);
    expect(isLengthPercentage(a)).toBe(false);

    expect(isLength(l)).toBe(true);
    expect(isAngle(l)).toBe(false);
    expect(isPercentage(l)).toBe(false);
    expect(isLengthPercentage(l)).toBe(true);
    expect(isAnglePercentage(l)).toBe(false);

    expect(isPercentage(p)).toBe(true);
    expect(isAngle(p)).toBe(false);
    expect(isLength(p)).toBe(false);
    expect(isLengthPercentage(p)).toBe(true);
    expect(isAnglePercentage(p)).toBe(true);

    const assertNarrowing = (value: StopPosition) => {
      if (isAngle(value)) {
        expectTypeOf(value).toEqualTypeOf<Angle>();
      }
      if (isLength(value)) {
        expectTypeOf(value).toEqualTypeOf<Length>();
      }
      if (isPercentage(value)) {
        expectTypeOf(value).toEqualTypeOf<Percentage>();
      }
      if (isLengthPercentage(value)) {
        expectTypeOf(value).toEqualTypeOf<LengthPercentage>();
      }
      if (isAnglePercentage(value)) {
        expectTypeOf(value).toEqualTypeOf<AnglePercentage>();
      }
    };
    assertNarrowing(a);
    assertNarrowing(l);
    assertNarrowing(p);
  });
});
