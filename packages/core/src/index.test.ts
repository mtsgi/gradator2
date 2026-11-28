import { describe, expect, it } from 'vite-plus/test';
import * as core from './index.ts';
import {
  GRADATOR_CORE_VERSION,
  GRADIENT_KINDS,
  GRADIENT_OPERATION_ERROR_CODES,
  addStop,
  angle,
  createColorHint,
  createColorStop,
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
  duplicateStop,
  getCorePackageInfo,
  gradientPosition,
  horizontalKeyword,
  hsl,
  isGradientOperationFailure,
  isGradientOperationSuccess,
  isLinearGradient,
  length,
  linearAngleDirection,
  moveStop,
  percentage,
  radialExtentSize,
  removeStop,
  setGradientKind,
  setRepeating,
  srgb,
  updateStop,
  verticalKeyword,
  type Gradient,
} from './index.ts';

describe('@gradator/core', () => {
  it('exports package metadata and supported gradient kinds', () => {
    const info = getCorePackageInfo();
    expect(info.name).toBe('@gradator/core');
    expect(info.version).toBe(GRADATOR_CORE_VERSION);
    expect(info.supportedKinds).toEqual(['linear', 'radial', 'conic']);
    expect(GRADIENT_KINDS).toHaveLength(3);
  });

  it('re-exports gradient model constructors and guards from the package entrypoint', () => {
    const linear: Gradient = createLinearGradient({
      id: 'hero',
      direction: linearAngleDirection(angle(135, 'deg')),
      stops: [
        createColorStop({ id: 's1', color: srgb(255, 87, 34), position: percentage(0) }),
        createColorHint({ id: 'h1', position: percentage(45) }),
        createColorStop({ id: 's2', color: hsl(260, 80, 55), position: percentage(100) }),
      ],
    });

    const radial: Gradient = createRadialGradient({
      id: 'spot',
      repeating: true,
      shape: 'circle',
      size: radialExtentSize('farthest-corner'),
      position: gradientPosition(horizontalKeyword('center'), verticalKeyword('center')),
      stops: [
        createColorStop({ id: 'r1', color: srgb(255, 255, 255) }),
        createColorStop({ id: 'r2', color: srgb(0, 0, 0, 0), position: length(120, 'px') }),
      ],
    });

    const conic: Gradient = createConicGradient({
      id: 'wheel',
      angle: angle(0.25, 'turn'),
      stops: [
        createColorStop({ id: 'c1', color: hsl(0, 100, 50) }),
        createColorStop({ id: 'c2', color: hsl(180, 100, 50), position: angle(180, 'deg') }),
      ],
    });

    expect(isLinearGradient(linear)).toBe(true);
    expect(radial.kind).toBe('radial');
    expect(conic.kind).toBe('conic');
  });

  it('re-exports gradient editing operations and excludes internal helpers from public exports', () => {
    const unwrap = <TGradient extends Gradient>(
      result: ReturnType<typeof setRepeating<TGradient>>,
    ): TGradient => {
      expect(isGradientOperationSuccess(result)).toBe(true);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.gradient as unknown as TGradient;
    };

    const base = createLinearGradient({
      id: 'flow',
      stops: [createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) })],
    });

    const step1 = unwrap(
      addStop(
        base,
        createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) }),
      ),
    );
    const step2 = unwrap(duplicateStop(step1, 's1', { id: 's1-copy', position: percentage(50) }));
    const step3 = unwrap(updateStop(step2, 's1-copy', { color: hsl(120, 100, 40) }));
    const step4 = unwrap(moveStop(step3, 's1-copy', 2));
    const step5 = unwrap(removeStop(step4, 's2'));
    const step6 = unwrap(setRepeating(step5, true));
    const step7 = unwrap(setGradientKind(step6, 'conic', { angle: angle(90, 'deg') }));

    expect(step7.kind).toBe('conic');
    expect(step7.repeating).toBe(true);
    expect(step7.stops.map((stop) => stop.id)).toEqual(['s1', 's1-copy']);

    const failed = removeStop(base, 'non-existent');
    expect(isGradientOperationFailure(failed)).toBe(true);
    expect(GRADIENT_OPERATION_ERROR_CODES).toContain('STOP_NOT_FOUND');

    // Internal Result creation and comparison helpers must not be exposed publicly
    expect('createOperationSuccess' in core).toBe(false);
    expect('createOperationFailure' in core).toBe(false);
    expect('createNoopSuccess' in core).toBe(false);
    expect('isSameColor' in core).toBe(false);
    expect('rebuildGradientWithStops' in core).toBe(false);
  });
});
