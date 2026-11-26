import type { Color } from './color.ts';
import type { AnglePercentage, LengthPercentage, StopPosition } from './units.ts';

export const GRADIENT_STOP_KINDS = ['color', 'hint'] as const;

export type GradientStopKind = (typeof GRADIENT_STOP_KINDS)[number];

export interface ColorStop<TPosition extends StopPosition = StopPosition> {
  readonly kind: 'color';
  readonly id: string;
  readonly color: Color;
  readonly position?: TPosition;
}

export interface ColorHint<TPosition extends StopPosition = StopPosition> {
  readonly kind: 'hint';
  readonly id: string;
  readonly position: TPosition;
}

export type GradientStop<TPosition extends StopPosition = StopPosition> =
  | ColorStop<TPosition>
  | ColorHint<TPosition>;

export type LinearGradientStop = GradientStop<LengthPercentage>;

export type RadialGradientStop = GradientStop<LengthPercentage>;

export type ConicGradientStop = GradientStop<AnglePercentage>;

export interface CreateColorStopWithoutPositionInput {
  readonly id: string;
  readonly color: Color;
  readonly position?: undefined;
}

export interface CreateColorStopWithPositionInput<TPosition extends StopPosition> {
  readonly id: string;
  readonly color: Color;
  readonly position: TPosition;
}

export type CreateColorStopInput<TPosition extends StopPosition = StopPosition> =
  | CreateColorStopWithoutPositionInput
  | CreateColorStopWithPositionInput<TPosition>;

export interface CreateColorHintInput<TPosition extends StopPosition> {
  readonly id: string;
  readonly position: TPosition;
}

export function isColorStop<TPosition extends StopPosition>(
  stop: GradientStop<TPosition>,
): stop is ColorStop<TPosition> {
  return stop.kind === 'color';
}

export function isColorHint<TPosition extends StopPosition>(
  stop: GradientStop<TPosition>,
): stop is ColorHint<TPosition> {
  return stop.kind === 'hint';
}

export function createColorStop(input: CreateColorStopWithoutPositionInput): ColorStop<never>;
export function createColorStop<TPosition extends StopPosition>(
  input: CreateColorStopWithPositionInput<TPosition>,
): ColorStop<TPosition>;
export function createColorStop<TPosition extends StopPosition = StopPosition>(
  input: CreateColorStopInput<TPosition>,
): ColorStop<TPosition>;
export function createColorStop<TPosition extends StopPosition = StopPosition>(
  input: CreateColorStopInput<TPosition>,
): ColorStop<TPosition> {
  if (input.position === undefined) {
    return {
      kind: 'color',
      id: input.id,
      color: input.color,
    };
  }
  return {
    kind: 'color',
    id: input.id,
    color: input.color,
    position: input.position,
  };
}

export function createColorHint<TPosition extends StopPosition>(
  input: CreateColorHintInput<TPosition>,
): ColorHint<TPosition> {
  return {
    kind: 'hint',
    id: input.id,
    position: input.position,
  };
}
