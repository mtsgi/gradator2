import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { srgb } from './color.ts';
import {
  setGradientKind,
  setRepeating,
  type SetCircleRadialGradientKindOptions,
  type SetRadialGradientKindOptions,
} from './gradient-operations.ts';
import {
  circleRadialRadiusSize,
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
  ellipseRadialRadiiSize,
  isCircleRadialGradient,
  isEllipseRadialGradient,
  isUnspecifiedShapeRadialGradient,
  linearAngleDirection,
  linearSideOrCornerDirection,
  radialExtentSize,
  type CircleRadialGradient,
  type ConicGradient,
  type EllipseRadialGradient,
  type Gradient,
  type GradientKind,
  type LinearGradient,
  type RadialGradient,
  type RadialSize,
  type UnspecifiedShapeRadialGradient,
} from './gradient.ts';
import {
  isGradientOperationFailure,
  isGradientOperationSuccess,
  type GradientOperationError,
  type GradientOperationResult,
} from './operation-result.ts';
import {
  gradientPosition,
  horizontalEdgeOffset,
  horizontalKeyword,
  positionValue,
  verticalKeyword,
} from './position.ts';
import { createColorHint, createColorStop, isColorStop } from './stop.ts';
import { angle, length, percentage } from './units.ts';

function expectSuccess<TGradient extends Gradient>(
  result: GradientOperationResult<TGradient>,
): TGradient {
  expect(isGradientOperationSuccess(result)).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, got ${result.error.code}: ${result.error.message}`);
  }
  return result.gradient;
}

function expectFailure(result: GradientOperationResult<Gradient>): GradientOperationError {
  expect(isGradientOperationFailure(result)).toBe(true);
  if (result.ok) {
    throw new Error('Expected failure, got success');
  }
  return result.error;
}

describe('gradient-operations', () => {
  describe('setRepeating', () => {
    it('toggles repeating immutably with stops/geometry structural sharing and returns identical reference on no-op', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) });
      const direction = linearAngleDirection(angle(135, 'deg'));
      const linear = createLinearGradient({
        id: 'lin-1',
        repeating: false,
        direction,
        stops: [s1, s2],
      });

      expect(expectSuccess(setRepeating(linear, false))).toBe(linear);

      const toggled = expectSuccess(setRepeating(linear, true));
      expect(toggled).not.toBe(linear);
      expect(toggled.repeating).toBe(true);
      expect(toggled.stops).toBe(linear.stops);
      expect(toggled.direction).toBe(direction);
      expect(linear.repeating).toBe(false);

      const radial = createRadialGradient({
        id: 'rad-1',
        repeating: true,
        shape: 'ellipse',
        size: ellipseRadialRadiiSize(percentage(50), length(100, 'px')),
        position: gradientPosition(horizontalKeyword('center'), verticalKeyword('top')),
        stops: [s1, s2],
      });
      const radialOff = expectSuccess(setRepeating(radial, false));
      expect(radialOff.repeating).toBe(false);
      expect(radialOff.shape).toBe('ellipse');
      expect(radialOff.size).toBe(radial.size);
      expect(radialOff.position).toBe(radial.position);
      expect(radialOff.stops).toBe(radial.stops);

      const conic = createConicGradient({
        id: 'conic-1',
        angle: angle(45, 'deg'),
        position: gradientPosition(horizontalKeyword('left'), verticalKeyword('center')),
        stops: [s1, s2],
      });
      const conicOn = expectSuccess(setRepeating(conic, true));
      expect(conicOn.repeating).toBe(true);
      expect(conicOn.angle).toBe(conic.angle);
      expect(conicOn.position).toBe(conic.position);
      expect(conicOn.stops).toBe(conic.stops);
    });
  });

  describe('setGradientKind', () => {
    it('handles same-kind updates, structural no-op identity, explicit undefined clearing, and non-equivalence of different CSS representations', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const linear = createLinearGradient({
        id: 'lin-1',
        direction: linearAngleDirection(angle(360, 'deg')),
        stops: [s1],
      });

      expect(expectSuccess(setGradientKind(linear, 'linear'))).toBe(linear);
      expect(
        expectSuccess(
          setGradientKind(linear, 'linear', {
            direction: linearAngleDirection(angle(360, 'deg')),
          }),
        ),
      ).toBe(linear);

      // Structurally distinct unit (360deg vs 1turn) is NOT a no-op
      const turnDir = expectSuccess(
        setGradientKind(linear, 'linear', {
          direction: linearAngleDirection(angle(1, 'turn')),
        }),
      );
      expect(turnDir).not.toBe(linear);
      expect(turnDir.direction).toEqual(linearAngleDirection(angle(1, 'turn')));
      expect(turnDir.stops).toBe(linear.stops);

      // Explicit direction: undefined clears direction property
      const clearedLinear = expectSuccess(
        setGradientKind(linear, 'linear', { direction: undefined }),
      );
      expect('direction' in clearedLinear).toBe(false);
      expect(clearedLinear.stops).toBe(linear.stops);
      expect(
        expectSuccess(setGradientKind(clearedLinear, 'linear', { direction: undefined })),
      ).toBe(clearedLinear);

      const conic = createConicGradient({
        id: 'conic-1',
        angle: angle(0, 'deg'),
        position: gradientPosition(horizontalKeyword('center'), verticalKeyword('center')),
        stops: [s1],
      });

      expect(
        expectSuccess(
          setGradientKind(conic, 'conic', {
            angle: angle(0, 'deg'),
            position: gradientPosition(horizontalKeyword('center'), verticalKeyword('center')),
          }),
        ),
      ).toBe(conic);

      // keyword 'center' vs percentage(50) is structurally distinct -> NOT a no-op
      const conicPosValue = expectSuccess(
        setGradientKind(conic, 'conic', {
          position: gradientPosition(positionValue(percentage(50)), verticalKeyword('center')),
        }),
      );
      expect(conicPosValue).not.toBe(conic);
      expect(conicPosValue.angle).toBe(conic.angle);
      expect(conicPosValue.stops).toBe(conic.stops);

      const conicCleared = expectSuccess(
        setGradientKind(conic, 'conic', {
          angle: undefined,
          position: undefined,
        }),
      );
      expect('angle' in conicCleared).toBe(false);
      expect('position' in conicCleared).toBe(false);
    });

    it('handles radial partial updates for omitted vs explicit undefined shape/size and shape change compatibility', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const posCenter = gradientPosition(horizontalKeyword('center'), verticalKeyword('center'));
      const posOffset = gradientPosition(
        horizontalEdgeOffset('right', length(10, 'px')),
        verticalKeyword('bottom'),
      );
      const circleSize = circleRadialRadiusSize(length(50, 'px'));
      const ellipseSize = ellipseRadialRadiiSize(percentage(40), length(80, 'px'));
      const extentSize = radialExtentSize('closest-side');

      const circleWithRadius = createRadialGradient({
        id: 'r-circle',
        shape: 'circle',
        size: circleSize,
        position: posCenter,
        stops: [s1],
      });

      // 1. Omitted options / empty options -> no-op
      expect(expectSuccess(setGradientKind(circleWithRadius, 'radial'))).toBe(circleWithRadius);
      expect(expectSuccess(setGradientKind(circleWithRadius, 'radial', {}))).toBe(circleWithRadius);

      // 2. Omitted shape & size with new position -> preserves existing shape and size
      const posOnly = expectSuccess(
        setGradientKind(circleWithRadius, 'radial', { position: posOffset }),
      );
      expect(isCircleRadialGradient(posOnly)).toBe(true);
      expect(posOnly.size).toBe(circleSize);
      expect(posOnly.position).toBe(posOffset);
      expect(posOnly.stops).toBe(circleWithRadius.stops);

      // 3. Omitted shape with explicit size: undefined -> keeps circle shape, removes size key
      const clearSizeOnly = expectSuccess(
        setGradientKind(circleWithRadius, 'radial', { size: undefined }),
      );
      expect(clearSizeOnly.shape).toBe('circle');
      expect('size' in clearSizeOnly).toBe(false);
      expect(clearSizeOnly.position).toBe(posCenter);

      // 4. Omitted shape with incompatible size for existing circle -> INVALID_GEOMETRY
      expect(
        expectFailure(setGradientKind(circleWithRadius, 'radial', { size: ellipseSize })).code,
      ).toBe('INVALID_GEOMETRY');

      // 5. Explicit shape: undefined with omitted size -> clears shape, keeps existing size
      const clearShapeKeepSize = expectSuccess(
        setGradientKind(circleWithRadius, 'radial', { shape: undefined }),
      );
      expect(isUnspecifiedShapeRadialGradient(clearShapeKeepSize)).toBe(true);
      expect('shape' in clearShapeKeepSize).toBe(false);
      expect(clearShapeKeepSize.size).toBe(circleSize);

      // 6. Explicit shape: undefined and size: undefined -> clears both
      const clearBoth = expectSuccess(
        setGradientKind(circleWithRadius, 'radial', {
          shape: undefined,
          size: undefined,
        }),
      );
      expect('shape' in clearBoth).toBe(false);
      expect('size' in clearBoth).toBe(false);
      // Repeating explicit undefined on already-unspecified is no-op
      expect(
        expectSuccess(
          setGradientKind(clearBoth, 'radial', {
            shape: undefined,
            size: undefined,
          }),
        ),
      ).toBe(clearBoth);

      // 7. Changing shape circle -> ellipse while omitting incompatible existing length size -> INVALID_GEOMETRY
      expect(
        expectFailure(setGradientKind(circleWithRadius, 'radial', { shape: 'ellipse' })).code,
      ).toBe('INVALID_GEOMETRY');

      // 8. Changing shape circle -> ellipse with explicit size: undefined -> succeeds
      const circleToEllipseCleared = expectSuccess(
        setGradientKind(circleWithRadius, 'radial', {
          shape: 'ellipse',
          size: undefined,
        }),
      );
      expect(isEllipseRadialGradient(circleToEllipseCleared)).toBe(true);
      expect('size' in circleToEllipseCleared).toBe(false);

      // 9. Changing shape circle -> ellipse with compatible new size -> succeeds
      const circleToEllipseReplaced = expectSuccess(
        setGradientKind(circleWithRadius, 'radial', {
          shape: 'ellipse',
          size: ellipseSize,
        }),
      );
      expect(circleToEllipseReplaced.shape).toBe('ellipse');
      expect(circleToEllipseReplaced.size).toBe(ellipseSize);

      // 10. Changing shape circle(extent) -> ellipse with omitted size -> preserves compatible extent size
      const circleWithExtent = createRadialGradient({
        id: 'r-extent',
        shape: 'circle',
        size: extentSize,
        stops: [s1],
      });
      const extentPreserved = expectSuccess(
        setGradientKind(circleWithExtent, 'radial', { shape: 'ellipse' }),
      );
      expect(extentPreserved.shape).toBe('ellipse');
      expect(extentPreserved.size).toBe(extentSize);

      // 11. Symmetric checks for ellipse(radii) -> circle
      const ellipseWithRadii = createRadialGradient({
        id: 'r-ellipse',
        shape: 'ellipse',
        size: ellipseSize,
        stops: [s1],
      });
      expect(
        expectFailure(setGradientKind(ellipseWithRadii, 'radial', { shape: 'circle' })).code,
      ).toBe('INVALID_GEOMETRY');

      expect(
        expectFailure(setGradientKind(ellipseWithRadii, 'radial', { size: circleSize })).code,
      ).toBe('INVALID_GEOMETRY');

      const ellipseToCircleCleared = expectSuccess(
        setGradientKind(ellipseWithRadii, 'radial', {
          shape: 'circle',
          size: undefined,
        }),
      );
      expect(ellipseToCircleCleared.shape).toBe('circle');
      expect('size' in ellipseToCircleCleared).toBe(false);

      // 12. Unspecified radial with radii -> ellipse succeeds (keeps radii), -> circle fails (INVALID_GEOMETRY)
      const unspecifiedWithRadii = createRadialGradient({
        id: 'r-unspec',
        size: ellipseSize,
        stops: [s1],
      });
      const unspecToEllipse = expectSuccess(
        setGradientKind(unspecifiedWithRadii, 'radial', { shape: 'ellipse' }),
      );
      expect(unspecToEllipse.size).toBe(ellipseSize);

      expect(
        expectFailure(setGradientKind(unspecifiedWithRadii, 'radial', { shape: 'circle' })).code,
      ).toBe('INVALID_GEOMETRY');

      // 13. Runtime invalid shape/size combination on cross-kind conversion
      const linear = createLinearGradient({ id: 'lin', stops: [s1] });
      expect(
        expectFailure(
          setGradientKind(linear, 'radial', {
            shape: 'circle',
            size: ellipseSize as unknown as RadialSize,
          } as unknown as SetCircleRadialGradientKindOptions),
        ).code,
      ).toBe('INVALID_GEOMETRY');
    });

    it('preserves geometry selectively across linear, radial, and conic transitions', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) });
      const sharedPos = gradientPosition(horizontalKeyword('left'), verticalKeyword('top'));
      const altPos = gradientPosition(horizontalKeyword('right'), verticalKeyword('bottom'));

      // linear -> radial: does not carry direction, shares stops reference
      const linear = createLinearGradient({
        id: 'g1',
        repeating: true,
        direction: linearSideOrCornerDirection('top right'),
        stops: [s1, s2],
      });
      const linToRad = expectSuccess(setGradientKind(linear, 'radial'));
      expect(linToRad).toEqual({
        kind: 'radial',
        id: 'g1',
        repeating: true,
        stops: [s1, s2],
      });
      expect('shape' in linToRad).toBe(false);
      expect('size' in linToRad).toBe(false);
      expect('position' in linToRad).toBe(false);
      expect(linToRad.stops).toBe(linear.stops);

      // radial -> linear: drops shape/size/position, accepts explicit direction, shares stops reference
      const radial = createRadialGradient({
        id: 'g2',
        shape: 'circle',
        size: circleRadialRadiusSize(length(40, 'px')),
        position: sharedPos,
        stops: [s1, s2],
      });
      const radToLin = expectSuccess(
        setGradientKind(radial, 'linear', {
          direction: linearAngleDirection(angle(90, 'deg')),
        }),
      );
      expect(radToLin.direction).toEqual(linearAngleDirection(angle(90, 'deg')));
      expect(radToLin.stops).toBe(radial.stops);

      // radial -> conic: carries over position, drops shape/size, shares stops when compatible
      const radToConic = expectSuccess(setGradientKind(radial, 'conic'));
      expect(radToConic.position).toBe(sharedPos);
      expect('angle' in radToConic).toBe(false);
      expect(radToConic.stops).toBe(radial.stops);

      // radial -> conic with explicit position override or explicit undefined clearing
      const radToConicOverride = expectSuccess(
        setGradientKind(radial, 'conic', {
          angle: angle(45, 'deg'),
          position: altPos,
        }),
      );
      expect(radToConicOverride.position).toBe(altPos);
      expect(radToConicOverride.angle).toEqual(angle(45, 'deg'));

      const radToConicClearPos = expectSuccess(
        setGradientKind(radial, 'conic', { position: undefined }),
      );
      expect('position' in radToConicClearPos).toBe(false);

      // conic -> radial: carries over position, drops angle
      const conic = createConicGradient({
        id: 'g3',
        angle: angle(90, 'deg'),
        position: sharedPos,
        stops: [s1, s2],
      });
      const conicToRad = expectSuccess(setGradientKind(conic, 'radial'));
      expect(conicToRad.position).toBe(sharedPos);
      expect('shape' in conicToRad).toBe(false);
      expect('size' in conicToRad).toBe(false);
      expect(conicToRad.stops).toBe(conic.stops);

      // conic -> linear: drops angle & position; linear -> conic: drops direction
      const conicToLin = expectSuccess(setGradientKind(conic, 'linear'));
      expect('direction' in conicToLin).toBe(false);
      expect(conicToLin.stops).toBe(conic.stops);

      const linToConic = expectSuccess(setGradientKind(linear, 'conic'));
      expect('angle' in linToConic).toBe(false);
      expect('position' in linToConic).toBe(false);
      expect(linToConic.stops).toBe(linear.stops);
    });

    it('handles incompatible stop positions across error, drop, and convert-angle strategies', () => {
      const pctStop = createColorStop({
        id: 'pct',
        color: srgb(255, 0, 0),
        position: percentage(0),
      });
      const autoStop = createColorStop({ id: 'auto', color: srgb(0, 255, 0) });
      const lenStop = createColorStop({
        id: 'len',
        color: srgb(0, 0, 255),
        position: length(60, 'px'),
      });
      const lenHint = createColorHint({ id: 'len-hint', position: length(30, 'px') });

      const linearWithLength = createLinearGradient({
        id: 'lin-len',
        stops: [pctStop, lenHint, lenStop, autoStop],
      });

      // Default strategy ('error') rejects length stops on linear -> conic
      const linToConicErr = expectFailure(setGradientKind(linearWithLength, 'conic'));
      expect(linToConicErr.code).toBe('INCOMPATIBLE_STOP_POSITION');
      expect(linToConicErr.stopId).toBe('len-hint');

      // 'drop' strategy on linear -> conic removes incompatible hints and clears incompatible color stop position
      const linToConicDrop = expectSuccess(
        setGradientKind(linearWithLength, 'conic', {
          incompatibleStopPosition: 'drop',
        }),
      );
      expect(linToConicDrop.stops).toHaveLength(3);
      expect(linToConicDrop.stops[0]).toBe(pctStop);
      expect(linToConicDrop.stops[1]).toEqual({
        kind: 'color',
        id: 'len',
        color: lenStop.color,
      });
      expect('position' in linToConicDrop.stops[1]).toBe(false);
      expect(isColorStop(linToConicDrop.stops[1]) && linToConicDrop.stops[1].color).toBe(
        lenStop.color,
      );
      expect(linToConicDrop.stops[2]).toBe(autoStop);

      // conic -> linear / radial with angle stops in all 4 units, negative and > 1 turn values
      const degStop = createColorStop({
        id: 'deg',
        color: srgb(255, 0, 0),
        position: angle(108, 'deg'),
      });
      const gradHint = createColorHint({ id: 'grad-hint', position: angle(200, 'grad') });
      const turnStop = createColorStop({
        id: 'turn',
        color: srgb(0, 255, 0),
        position: angle(0.75, 'turn'),
      });
      const radStop = createColorStop({
        id: 'rad',
        color: srgb(0, 0, 255),
        position: angle(Math.PI, 'rad'),
      });
      const negDegStop = createColorStop({
        id: 'neg-deg',
        color: srgb(10, 20, 30),
        position: angle(-90, 'deg'),
      });
      const overTurnStop = createColorStop({
        id: 'over-turn',
        color: srgb(40, 50, 60),
        position: angle(720, 'deg'),
      });

      const conicWithAngles = createConicGradient({
        id: 'conic-angles',
        stops: [pctStop, degStop, gradHint, turnStop, radStop, negDegStop, overTurnStop, autoStop],
      });

      // Default strategy ('error') rejects angle stops
      const conicToLinErr = expectFailure(setGradientKind(conicWithAngles, 'linear'));
      expect(conicToLinErr.code).toBe('INCOMPATIBLE_STOP_POSITION');
      expect(conicToLinErr.stopId).toBe('deg');

      // 'convert-angle' converts all 4 angle units linearly without clamping, sharing compatible stops
      const conicToLinConverted = expectSuccess(
        setGradientKind(conicWithAngles, 'linear', {
          incompatibleStopPosition: 'convert-angle',
        }),
      );
      const convertedStops = conicToLinConverted.stops;
      expect(convertedStops).toHaveLength(8);
      expect(convertedStops[0]).toBe(pctStop);
      expect(convertedStops[1].position).toEqual(percentage(30));
      expect(convertedStops[2]).toEqual({
        kind: 'hint',
        id: 'grad-hint',
        position: percentage(50),
      });
      expect(convertedStops[3].position).toEqual(percentage(75));
      expect(convertedStops[4].position).toEqual(percentage(50));
      expect(convertedStops[5].position).toEqual(percentage(-25));
      expect(convertedStops[6].position).toEqual(percentage(200));
      expect(convertedStops[7]).toBe(autoStop);

      // 'drop' on conic -> radial clears angle color stop positions and removes angle hints
      const conicToRadDrop = expectSuccess(
        setGradientKind(conicWithAngles, 'radial', {
          incompatibleStopPosition: 'drop',
        }),
      );
      const droppedStops = conicToRadDrop.stops;
      expect(droppedStops.map((stop) => stop.id)).toEqual([
        'pct',
        'deg',
        'turn',
        'rad',
        'neg-deg',
        'over-turn',
        'auto',
      ]);
      expect(droppedStops[0]).toBe(pctStop);
      expect('position' in droppedStops[1]).toBe(false);
      expect(droppedStops[6]).toBe(autoStop);
    });

    it('verifies compile-time return types and option constraints across literals, branches, and unions', () => {
      const constLinear = {
        kind: 'linear',
        id: 'const-lin',
        repeating: false,
        stops: [],
      } as const;

      const constCircle = {
        kind: 'radial',
        id: 'const-circle',
        repeating: false,
        shape: 'circle',
        stops: [],
      } as const;

      const constEllipse = {
        kind: 'radial',
        id: 'const-ellipse',
        repeating: true,
        shape: 'ellipse',
        stops: [],
      } as const;

      const constUnspecified = {
        kind: 'radial',
        id: 'const-unspec',
        repeating: false,
        stops: [],
      } as const;

      const constConic = {
        kind: 'conic',
        id: 'const-conic',
        repeating: false,
        stops: [],
      } as const;

      // setRepeating does not leak literal `repeating: false`
      expectTypeOf(setRepeating(constLinear, true)).toEqualTypeOf<
        GradientOperationResult<LinearGradient>
      >();
      expectTypeOf(setRepeating(constCircle, true)).toEqualTypeOf<
        GradientOperationResult<CircleRadialGradient>
      >();
      expectTypeOf(setRepeating(constEllipse, false)).toEqualTypeOf<
        GradientOperationResult<EllipseRadialGradient>
      >();
      expectTypeOf(setRepeating(constUnspecified, true)).toEqualTypeOf<
        GradientOperationResult<UnspecifiedShapeRadialGradient>
      >();
      expectTypeOf(setRepeating(constConic, true)).toEqualTypeOf<
        GradientOperationResult<ConicGradient>
      >();

      // Verify union inputs without TypeScript control-flow narrowing
      const verifyUnionAndErrorTypes = (
        anyGradient: Gradient,
        radialUnion: RadialGradient,
        dynamicKind: GradientKind,
        radialOptions: SetRadialGradientKindOptions,
      ) => {
        expectTypeOf(setRepeating(anyGradient, true)).toEqualTypeOf<
          GradientOperationResult<Gradient>
        >();
        expectTypeOf(setRepeating(radialUnion, true)).toEqualTypeOf<
          GradientOperationResult<RadialGradient>
        >();

        expectTypeOf(setGradientKind(anyGradient, 'linear')).toEqualTypeOf<
          GradientOperationResult<LinearGradient>
        >();
        expectTypeOf(setGradientKind(anyGradient, 'radial', { shape: 'circle' })).toEqualTypeOf<
          GradientOperationResult<CircleRadialGradient>
        >();
        expectTypeOf(setGradientKind(anyGradient, 'radial', { shape: 'ellipse' })).toEqualTypeOf<
          GradientOperationResult<EllipseRadialGradient>
        >();
        expectTypeOf(setGradientKind(anyGradient, 'radial')).toEqualTypeOf<
          GradientOperationResult<RadialGradient>
        >();
        expectTypeOf(setGradientKind(anyGradient, 'radial', radialOptions)).toEqualTypeOf<
          GradientOperationResult<RadialGradient>
        >();
        expectTypeOf(setGradientKind(anyGradient, 'radial', { shape: undefined })).toEqualTypeOf<
          GradientOperationResult<RadialGradient>
        >();
        expectTypeOf(setGradientKind(anyGradient, 'conic')).toEqualTypeOf<
          GradientOperationResult<ConicGradient>
        >();
        expectTypeOf(
          setGradientKind(anyGradient, dynamicKind, { incompatibleStopPosition: 'drop' }),
        ).toEqualTypeOf<GradientOperationResult<Gradient>>();

        // @ts-expect-error circle radial options cannot accept ellipse radii size
        setGradientKind(constLinear, 'radial', {
          shape: 'circle',
          size: ellipseRadialRadiiSize(percentage(50), percentage(50)),
        });

        // @ts-expect-error ellipse radial options cannot accept circle single-length size
        setGradientKind(constLinear, 'radial', {
          shape: 'ellipse',
          size: circleRadialRadiusSize(length(30, 'px')),
        });

        setGradientKind(constLinear, 'conic', {
          // @ts-expect-error conic target does not support convert-angle strategy
          incompatibleStopPosition: 'convert-angle',
        });

        // @ts-expect-error linear options do not accept radial shape
        setGradientKind(constConic, 'linear', { shape: 'circle' });

        setGradientKind(constLinear, 'conic', {
          // @ts-expect-error conic options do not accept linear direction
          direction: linearAngleDirection(angle(45, 'deg')),
        });

        setGradientKind(anyGradient, dynamicKind, {
          // @ts-expect-error dynamic GradientKind union does not accept kind-specific direction
          direction: linearAngleDirection(angle(45, 'deg')),
        });

        setGradientKind(anyGradient, dynamicKind, {
          // @ts-expect-error dynamic GradientKind union does not support convert-angle (may be conic)
          incompatibleStopPosition: 'convert-angle',
        });
      };

      expect(typeof verifyUnionAndErrorTypes).toBe('function');
    });
  });
});
