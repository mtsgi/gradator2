import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { hsl, srgb } from './color.ts';
import {
  circleRadialRadiusSize,
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
  ellipseRadialRadiiSize,
  linearAngleDirection,
  type CircleRadialGradient,
  type ConicGradient,
  type EllipseRadialGradient,
  type Gradient,
  type LinearGradient,
  type RadialGradient,
  type UnspecifiedShapeRadialGradient,
} from './gradient.ts';
import {
  isGradientOperationFailure,
  isGradientOperationSuccess,
  type GradientOperationError,
  type GradientOperationResult,
} from './operation-result.ts';
import {
  addStop,
  duplicateStop,
  moveStop,
  removeStop,
  updateStop,
  type GradientStopOf,
  type GradientStopPatch,
  type StopPositionOf,
} from './stop-operations.ts';
import {
  createColorHint,
  createColorStop,
  isColorStop,
  type ColorStop,
  type LinearGradientStop,
} from './stop.ts';
import {
  angle,
  length,
  percentage,
  type AnglePercentage,
  type LengthPercentage,
  type Percentage,
} from './units.ts';

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

function expectColorStop<TStop extends LinearGradientStop>(
  stop: TStop,
): ColorStop<LengthPercentage> {
  expect(isColorStop(stop)).toBe(true);
  if (!isColorStop(stop)) {
    throw new Error(`Expected color stop, got ${stop.kind}`);
  }
  return stop;
}

describe('stop-operations', () => {
  describe('addStop', () => {
    it('appends by default, inserts at explicit index, preserves immutability and structural sharing', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) });
      const direction = linearAngleDirection(angle(90, 'deg'));
      const original = createLinearGradient({
        id: 'lin-1',
        direction,
        stops: [s1, s2],
      });

      const appendedStop = createColorStop({ id: 's3', color: hsl(120, 100, 50) });
      const appended = expectSuccess(addStop(original, appendedStop));
      expect(appended).not.toBe(original);
      expect(appended.stops).toEqual([s1, s2, appendedStop]);
      expect(appended.stops[0]).toBe(s1);
      expect(appended.stops[1]).toBe(s2);
      expect(appended.stops[2]).toBe(appendedStop);
      expect(appended.direction).toBe(direction);
      expect(original.stops).toEqual([s1, s2]);

      const hint = createColorHint({ id: 'h1', position: length(50, 'px') });
      const inserted = expectSuccess(addStop(original, hint, { index: 1 }));
      expect(inserted.stops).toEqual([s1, hint, s2]);
      expect(inserted.stops[0]).toBe(s1);
      expect(inserted.stops[2]).toBe(s2);

      const atStart = expectSuccess(addStop(original, hint, { index: 0 }));
      expect(atStart.stops.map((stop) => stop.id)).toEqual(['h1', 's1', 's2']);

      const emptyConic = createConicGradient({ id: 'conic-empty', stops: [] });
      const firstConicStop = createColorStop({
        id: 'c1',
        color: srgb(0, 0, 0),
        position: angle(90, 'deg'),
      });
      const addedToEmpty = expectSuccess(addStop(emptyConic, firstConicStop, { index: 0 }));
      expect(addedToEmpty.stops).toEqual([firstConicStop]);
    });

    it('rejects empty/whitespace id, duplicate id, invalid index, and runtime incompatible position', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1] });

      const emptyId = expectFailure(
        addStop(linear, createColorStop({ id: '', color: srgb(0, 0, 0) })),
      );
      expect(emptyId.code).toBe('INVALID_STOP_ID');
      expect(emptyId.stopId).toBe('');

      const blankId = expectFailure(
        addStop(linear, createColorStop({ id: '   ', color: srgb(0, 0, 0) })),
      );
      expect(blankId.code).toBe('INVALID_STOP_ID');

      const duplicate = expectFailure(
        addStop(linear, createColorStop({ id: 's1', color: srgb(0, 0, 0) })),
      );
      expect(duplicate.code).toBe('DUPLICATE_STOP_ID');
      expect(duplicate.stopId).toBe('s1');

      for (const badIndex of [-1, 2, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        const err = expectFailure(
          addStop(linear, createColorStop({ id: 's2', color: srgb(0, 0, 0) }), {
            index: badIndex,
          }),
        );
        expect(err.code).toBe('INVALID_STOP_INDEX');
        expect(Object.is(err.index, badIndex)).toBe(true);
      }

      const angleStop = createColorStop({
        id: 'bad-unit',
        color: srgb(0, 0, 0),
        position: angle(45, 'deg'),
      });
      const runtimeBadUnit = expectFailure(
        addStop(linear, angleStop as unknown as LinearGradientStop),
      );
      expect(runtimeBadUnit.code).toBe('INCOMPATIBLE_STOP_POSITION');
      expect(runtimeBadUnit.stopId).toBe('bad-unit');

      const conic = createConicGradient({ id: 'c1', stops: [] });
      const lengthStop = createColorStop({
        id: 'bad-len',
        color: srgb(0, 0, 0),
        position: length(10, 'px'),
      });
      const runtimeBadConic = expectFailure(
        addStop(conic, lengthStop as unknown as GradientStopOf<ConicGradient>),
      );
      expect(runtimeBadConic.code).toBe('INCOMPATIBLE_STOP_POSITION');
      expect(runtimeBadConic.stopId).toBe('bad-len');
    });
  });

  describe('removeStop', () => {
    it('removes a stop immutably, shares unaffected stops, and allows reducing below 2 stops', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) });
      const gradient = createRadialGradient({
        id: 'rad-1',
        shape: 'circle',
        size: circleRadialRadiusSize(length(80, 'px')),
        stops: [s1, s2],
      });

      const removedOne = expectSuccess(removeStop(gradient, 's1'));
      expect(removedOne.stops).toEqual([s2]);
      expect(removedOne.stops[0]).toBe(s2);
      expect(removedOne.size).toBe(gradient.size);
      expect(gradient.stops).toEqual([s1, s2]);

      const removedAll = expectSuccess(removeStop(removedOne, 's2'));
      expect(removedAll.stops).toEqual([]);
    });

    it('returns STOP_NOT_FOUND when stopId does not exist', () => {
      const gradient = createLinearGradient({ id: 'lin-1', stops: [] });
      const error = expectFailure(removeStop(gradient, 'missing'));
      expect(error.code).toBe('STOP_NOT_FOUND');
      expect(error.stopId).toBe('missing');
    });
  });

  describe('updateStop', () => {
    it('updates color, position, removes color stop position with undefined, and updates color hint position', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(10) });
      const h1 = createColorHint({ id: 'h1', position: percentage(50) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1, h1, s2] });

      const newColor = hsl(180, 100, 40, 0.8);
      const updatedColor = expectSuccess(updateStop(linear, 's1', { color: newColor }));
      expect(updatedColor.stops[0]).toEqual({
        kind: 'color',
        id: 's1',
        color: newColor,
        position: percentage(10),
      });
      // Structural sharing: unchanged position object and sibling stops keep reference
      expect(updatedColor.stops[0].position).toBe(s1.position);
      expect(updatedColor.stops[1]).toBe(h1);
      expect(updatedColor.stops[2]).toBe(s2);

      // Updating with equivalent color value and new position preserves existing color reference
      const updatedPosOnly = expectSuccess(
        updateStop(linear, 's1', {
          color: srgb(255, 0, 0),
          position: length(24, 'px'),
        }),
      );
      const posOnlyStop = expectColorStop(updatedPosOnly.stops[0]);
      expect(posOnlyStop.color).toBe(s1.color);
      expect(posOnlyStop.position).toEqual(length(24, 'px'));

      // Clearing ColorStop position omits the position property key
      const clearedPos = expectSuccess(updateStop(linear, 's1', { position: undefined }));
      expect(clearedPos.stops[0]).toEqual({ kind: 'color', id: 's1', color: s1.color });
      expect('position' in clearedPos.stops[0]).toBe(false);

      // Updating ColorHint position
      const updatedHint = expectSuccess(updateStop(linear, 'h1', { position: length(40, 'px') }));
      expect(updatedHint.stops[1]).toEqual({
        kind: 'hint',
        id: 'h1',
        position: length(40, 'px'),
      });
      expect(updatedHint.stops[0]).toBe(s1);
      expect(updatedHint.stops[2]).toBe(s2);
    });

    it('returns identical reference on structural no-op and treats CSS-equivalent but structurally distinct values as changes', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const s2 = createColorStop({ id: 's2', color: hsl(0, 100, 50) });
      const h1 = createColorHint({ id: 'h1', position: percentage(50) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1, h1, s2] });

      expect(expectSuccess(updateStop(linear, 's1', {}))).toBe(linear);
      expect(
        expectSuccess(
          updateStop(linear, 's1', {
            color: srgb(255, 0, 0, 1),
            position: percentage(0),
          }),
        ),
      ).toBe(linear);
      expect(expectSuccess(updateStop(linear, 's2', { position: undefined }))).toBe(linear);
      expect(expectSuccess(updateStop(linear, 'h1', { position: percentage(50) }))).toBe(linear);
      expect(expectSuccess(updateStop(linear, 'h1', {}))).toBe(linear);

      // CSS-equivalent color in different space (srgb red vs hsl red) is NOT a structural no-op
      const differentSpace = expectSuccess(updateStop(linear, 's1', { color: hsl(0, 100, 50, 1) }));
      expect(differentSpace).not.toBe(linear);

      // CSS-equivalent angle in different unit or unnormalized angle is NOT a structural no-op
      const conic = createConicGradient({
        id: 'conic-1',
        stops: [
          createColorStop({ id: 'c1', color: srgb(0, 0, 0), position: angle(360, 'deg') }),
          createColorStop({ id: 'c2', color: srgb(255, 255, 255), position: angle(0, 'deg') }),
        ],
      });
      const turnEquivalent = expectSuccess(updateStop(conic, 'c1', { position: angle(1, 'turn') }));
      expect(turnEquivalent).not.toBe(conic);
      expect(turnEquivalent.stops[0].position).toEqual(angle(1, 'turn'));

      const fullCircleEquivalent = expectSuccess(
        updateStop(conic, 'c2', { position: angle(360, 'deg') }),
      );
      expect(fullCircleEquivalent).not.toBe(conic);
    });

    it('rejects invalid patches including runtime id/kind injection and never copies extraneous properties', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const h1 = createColorHint({ id: 'h1', position: percentage(50) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1, h1] });

      expect(expectFailure(updateStop(linear, 'nope', { position: percentage(20) })).code).toBe(
        'STOP_NOT_FOUND',
      );

      expect(
        expectFailure(
          updateStop(linear, 's1', {
            color: undefined as unknown as ReturnType<typeof srgb>,
          }),
        ).code,
      ).toBe('INVALID_STOP_PATCH');

      expect(expectFailure(updateStop(linear, 'h1', { color: srgb(0, 0, 0) })).code).toBe(
        'INVALID_STOP_PATCH',
      );

      expect(expectFailure(updateStop(linear, 'h1', { position: undefined })).code).toBe(
        'INVALID_STOP_PATCH',
      );

      // Runtime patch variable containing id or kind must be rejected
      const patchWithId = { id: 'hijacked', color: srgb(0, 0, 0) };
      expect(
        expectFailure(
          updateStop(linear, 's1', patchWithId as unknown as GradientStopPatch<LengthPercentage>),
        ).code,
      ).toBe('INVALID_STOP_PATCH');

      const patchWithKind = { kind: 'hint', position: percentage(30) };
      expect(
        expectFailure(
          updateStop(linear, 's1', patchWithKind as unknown as GradientStopPatch<LengthPercentage>),
        ).code,
      ).toBe('INVALID_STOP_PATCH');

      // Extraneous properties on patch variable must not leak onto updated stop
      const patchWithExtra = { color: srgb(0, 255, 0), extraField: 'should-not-copy' };
      const updated = expectSuccess(updateStop(linear, 's1', patchWithExtra));
      expect('extraField' in updated.stops[0]).toBe(false);
      expect(updated.stops[0].id).toBe('s1');
      expect(updated.stops[0].kind).toBe('color');

      // Runtime incompatible stop position unit
      expect(
        expectFailure(
          updateStop(linear, 's1', {
            position: angle(90, 'deg') as unknown as LengthPercentage,
          }),
        ).code,
      ).toBe('INCOMPATIBLE_STOP_POSITION');
    });
  });

  describe('moveStop', () => {
    it('reorders stops immutably, shares all stop references, and returns identical reference when index is unchanged', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const h1 = createColorHint({ id: 'h1', position: percentage(50) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1, h1, s2] });

      const forward = expectSuccess(moveStop(linear, 's1', 2));
      expect(forward.stops).toEqual([h1, s2, s1]);
      expect(forward.stops[0]).toBe(h1);
      expect(forward.stops[1]).toBe(s2);
      expect(forward.stops[2]).toBe(s1);

      const backward = expectSuccess(moveStop(linear, 's2', 0));
      expect(backward.stops).toEqual([s2, s1, h1]);

      expect(expectSuccess(moveStop(linear, 'h1', 1))).toBe(linear);
      expect(linear.stops).toEqual([s1, h1, s2]);
    });

    it('rejects missing stopId and invalid target indices', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1, s2] });

      const missing = expectFailure(moveStop(linear, 'unknown', 0));
      expect(missing.code).toBe('STOP_NOT_FOUND');
      expect(missing.stopId).toBe('unknown');

      for (const badIndex of [-1, 2, 1.5, Number.NaN]) {
        const err = expectFailure(moveStop(linear, 's1', badIndex));
        expect(err.code).toBe('INVALID_STOP_INDEX');
        expect(Object.is(err.index, badIndex)).toBe(true);
      }
    });
  });

  describe('duplicateStop', () => {
    it('duplicates color stops and hints immediately after source by default, or at explicit index/position', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(20) });
      const h1 = createColorHint({ id: 'h1', position: percentage(50) });
      const s2 = createColorStop({ id: 's2', color: srgb(0, 0, 255) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1, h1, s2] });

      const dupColor = expectSuccess(duplicateStop(linear, 's1', { id: 's1-copy' }));
      expect(dupColor.stops.map((stop) => stop.id)).toEqual(['s1', 's1-copy', 'h1', 's2']);
      const copy = expectColorStop(dupColor.stops[1]);
      expect(copy).toEqual({
        kind: 'color',
        id: 's1-copy',
        color: s1.color,
        position: s1.position,
      });
      expect(copy).not.toBe(s1);
      expect(copy.color).toBe(s1.color);
      expect(copy.position).toBe(s1.position);
      expect(dupColor.stops[0]).toBe(s1);
      expect(dupColor.stops[2]).toBe(h1);
      expect(dupColor.stops[3]).toBe(s2);

      const dupWithOverrides = expectSuccess(
        duplicateStop(linear, 's1', {
          id: 's1-cleared',
          index: 3,
          position: undefined,
        }),
      );
      expect(dupWithOverrides.stops[3]).toEqual({
        kind: 'color',
        id: 's1-cleared',
        color: s1.color,
      });
      expect('position' in dupWithOverrides.stops[3]).toBe(false);

      const dupAutoColor = expectSuccess(
        duplicateStop(linear, 's2', {
          id: 's2-copy',
          index: 0,
          position: length(32, 'px'),
        }),
      );
      expect(dupAutoColor.stops[0]).toEqual({
        kind: 'color',
        id: 's2-copy',
        color: s2.color,
        position: length(32, 'px'),
      });

      const dupHint = expectSuccess(
        duplicateStop(linear, 'h1', { id: 'h1-copy', position: percentage(75) }),
      );
      expect(dupHint.stops[2]).toEqual({
        kind: 'hint',
        id: 'h1-copy',
        position: percentage(75),
      });
    });

    it('rejects missing source, invalid/duplicate id, invalid index, clearing hint position, and incompatible unit', () => {
      const s1 = createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) });
      const h1 = createColorHint({ id: 'h1', position: percentage(50) });
      const linear = createLinearGradient({ id: 'lin-1', stops: [s1, h1] });

      expect(expectFailure(duplicateStop(linear, 'missing', { id: 'x' })).code).toBe(
        'STOP_NOT_FOUND',
      );
      expect(expectFailure(duplicateStop(linear, 's1', { id: '  ' })).code).toBe('INVALID_STOP_ID');

      const dupId = expectFailure(duplicateStop(linear, 's1', { id: 'h1' }));
      expect(dupId.code).toBe('DUPLICATE_STOP_ID');
      expect(dupId.stopId).toBe('h1');

      const badIndex = expectFailure(duplicateStop(linear, 's1', { id: 's2', index: 5 }));
      expect(badIndex.code).toBe('INVALID_STOP_INDEX');
      expect(badIndex.index).toBe(5);

      expect(
        expectFailure(duplicateStop(linear, 'h1', { id: 'h2', position: undefined })).code,
      ).toBe('INVALID_STOP_PATCH');

      expect(
        expectFailure(
          duplicateStop(linear, 's1', {
            id: 's2',
            position: angle(90, 'deg') as unknown as LengthPercentage,
          }),
        ).code,
      ).toBe('INCOMPATIBLE_STOP_POSITION');
    });
  });

  describe('compile-time type safety', () => {
    it('prevents unsound literal/tuple return types, preserves radial branches and unions, and blocks type widening via NoInfer', () => {
      const constLinear = {
        kind: 'linear',
        id: 'const-lin',
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
        id: 'const-circle',
        repeating: false,
        shape: 'circle',
        stops: [],
      } as const;

      const constEllipse = {
        kind: 'radial',
        id: 'const-ellipse',
        repeating: false,
        shape: 'ellipse',
        size: ellipseRadialRadiiSize(percentage(50), length(40, 'px')),
        stops: [],
      } as const;

      const constUnspecified = {
        kind: 'radial',
        id: 'const-unspecified',
        repeating: false,
        stops: [],
      } as const;

      const constConic = {
        kind: 'conic',
        id: 'const-conic',
        repeating: false,
        stops: [],
      } as const;

      const addedLinear = addStop(
        constLinear,
        createColorStop({ id: 's2', color: srgb(0, 0, 255), position: length(20, 'px') }),
      );
      expectTypeOf(addedLinear).toEqualTypeOf<GradientOperationResult<LinearGradient>>();

      const addedCircle = addStop(constCircle, createColorStop({ id: 's1', color: srgb(0, 0, 0) }));
      expectTypeOf(addedCircle).toEqualTypeOf<GradientOperationResult<CircleRadialGradient>>();

      const updatedEllipse = updateStop(constEllipse, 's1', { position: percentage(50) });
      expectTypeOf(updatedEllipse).toEqualTypeOf<GradientOperationResult<EllipseRadialGradient>>();

      const movedUnspecified = moveStop(constUnspecified, 's1', 0);
      expectTypeOf(movedUnspecified).toEqualTypeOf<
        GradientOperationResult<UnspecifiedShapeRadialGradient>
      >();

      const duplicatedConic = duplicateStop(constConic, 's1', {
        id: 's2',
        position: angle(90, 'deg'),
      });
      expectTypeOf(duplicatedConic).toEqualTypeOf<GradientOperationResult<ConicGradient>>();

      expectTypeOf<StopPositionOf<LinearGradient>>().toEqualTypeOf<LengthPercentage>();
      expectTypeOf<StopPositionOf<RadialGradient>>().toEqualTypeOf<LengthPercentage>();
      expectTypeOf<
        StopPositionOf<LinearGradient | RadialGradient>
      >().toEqualTypeOf<LengthPercentage>();
      expectTypeOf<StopPositionOf<ConicGradient>>().toEqualTypeOf<AnglePercentage>();
      expectTypeOf<StopPositionOf<Gradient>>().toEqualTypeOf<Percentage>();
      expectTypeOf<StopPositionOf<LinearGradient | ConicGradient>>().toEqualTypeOf<Percentage>();

      // Verify union inputs without TypeScript control-flow narrowing
      const verifyUnionTypes = (
        anyGradient: Gradient,
        linearOrRadial: LinearGradient | RadialGradient,
        radialUnion: RadialGradient,
      ) => {
        const addedToLinearOrRadial = addStop(
          linearOrRadial,
          createColorStop({ id: 's1', color: srgb(0, 0, 0), position: length(10, 'px') }),
        );
        expectTypeOf(addedToLinearOrRadial).toEqualTypeOf<
          GradientOperationResult<LinearGradient | RadialGradient>
        >();

        const addedToRadial = addStop(
          radialUnion,
          createColorStop({ id: 's1', color: srgb(0, 0, 0), position: length(10, 'px') }),
        );
        expectTypeOf(addedToRadial).toEqualTypeOf<GradientOperationResult<RadialGradient>>();

        const addedAutoToUnion = addStop(
          anyGradient,
          createColorStop({ id: 's1', color: srgb(0, 0, 0) }),
        );
        expectTypeOf(addedAutoToUnion).toEqualTypeOf<GradientOperationResult<Gradient>>();

        const addedPercentToUnion = addStop(
          anyGradient,
          createColorStop({ id: 's2', color: srgb(255, 255, 255), position: percentage(50) }),
        );
        expectTypeOf(addedPercentToUnion).toEqualTypeOf<GradientOperationResult<Gradient>>();

        const removedFromUnion = removeStop(anyGradient, 's1');
        expectTypeOf(removedFromUnion).toEqualTypeOf<GradientOperationResult<Gradient>>();

        const angleStop = createColorStop({
          id: 'ang',
          color: srgb(0, 0, 0),
          position: angle(90, 'deg'),
        });
        const lengthStop = createColorStop({
          id: 'len',
          color: srgb(0, 0, 0),
          position: length(16, 'px'),
        });

        // NoInfer prevents widening constLinear/constCircle/constConic into Gradient union
        // @ts-expect-error linear gradient cannot accept angle stop
        addStop(constLinear, angleStop);
        // @ts-expect-error radial gradient cannot accept angle stop
        addStop(constCircle, angleStop);
        // @ts-expect-error linear|radial union cannot accept angle stop
        addStop(linearOrRadial, angleStop);
        // @ts-expect-error conic gradient cannot accept length stop
        addStop(constConic, lengthStop);
        // @ts-expect-error Gradient union cannot accept length stop without narrowing
        addStop(anyGradient, lengthStop);
        // @ts-expect-error Gradient union cannot accept angle stop without narrowing
        addStop(anyGradient, angleStop);

        // @ts-expect-error linear gradient patch cannot accept angle position
        updateStop(constLinear, 's1', { position: angle(45, 'deg') });
        // @ts-expect-error conic gradient patch cannot accept length position
        updateStop(constConic, 's1', { position: length(10, 'px') });
        // @ts-expect-error Gradient union patch cannot accept length position without narrowing
        updateStop(anyGradient, 's1', { position: length(10, 'px') });
        // @ts-expect-error Gradient union patch cannot accept angle position without narrowing
        updateStop(anyGradient, 's1', { position: angle(45, 'deg') });

        // @ts-expect-error duplicateStop on linear cannot accept angle position
        duplicateStop(constLinear, 's1', { id: 's2', position: angle(45, 'deg') });
        // @ts-expect-error duplicateStop on conic cannot accept length position
        duplicateStop(constConic, 's1', { id: 's2', position: length(10, 'px') });
        // @ts-expect-error duplicateStop on Gradient union cannot accept length position
        duplicateStop(anyGradient, 's1', { id: 's2', position: length(10, 'px') });
        // @ts-expect-error duplicateStop on Gradient union cannot accept angle position
        duplicateStop(anyGradient, 's1', { id: 's2', position: angle(45, 'deg') });

        // Block id/kind mutation even through patch variables (not only object literals)
        const patchWithIdVar = { id: 'new-id', color: srgb(0, 0, 0) };
        const patchWithKindVar = { kind: 'hint' as const, position: percentage(50) };
        // @ts-expect-error patch variable containing id is forbidden
        updateStop(constLinear, 's1', patchWithIdVar);
        // @ts-expect-error patch variable containing kind is forbidden
        updateStop(constLinear, 's1', patchWithKindVar);
      };

      expect(typeof verifyUnionTypes).toBe('function');
    });
  });
});
