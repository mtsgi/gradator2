export const ANGLE_UNITS = ['deg', 'rad', 'grad', 'turn'] as const;

export type AngleUnit = (typeof ANGLE_UNITS)[number];

export const LENGTH_UNITS = [
  'px',
  'em',
  'rem',
  'vw',
  'vh',
  'vmin',
  'vmax',
  'cm',
  'mm',
  'in',
  'pt',
  'pc',
] as const;

export type LengthUnit = (typeof LENGTH_UNITS)[number];

export const PERCENTAGE_UNIT = '%' as const;

export type PercentageUnit = typeof PERCENTAGE_UNIT;

export interface Angle {
  readonly value: number;
  readonly unit: AngleUnit;
}

export interface Length {
  readonly value: number;
  readonly unit: LengthUnit;
}

export interface Percentage {
  readonly value: number;
  readonly unit: PercentageUnit;
}

export type LengthPercentage = Length | Percentage;

export type AnglePercentage = Angle | Percentage;

export type StopPosition = Length | Percentage | Angle;

const ANGLE_UNIT_SET: ReadonlySet<string> = new Set<string>(ANGLE_UNITS);
const LENGTH_UNIT_SET: ReadonlySet<string> = new Set<string>(LENGTH_UNITS);

export function isAngleUnit(value: unknown): value is AngleUnit {
  return typeof value === 'string' && ANGLE_UNIT_SET.has(value);
}

export function isLengthUnit(value: unknown): value is LengthUnit {
  return typeof value === 'string' && LENGTH_UNIT_SET.has(value);
}

export function isPercentageUnit(value: unknown): value is PercentageUnit {
  return value === PERCENTAGE_UNIT;
}

export function isAngle(value: StopPosition): value is Angle {
  return isAngleUnit(value.unit);
}

export function isLength(value: StopPosition): value is Length {
  return isLengthUnit(value.unit);
}

export function isPercentage(value: StopPosition): value is Percentage {
  return isPercentageUnit(value.unit);
}

export function isLengthPercentage(value: StopPosition): value is LengthPercentage {
  return isLength(value) || isPercentage(value);
}

export function isAnglePercentage(value: StopPosition): value is AnglePercentage {
  return isAngle(value) || isPercentage(value);
}

export function angle(value: number, unit: AngleUnit = 'deg'): Angle {
  return { value, unit };
}

export function length(value: number, unit: LengthUnit = 'px'): Length {
  return { value, unit };
}

export function percentage(value: number): Percentage {
  return { value, unit: PERCENTAGE_UNIT };
}
