import type { Color } from './color.ts';
import type {
  CircleRadialGradient,
  ConicGradient,
  EllipseRadialGradient,
  Gradient,
  GradientKind,
  LinearDirection,
  LinearGradient,
  RadialGradient,
  RadialShape,
  RadialSize,
  UnspecifiedShapeRadialGradient,
} from './gradient.ts';
import { isCircleRadialRadiusSize, isEllipseRadialRadiiSize } from './gradient.ts';
import type {
  GradientOperationErrorCode,
  GradientOperationFailure,
  GradientOperationSuccess,
  GradientVariantOf,
} from './operation-result.ts';
import type { GradientPosition, HorizontalPosition, VerticalPosition } from './position.ts';
import type { ConicGradientStop, GradientStop, LinearGradientStop } from './stop.ts';
import { isAnglePercentage, isLengthPercentage, type StopPosition } from './units.ts';

export interface OperationFailureDetails {
  readonly stopId?: string;
  readonly index?: number;
}

export function createOperationSuccess<TGradient extends Gradient>(
  gradient: TGradient,
): GradientOperationSuccess<TGradient> {
  return { ok: true, gradient };
}

export function createNoopSuccess<TGradient extends Gradient>(
  gradient: TGradient,
): GradientOperationSuccess<GradientVariantOf<TGradient>> {
  return { ok: true, gradient: gradient as unknown as GradientVariantOf<TGradient> };
}

export function createOperationFailure(
  code: GradientOperationErrorCode,
  message: string,
  details?: OperationFailureDetails,
): GradientOperationFailure {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details?.stopId === undefined ? {} : { stopId: details.stopId }),
      ...(details?.index === undefined ? {} : { index: details.index }),
    },
  };
}

export function isValidStopId(id: unknown): id is string {
  return typeof id === 'string' && id.trim().length > 0;
}

export function isValidStopIndex(index: number, min: number, max: number): boolean {
  return Number.isInteger(index) && index >= min && index <= max;
}

export function isCompatibleStopPosition(kind: GradientKind, position: StopPosition): boolean {
  if (kind === 'conic') {
    return isAnglePercentage(position);
  }
  return isLengthPercentage(position);
}

export function isCompatibleRadialSize(
  shape: RadialShape | undefined,
  size: RadialSize | undefined,
): boolean {
  if (size === undefined || shape === undefined) {
    return true;
  }
  if (shape === 'circle') {
    return !isEllipseRadialRadiiSize(size);
  }
  return !isCircleRadialRadiusSize(size);
}

export function isSameColor(a: Color, b: Color): boolean {
  if (a === b) {
    return true;
  }
  if (a.space !== b.space) {
    return false;
  }
  if (a.space === 'srgb' && b.space === 'srgb') {
    return (
      Object.is(a.r, b.r) &&
      Object.is(a.g, b.g) &&
      Object.is(a.b, b.b) &&
      Object.is(a.alpha, b.alpha)
    );
  }
  if (a.space === 'hsl' && b.space === 'hsl') {
    return (
      Object.is(a.h, b.h) &&
      Object.is(a.s, b.s) &&
      Object.is(a.l, b.l) &&
      Object.is(a.alpha, b.alpha)
    );
  }
  return false;
}

export function isSameStopPosition(
  a: StopPosition | undefined,
  b: StopPosition | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a === undefined || b === undefined) {
    return false;
  }
  return a.unit === b.unit && Object.is(a.value, b.value);
}

export function isSameLinearDirection(
  a: LinearDirection | undefined,
  b: LinearDirection | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a === undefined || b === undefined) {
    return false;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'angle' && b.kind === 'angle') {
    return isSameStopPosition(a.angle, b.angle);
  }
  if (a.kind === 'side-or-corner' && b.kind === 'side-or-corner') {
    return a.to === b.to;
  }
  return false;
}

function isSameHorizontalPosition(a: HorizontalPosition, b: HorizontalPosition): boolean {
  if (a === b) {
    return true;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'value' && b.kind === 'value') {
    return isSameStopPosition(a.value, b.value);
  }
  if (a.kind === 'keyword' && b.kind === 'keyword') {
    return a.keyword === b.keyword;
  }
  if (a.kind === 'edge-offset' && b.kind === 'edge-offset') {
    return a.edge === b.edge && isSameStopPosition(a.offset, b.offset);
  }
  return false;
}

function isSameVerticalPosition(a: VerticalPosition, b: VerticalPosition): boolean {
  if (a === b) {
    return true;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'value' && b.kind === 'value') {
    return isSameStopPosition(a.value, b.value);
  }
  if (a.kind === 'keyword' && b.kind === 'keyword') {
    return a.keyword === b.keyword;
  }
  if (a.kind === 'edge-offset' && b.kind === 'edge-offset') {
    return a.edge === b.edge && isSameStopPosition(a.offset, b.offset);
  }
  return false;
}

export function isSameGradientPosition(
  a: GradientPosition | undefined,
  b: GradientPosition | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a === undefined || b === undefined) {
    return false;
  }
  return isSameHorizontalPosition(a.x, b.x) && isSameVerticalPosition(a.y, b.y);
}

export function isSameRadialSize(a: RadialSize | undefined, b: RadialSize | undefined): boolean {
  if (a === b) {
    return true;
  }
  if (a === undefined || b === undefined) {
    return false;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'extent' && b.kind === 'extent') {
    return a.extent === b.extent;
  }
  if (a.kind === 'length' && b.kind === 'length') {
    return isSameStopPosition(a.radius, b.radius);
  }
  if (a.kind === 'radii' && b.kind === 'radii') {
    return isSameStopPosition(a.x, b.x) && isSameStopPosition(a.y, b.y);
  }
  return false;
}

export function buildRadialGradient(
  id: string,
  repeating: boolean,
  shape: RadialShape | undefined,
  size: RadialSize | undefined,
  position: GradientPosition | undefined,
  stops: readonly LinearGradientStop[],
): RadialGradient {
  const positionField = position === undefined ? {} : { position };
  if (shape === 'circle') {
    const circle: CircleRadialGradient = {
      kind: 'radial',
      id,
      repeating,
      shape: 'circle',
      ...(size === undefined || isEllipseRadialRadiiSize(size) ? {} : { size }),
      ...positionField,
      stops,
    };
    return circle;
  }
  if (shape === 'ellipse') {
    const ellipse: EllipseRadialGradient = {
      kind: 'radial',
      id,
      repeating,
      shape: 'ellipse',
      ...(size === undefined || isCircleRadialRadiusSize(size) ? {} : { size }),
      ...positionField,
      stops,
    };
    return ellipse;
  }
  const unspecified: UnspecifiedShapeRadialGradient = {
    kind: 'radial',
    id,
    repeating,
    ...(size === undefined ? {} : { size }),
    ...positionField,
    stops,
  };
  return unspecified;
}

export function rebuildGradientWithStops<TGradient extends Gradient>(
  gradient: TGradient,
  stops: readonly GradientStop[],
): GradientVariantOf<TGradient> {
  if (gradient.kind === 'linear') {
    const linear: LinearGradient = {
      kind: 'linear',
      id: gradient.id,
      repeating: gradient.repeating,
      ...(gradient.direction === undefined ? {} : { direction: gradient.direction }),
      stops: stops as readonly LinearGradientStop[],
    };
    return linear as GradientVariantOf<TGradient>;
  }
  if (gradient.kind === 'radial') {
    return buildRadialGradient(
      gradient.id,
      gradient.repeating,
      gradient.shape,
      gradient.size,
      gradient.position,
      stops as readonly LinearGradientStop[],
    ) as GradientVariantOf<TGradient>;
  }
  const conic: ConicGradient = {
    kind: 'conic',
    id: gradient.id,
    repeating: gradient.repeating,
    ...(gradient.angle === undefined ? {} : { angle: gradient.angle }),
    ...(gradient.position === undefined ? {} : { position: gradient.position }),
    stops: stops as readonly ConicGradientStop[],
  };
  return conic as GradientVariantOf<TGradient>;
}

export function rebuildGradientWithRepeating<TGradient extends Gradient>(
  gradient: TGradient,
  repeating: boolean,
): GradientVariantOf<TGradient> {
  if (gradient.kind === 'linear') {
    const linear: LinearGradient = {
      kind: 'linear',
      id: gradient.id,
      repeating,
      ...(gradient.direction === undefined ? {} : { direction: gradient.direction }),
      stops: gradient.stops,
    };
    return linear as GradientVariantOf<TGradient>;
  }
  if (gradient.kind === 'radial') {
    return buildRadialGradient(
      gradient.id,
      repeating,
      gradient.shape,
      gradient.size,
      gradient.position,
      gradient.stops,
    ) as GradientVariantOf<TGradient>;
  }
  const conic: ConicGradient = {
    kind: 'conic',
    id: gradient.id,
    repeating,
    ...(gradient.angle === undefined ? {} : { angle: gradient.angle }),
    ...(gradient.position === undefined ? {} : { position: gradient.position }),
    stops: gradient.stops,
  };
  return conic as GradientVariantOf<TGradient>;
}
