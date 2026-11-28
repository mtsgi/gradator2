import type {
  CircleRadialGradient,
  ConicGradient,
  EllipseRadialGradient,
  Gradient,
  LinearGradient,
  RadialGradient,
  UnspecifiedShapeRadialGradient,
} from './gradient.ts';

export const GRADIENT_OPERATION_ERROR_CODES = [
  'STOP_NOT_FOUND',
  'DUPLICATE_STOP_ID',
  'INVALID_STOP_ID',
  'INVALID_STOP_INDEX',
  'INVALID_STOP_PATCH',
  'INCOMPATIBLE_STOP_POSITION',
  'INVALID_GEOMETRY',
] as const;

export type GradientOperationErrorCode = (typeof GRADIENT_OPERATION_ERROR_CODES)[number];

export interface GradientOperationError {
  readonly code: GradientOperationErrorCode;
  readonly message: string;
  readonly stopId?: string;
  readonly index?: number;
}

export type GradientVariantOf<TGradient extends Gradient> = TGradient extends LinearGradient
  ? LinearGradient
  : TGradient extends CircleRadialGradient
    ? CircleRadialGradient
    : TGradient extends EllipseRadialGradient
      ? EllipseRadialGradient
      : TGradient extends UnspecifiedShapeRadialGradient
        ? UnspecifiedShapeRadialGradient
        : TGradient extends RadialGradient
          ? RadialGradient
          : TGradient extends ConicGradient
            ? ConicGradient
            : never;

export interface GradientOperationSuccess<TGradient extends Gradient = Gradient> {
  readonly ok: true;
  readonly gradient: TGradient;
}

export interface GradientOperationFailure {
  readonly ok: false;
  readonly error: GradientOperationError;
}

export type GradientOperationResult<TGradient extends Gradient = Gradient> =
  | GradientOperationSuccess<TGradient>
  | GradientOperationFailure;

export function isGradientOperationSuccess<TGradient extends Gradient>(
  result: GradientOperationResult<TGradient>,
): result is GradientOperationSuccess<TGradient> {
  return result.ok;
}

export function isGradientOperationFailure<TGradient extends Gradient>(
  result: GradientOperationResult<TGradient>,
): result is GradientOperationFailure {
  return !result.ok;
}
