import type { LengthPercentage } from './units.ts';

export const HORIZONTAL_POSITION_KEYWORDS = ['left', 'center', 'right'] as const;

export type HorizontalPositionKeyword = (typeof HORIZONTAL_POSITION_KEYWORDS)[number];

export const HORIZONTAL_POSITION_EDGES = ['left', 'right'] as const;

export type HorizontalPositionEdge = (typeof HORIZONTAL_POSITION_EDGES)[number];

export const VERTICAL_POSITION_KEYWORDS = ['top', 'center', 'bottom'] as const;

export type VerticalPositionKeyword = (typeof VERTICAL_POSITION_KEYWORDS)[number];

export const VERTICAL_POSITION_EDGES = ['top', 'bottom'] as const;

export type VerticalPositionEdge = (typeof VERTICAL_POSITION_EDGES)[number];

export interface PositionValue {
  readonly kind: 'value';
  readonly value: LengthPercentage;
}

export interface HorizontalPositionKeywordValue {
  readonly kind: 'keyword';
  readonly keyword: HorizontalPositionKeyword;
}

export interface HorizontalPositionEdgeOffset {
  readonly kind: 'edge-offset';
  readonly edge: HorizontalPositionEdge;
  readonly offset: LengthPercentage;
}

export type HorizontalPosition =
  | PositionValue
  | HorizontalPositionKeywordValue
  | HorizontalPositionEdgeOffset;

export interface VerticalPositionKeywordValue {
  readonly kind: 'keyword';
  readonly keyword: VerticalPositionKeyword;
}

export interface VerticalPositionEdgeOffset {
  readonly kind: 'edge-offset';
  readonly edge: VerticalPositionEdge;
  readonly offset: LengthPercentage;
}

export type VerticalPosition =
  | PositionValue
  | VerticalPositionKeywordValue
  | VerticalPositionEdgeOffset;

export interface GradientPosition {
  readonly x: HorizontalPosition;
  readonly y: VerticalPosition;
}

export function isPositionValue(
  position: HorizontalPosition | VerticalPosition,
): position is PositionValue {
  return position.kind === 'value';
}

export function isHorizontalPositionKeyword(
  position: HorizontalPosition,
): position is HorizontalPositionKeywordValue {
  return position.kind === 'keyword';
}

export function isHorizontalPositionEdgeOffset(
  position: HorizontalPosition,
): position is HorizontalPositionEdgeOffset {
  return position.kind === 'edge-offset';
}

export function isVerticalPositionKeyword(
  position: VerticalPosition,
): position is VerticalPositionKeywordValue {
  return position.kind === 'keyword';
}

export function isVerticalPositionEdgeOffset(
  position: VerticalPosition,
): position is VerticalPositionEdgeOffset {
  return position.kind === 'edge-offset';
}

export function positionValue(value: LengthPercentage): PositionValue {
  return { kind: 'value', value };
}

export function horizontalKeyword(
  keyword: HorizontalPositionKeyword,
): HorizontalPositionKeywordValue {
  return { kind: 'keyword', keyword };
}

export function horizontalEdgeOffset(
  edge: HorizontalPositionEdge,
  offset: LengthPercentage,
): HorizontalPositionEdgeOffset {
  return { kind: 'edge-offset', edge, offset };
}

export function verticalKeyword(keyword: VerticalPositionKeyword): VerticalPositionKeywordValue {
  return { kind: 'keyword', keyword };
}

export function verticalEdgeOffset(
  edge: VerticalPositionEdge,
  offset: LengthPercentage,
): VerticalPositionEdgeOffset {
  return { kind: 'edge-offset', edge, offset };
}

export function gradientPosition(x: HorizontalPosition, y: VerticalPosition): GradientPosition {
  return { x, y };
}
