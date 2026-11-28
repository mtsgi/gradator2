import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { hsl, srgb } from './color.ts';
import {
  GRADIENT_KINDS,
  LINEAR_SIDE_OR_CORNERS,
  RADIAL_EXTENTS,
  RADIAL_SHAPES,
  circleRadialRadiusSize,
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
  ellipseRadialRadiiSize,
  isCircleRadialGradient,
  isCircleRadialRadiusSize,
  isConicGradient,
  isEllipseRadialGradient,
  isEllipseRadialRadiiSize,
  isGradientKind,
  isLinearAngleDirection,
  isLinearGradient,
  isLinearSideOrCornerDirection,
  isRadialExtentSize,
  isRadialGradient,
  isUnspecifiedShapeRadialGradient,
  linearAngleDirection,
  linearSideOrCornerDirection,
  radialExtentSize,
  type CircleRadialGradient,
  type ConicGradient,
  type CreateRadialGradientInput,
  type EllipseRadialGradient,
  type Gradient,
  type LinearAngleDirection,
  type LinearDirection,
  type LinearGradient,
  type LinearSideOrCornerDirection,
  type RadialGradient,
  type RadialSize,
  type UnspecifiedShapeRadialGradient,
} from './gradient.ts';
import {
  gradientPosition,
  horizontalEdgeOffset,
  horizontalKeyword,
  positionValue,
  verticalEdgeOffset,
  verticalKeyword,
} from './position.ts';
import { createColorHint, createColorStop, type LinearGradientStop } from './stop.ts';
import { angle, length, percentage } from './units.ts';

describe('gradient', () => {
  it('exposes gradient constants and kind type guard', () => {
    expect(GRADIENT_KINDS).toEqual(['linear', 'radial', 'conic']);
    expect(LINEAR_SIDE_OR_CORNERS).toHaveLength(8);
    expect(RADIAL_SHAPES).toEqual(['circle', 'ellipse']);
    expect(RADIAL_EXTENTS).toEqual([
      'closest-side',
      'farthest-side',
      'closest-corner',
      'farthest-corner',
    ]);

    for (const kind of GRADIENT_KINDS) {
      expect(isGradientKind(kind)).toBe(true);
    }
    expect(isGradientKind('mesh')).toBe(false);
    expect(isGradientKind(undefined)).toBe(false);
  });

  it('constructs LinearGradient with omitted, angle, and side-or-corner directions', () => {
    const start = createColorStop({ id: 's1', color: srgb(255, 0, 0) });
    const hint = createColorHint({ id: 'h1', position: percentage(40) });
    const end = createColorStop({ id: 's2', color: srgb(0, 0, 255), position: length(200, 'px') });

    const minimal = createLinearGradient({
      id: 'lin-1',
      stops: [start, end],
    });
    expect(minimal.kind).toBe('linear');
    expect(minimal.repeating).toBe(false);
    expect('direction' in minimal).toBe(false);

    const angled = createLinearGradient({
      id: 'lin-2',
      repeating: true,
      direction: linearAngleDirection(angle(45, 'deg')),
      stops: [start, hint, end],
    });
    expect(angled.repeating).toBe(true);
    expect(angled.direction).toEqual({ kind: 'angle', angle: { value: 45, unit: 'deg' } });

    const corner = createLinearGradient({
      id: 'lin-3',
      direction: linearSideOrCornerDirection('top right'),
      stops: [start, end],
    });
    expect(corner.direction).toEqual({ kind: 'side-or-corner', to: 'top right' });

    const dirs: readonly LinearDirection[] = [angled.direction!, corner.direction!];
    expect(isLinearAngleDirection(dirs[0])).toBe(true);
    expect(isLinearSideOrCornerDirection(dirs[0])).toBe(false);
    expect(isLinearSideOrCornerDirection(dirs[1])).toBe(true);
    if (isLinearAngleDirection(dirs[0])) {
      expectTypeOf(dirs[0]).toEqualTypeOf<LinearAngleDirection>();
    }
    if (isLinearSideOrCornerDirection(dirs[1])) {
      expectTypeOf(dirs[1]).toEqualTypeOf<LinearSideOrCornerDirection>();
    }
  });

  it('constructs RadialGradient variants safely across circle, ellipse, unspecified shape, and union input', () => {
    const stops = [
      createColorStop({ id: 's1', color: srgb(255, 255, 255) }),
      createColorStop({ id: 's2', color: hsl(220, 90, 50), position: percentage(100) }),
    ] as const;

    const circle = createRadialGradient({
      id: 'rad-circle',
      shape: 'circle',
      size: circleRadialRadiusSize(length(80, 'px')),
      position: gradientPosition(
        horizontalEdgeOffset('right', length(20, 'px')),
        verticalEdgeOffset('bottom', percentage(10)),
      ),
      stops,
    });
    expectTypeOf(circle).toEqualTypeOf<CircleRadialGradient>();
    expect(isCircleRadialGradient(circle)).toBe(true);
    expect(isEllipseRadialGradient(circle)).toBe(false);
    expect(isUnspecifiedShapeRadialGradient(circle)).toBe(false);
    expect(circle.size).toEqual({ kind: 'length', radius: { value: 80, unit: 'px' } });

    const ellipse = createRadialGradient({
      id: 'rad-ellipse',
      repeating: true,
      shape: 'ellipse',
      size: ellipseRadialRadiiSize(percentage(50), length(120, 'px')),
      position: gradientPosition(horizontalKeyword('center'), verticalKeyword('top')),
      stops,
    });
    expectTypeOf(ellipse).toEqualTypeOf<EllipseRadialGradient>();
    expect(isEllipseRadialGradient(ellipse)).toBe(true);
    expect(ellipse.repeating).toBe(true);

    const unspecified = createRadialGradient({
      id: 'rad-unspecified',
      size: radialExtentSize('closest-side'),
      stops,
    });
    expectTypeOf(unspecified).toEqualTypeOf<UnspecifiedShapeRadialGradient>();
    expect(isUnspecifiedShapeRadialGradient(unspecified)).toBe(true);
    expect('shape' in unspecified).toBe(false);
    expect('position' in unspecified).toBe(false);

    const bare = createRadialGradient({
      id: 'rad-bare',
      stops,
    });
    expectTypeOf(bare).toEqualTypeOf<UnspecifiedShapeRadialGradient>();
    expect('size' in bare).toBe(false);
    expect('shape' in bare).toBe(false);

    const unionInputs: readonly CreateRadialGradientInput[] = [
      { id: 'u1', shape: 'circle', stops },
      { id: 'u2', shape: 'ellipse', size: radialExtentSize('farthest-corner'), stops },
      { id: 'u3', size: circleRadialRadiusSize(length(30, 'px')), stops },
    ];
    const fromUnion = unionInputs.map((input) => createRadialGradient(input));
    expectTypeOf(fromUnion).toEqualTypeOf<RadialGradient[]>();
    expect(fromUnion.map((g) => g.shape)).toEqual(['circle', 'ellipse', undefined]);

    const sizes: readonly RadialSize[] = [
      radialExtentSize('farthest-side'),
      circleRadialRadiusSize(length(50, 'px')),
      ellipseRadialRadiiSize(percentage(40), percentage(60)),
    ];
    expect(isRadialExtentSize(sizes[0])).toBe(true);
    expect(isCircleRadialRadiusSize(sizes[1])).toBe(true);
    expect(isEllipseRadialRadiiSize(sizes[2])).toBe(true);
  });

  it('constructs ConicGradient with optional angle, position, and angle/percentage stops', () => {
    const autoStop = createColorStop({ id: 'c1', color: srgb(255, 0, 0) });
    const hint = createColorHint({ id: 'ch1', position: angle(0.25, 'turn') });
    const endStop = createColorStop({
      id: 'c2',
      color: hsl(240, 100, 50),
      position: percentage(100),
    });

    const minimal = createConicGradient({
      id: 'conic-1',
      stops: [autoStop, endStop],
    });
    expect(minimal.kind).toBe('conic');
    expect(minimal.repeating).toBe(false);
    expect('angle' in minimal).toBe(false);
    expect('position' in minimal).toBe(false);

    const full = createConicGradient({
      id: 'conic-2',
      repeating: true,
      angle: angle(90, 'deg'),
      position: gradientPosition(positionValue(percentage(50)), verticalKeyword('center')),
      stops: [autoStop, hint, endStop],
    });
    expect(full.repeating).toBe(true);
    expect(full.angle).toEqual({ value: 90, unit: 'deg' });
    expect(full.stops).toHaveLength(3);
  });

  it('discriminates Gradient union safely with type guards and switch', () => {
    const autoStop = createColorStop({ id: 's1', color: srgb(0, 0, 0) });
    const gradients: readonly Gradient[] = [
      createLinearGradient({ id: 'g1', stops: [autoStop] }),
      createRadialGradient({ id: 'g2', shape: 'circle', stops: [autoStop] }),
      createConicGradient({ id: 'g3', stops: [autoStop] }),
    ];

    expect(isLinearGradient(gradients[0])).toBe(true);
    expect(isRadialGradient(gradients[0])).toBe(false);
    expect(isRadialGradient(gradients[1])).toBe(true);
    expect(isConicGradient(gradients[2])).toBe(true);

    const labels = gradients.map((gradient) => {
      switch (gradient.kind) {
        case 'linear': {
          expectTypeOf(gradient).toEqualTypeOf<LinearGradient>();
          return `linear:${gradient.id}`;
        }
        case 'radial': {
          expectTypeOf(gradient).toEqualTypeOf<RadialGradient>();
          return `radial:${gradient.id}`;
        }
        case 'conic': {
          expectTypeOf(gradient).toEqualTypeOf<ConicGradient>();
          return `conic:${gradient.id}`;
        }
      }
    });
    expect(labels).toEqual(['linear:g1', 'radial:g2', 'conic:g3']);
  });

  it('copies input stops array shallowly without deep freezing', () => {
    const stops: LinearGradientStop[] = [
      createColorStop({ id: 's1', color: srgb(255, 0, 0), position: percentage(0) }),
    ];

    const linear = createLinearGradient({ id: 'g1', stops });
    const radial = createRadialGradient({ id: 'g2', stops });

    stops.push(createColorStop({ id: 's2', color: srgb(0, 0, 255), position: percentage(100) }));

    expect(linear.stops).toHaveLength(1);
    expect(radial.stops).toHaveLength(1);
    expect(Object.isFrozen(linear)).toBe(false);
    expect(Object.isFrozen(linear.stops)).toBe(false);
  });

  it('rejects invalid radial shape/size combinations and stop units at compile time', () => {
    const autoStop = createColorStop({ id: 's1', color: srgb(0, 0, 0) });

    // Verify invalid combinations are caught by the TypeScript compiler
    const verifyCompileTimeConstraints = () => {
      // @ts-expect-error circle radial gradient cannot accept ellipse radii
      createRadialGradient({
        id: 'bad-circle',
        shape: 'circle',
        size: ellipseRadialRadiiSize(percentage(50), percentage(50)),
        stops: [autoStop],
      });

      // @ts-expect-error ellipse radial gradient cannot accept single circle length radius
      createRadialGradient({
        id: 'bad-ellipse',
        shape: 'ellipse',
        size: circleRadialRadiusSize(length(40, 'px')),
        stops: [autoStop],
      });

      createLinearGradient({
        id: 'bad-linear-stop',
        stops: [
          // @ts-expect-error linear gradient stops cannot use angle units
          createColorStop({ id: 'ang', color: srgb(0, 0, 0), position: angle(45, 'deg') }),
        ],
      });

      createConicGradient({
        id: 'bad-conic-stop',
        stops: [
          // @ts-expect-error conic gradient stops cannot use length units
          createColorStop({ id: 'len', color: srgb(0, 0, 0), position: length(20, 'px') }),
        ],
      });
    };

    expect(typeof verifyCompileTimeConstraints).toBe('function');
  });
});
