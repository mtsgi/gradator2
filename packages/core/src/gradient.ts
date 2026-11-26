import type { GradientPosition } from './position.ts';
import type {
  ConicGradientStop,
  GradientStop,
  LinearGradientStop,
  RadialGradientStop,
} from './stop.ts';
import type { Angle, Length, LengthPercentage } from './units.ts';

export const GRADIENT_KINDS = ['linear', 'radial', 'conic'] as const;

export type GradientKind = (typeof GRADIENT_KINDS)[number];

export const LINEAR_SIDE_OR_CORNERS = [
  'top',
  'right',
  'bottom',
  'left',
  'top left',
  'top right',
  'bottom left',
  'bottom right',
] as const;

export type LinearSideOrCorner = (typeof LINEAR_SIDE_OR_CORNERS)[number];

export interface LinearAngleDirection {
  readonly kind: 'angle';
  readonly angle: Angle;
}

export interface LinearSideOrCornerDirection {
  readonly kind: 'side-or-corner';
  readonly to: LinearSideOrCorner;
}

export type LinearDirection = LinearAngleDirection | LinearSideOrCornerDirection;

export const RADIAL_SHAPES = ['circle', 'ellipse'] as const;

export type RadialShape = (typeof RADIAL_SHAPES)[number];

export const RADIAL_EXTENTS = [
  'closest-side',
  'farthest-side',
  'closest-corner',
  'farthest-corner',
] as const;

export type RadialExtent = (typeof RADIAL_EXTENTS)[number];

export interface RadialExtentSize {
  readonly kind: 'extent';
  readonly extent: RadialExtent;
}

export interface CircleRadialRadiusSize {
  readonly kind: 'length';
  readonly radius: Length;
}

export interface EllipseRadialRadiiSize {
  readonly kind: 'radii';
  readonly x: LengthPercentage;
  readonly y: LengthPercentage;
}

export type CircleRadialSize = RadialExtentSize | CircleRadialRadiusSize;

export type EllipseRadialSize = RadialExtentSize | EllipseRadialRadiiSize;

export type RadialSize = RadialExtentSize | CircleRadialRadiusSize | EllipseRadialRadiiSize;

export interface GradientBase<TStop extends GradientStop = GradientStop> {
  readonly id: string;
  readonly repeating: boolean;
  readonly stops: readonly TStop[];
}

export interface LinearGradient extends GradientBase<LinearGradientStop> {
  readonly kind: 'linear';
  readonly direction?: LinearDirection;
}

export interface RadialGradientBase extends GradientBase<RadialGradientStop> {
  readonly kind: 'radial';
  readonly position?: GradientPosition;
}

export interface CircleRadialGradient extends RadialGradientBase {
  readonly shape: 'circle';
  readonly size?: CircleRadialSize;
}

export interface EllipseRadialGradient extends RadialGradientBase {
  readonly shape: 'ellipse';
  readonly size?: EllipseRadialSize;
}

export interface UnspecifiedShapeRadialGradient extends RadialGradientBase {
  readonly shape?: undefined;
  readonly size?: RadialSize;
}

export type RadialGradient =
  | CircleRadialGradient
  | EllipseRadialGradient
  | UnspecifiedShapeRadialGradient;

export interface ConicGradient extends GradientBase<ConicGradientStop> {
  readonly kind: 'conic';
  readonly angle?: Angle;
  readonly position?: GradientPosition;
}

export type Gradient = LinearGradient | RadialGradient | ConicGradient;

export interface CreateLinearGradientInput {
  readonly id: string;
  readonly repeating?: boolean;
  readonly direction?: LinearDirection;
  readonly stops: readonly LinearGradientStop[];
}

export interface CreateRadialGradientBaseInput {
  readonly id: string;
  readonly repeating?: boolean;
  readonly position?: GradientPosition;
  readonly stops: readonly RadialGradientStop[];
}

export interface CreateCircleRadialGradientInput extends CreateRadialGradientBaseInput {
  readonly shape: 'circle';
  readonly size?: CircleRadialSize;
}

export interface CreateEllipseRadialGradientInput extends CreateRadialGradientBaseInput {
  readonly shape: 'ellipse';
  readonly size?: EllipseRadialSize;
}

export interface CreateUnspecifiedShapeRadialGradientInput extends CreateRadialGradientBaseInput {
  readonly shape?: undefined;
  readonly size?: RadialSize;
}

export type CreateRadialGradientInput =
  | CreateCircleRadialGradientInput
  | CreateEllipseRadialGradientInput
  | CreateUnspecifiedShapeRadialGradientInput;

export interface CreateConicGradientInput {
  readonly id: string;
  readonly repeating?: boolean;
  readonly angle?: Angle;
  readonly position?: GradientPosition;
  readonly stops: readonly ConicGradientStop[];
}

const GRADIENT_KIND_SET: ReadonlySet<string> = new Set<string>(GRADIENT_KINDS);

export function isGradientKind(value: unknown): value is GradientKind {
  return typeof value === 'string' && GRADIENT_KIND_SET.has(value);
}

export function isLinearGradient(gradient: Gradient): gradient is LinearGradient {
  return gradient.kind === 'linear';
}

export function isRadialGradient(gradient: Gradient): gradient is RadialGradient {
  return gradient.kind === 'radial';
}

export function isConicGradient(gradient: Gradient): gradient is ConicGradient {
  return gradient.kind === 'conic';
}

export function isLinearAngleDirection(
  direction: LinearDirection,
): direction is LinearAngleDirection {
  return direction.kind === 'angle';
}

export function isLinearSideOrCornerDirection(
  direction: LinearDirection,
): direction is LinearSideOrCornerDirection {
  return direction.kind === 'side-or-corner';
}

export function isCircleRadialGradient(gradient: RadialGradient): gradient is CircleRadialGradient {
  return gradient.shape === 'circle';
}

export function isEllipseRadialGradient(
  gradient: RadialGradient,
): gradient is EllipseRadialGradient {
  return gradient.shape === 'ellipse';
}

export function isUnspecifiedShapeRadialGradient(
  gradient: RadialGradient,
): gradient is UnspecifiedShapeRadialGradient {
  return gradient.shape === undefined;
}

export function isRadialExtentSize(size: RadialSize): size is RadialExtentSize {
  return size.kind === 'extent';
}

export function isCircleRadialRadiusSize(size: RadialSize): size is CircleRadialRadiusSize {
  return size.kind === 'length';
}

export function isEllipseRadialRadiiSize(size: RadialSize): size is EllipseRadialRadiiSize {
  return size.kind === 'radii';
}

export function linearAngleDirection(angleValue: Angle): LinearAngleDirection {
  return { kind: 'angle', angle: angleValue };
}

export function linearSideOrCornerDirection(to: LinearSideOrCorner): LinearSideOrCornerDirection {
  return { kind: 'side-or-corner', to };
}

export function radialExtentSize(extent: RadialExtent): RadialExtentSize {
  return { kind: 'extent', extent };
}

export function circleRadialRadiusSize(radius: Length): CircleRadialRadiusSize {
  return { kind: 'length', radius };
}

export function ellipseRadialRadiiSize(
  x: LengthPercentage,
  y: LengthPercentage,
): EllipseRadialRadiiSize {
  return { kind: 'radii', x, y };
}

export function createLinearGradient(input: CreateLinearGradientInput): LinearGradient {
  const stops = [...input.stops];
  const repeating = input.repeating ?? false;
  if (input.direction === undefined) {
    return {
      kind: 'linear',
      id: input.id,
      repeating,
      stops,
    };
  }
  return {
    kind: 'linear',
    id: input.id,
    repeating,
    direction: input.direction,
    stops,
  };
}

export function createRadialGradient(input: CreateCircleRadialGradientInput): CircleRadialGradient;
export function createRadialGradient(
  input: CreateEllipseRadialGradientInput,
): EllipseRadialGradient;
export function createRadialGradient(
  input: CreateUnspecifiedShapeRadialGradientInput,
): UnspecifiedShapeRadialGradient;
export function createRadialGradient(input: CreateRadialGradientInput): RadialGradient;
export function createRadialGradient(input: CreateRadialGradientInput): RadialGradient {
  const base: RadialGradientBase =
    input.position === undefined
      ? {
          kind: 'radial',
          id: input.id,
          repeating: input.repeating ?? false,
          stops: [...input.stops],
        }
      : {
          kind: 'radial',
          id: input.id,
          repeating: input.repeating ?? false,
          position: input.position,
          stops: [...input.stops],
        };

  if (input.shape === 'circle') {
    if (input.size === undefined) {
      return { ...base, shape: 'circle' };
    }
    return { ...base, shape: 'circle', size: input.size };
  }

  if (input.shape === 'ellipse') {
    if (input.size === undefined) {
      return { ...base, shape: 'ellipse' };
    }
    return { ...base, shape: 'ellipse', size: input.size };
  }

  if (input.size === undefined) {
    return base;
  }
  return { ...base, size: input.size };
}

export function createConicGradient(input: CreateConicGradientInput): ConicGradient {
  const stops = [...input.stops];
  const repeating = input.repeating ?? false;
  return {
    kind: 'conic',
    id: input.id,
    repeating,
    ...(input.angle === undefined ? {} : { angle: input.angle }),
    ...(input.position === undefined ? {} : { position: input.position }),
    stops,
  };
}
