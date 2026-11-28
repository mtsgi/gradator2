import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import {
  HORIZONTAL_POSITION_EDGES,
  HORIZONTAL_POSITION_KEYWORDS,
  VERTICAL_POSITION_EDGES,
  VERTICAL_POSITION_KEYWORDS,
  gradientPosition,
  horizontalEdgeOffset,
  horizontalKeyword,
  isHorizontalPositionEdgeOffset,
  isHorizontalPositionKeyword,
  isPositionValue,
  isVerticalPositionEdgeOffset,
  isVerticalPositionKeyword,
  positionValue,
  verticalEdgeOffset,
  verticalKeyword,
  type HorizontalPosition,
  type HorizontalPositionEdgeOffset,
  type HorizontalPositionKeywordValue,
  type PositionValue,
  type VerticalPosition,
  type VerticalPositionEdgeOffset,
  type VerticalPositionKeywordValue,
} from './position.ts';
import { length, percentage } from './units.ts';

describe('position', () => {
  it('exposes horizontal and vertical position constants', () => {
    expect(HORIZONTAL_POSITION_KEYWORDS).toEqual(['left', 'center', 'right']);
    expect(HORIZONTAL_POSITION_EDGES).toEqual(['left', 'right']);
    expect(VERTICAL_POSITION_KEYWORDS).toEqual(['top', 'center', 'bottom']);
    expect(VERTICAL_POSITION_EDGES).toEqual(['top', 'bottom']);
  });

  it('constructs and narrows horizontal and vertical positions', () => {
    const xVal: HorizontalPosition = positionValue(percentage(25));
    const xKey: HorizontalPosition = horizontalKeyword('center');
    const xEdge: HorizontalPosition = horizontalEdgeOffset('right', length(20, 'px'));

    const yVal: VerticalPosition = positionValue(length(10, 'rem'));
    const yKey: VerticalPosition = verticalKeyword('top');
    const yEdge: VerticalPosition = verticalEdgeOffset('bottom', percentage(15));

    expect(gradientPosition(xEdge, yEdge)).toEqual({
      x: { kind: 'edge-offset', edge: 'right', offset: { value: 20, unit: 'px' } },
      y: { kind: 'edge-offset', edge: 'bottom', offset: { value: 15, unit: '%' } },
    });

    expect(isPositionValue(xVal)).toBe(true);
    expect(isHorizontalPositionKeyword(xKey)).toBe(true);
    expect(isHorizontalPositionEdgeOffset(xEdge)).toBe(true);
    expect(isHorizontalPositionEdgeOffset(xVal)).toBe(false);

    expect(isPositionValue(yVal)).toBe(true);
    expect(isVerticalPositionKeyword(yKey)).toBe(true);
    expect(isVerticalPositionEdgeOffset(yEdge)).toBe(true);
    expect(isVerticalPositionKeyword(yEdge)).toBe(false);

    if (isPositionValue(xVal)) {
      expectTypeOf(xVal).toEqualTypeOf<PositionValue>();
    }
    if (isHorizontalPositionKeyword(xKey)) {
      expectTypeOf(xKey).toEqualTypeOf<HorizontalPositionKeywordValue>();
    }
    if (isHorizontalPositionEdgeOffset(xEdge)) {
      expectTypeOf(xEdge).toEqualTypeOf<HorizontalPositionEdgeOffset>();
    }
    if (isVerticalPositionKeyword(yKey)) {
      expectTypeOf(yKey).toEqualTypeOf<VerticalPositionKeywordValue>();
    }
    if (isVerticalPositionEdgeOffset(yEdge)) {
      expectTypeOf(yEdge).toEqualTypeOf<VerticalPositionEdgeOffset>();
    }
  });
});
