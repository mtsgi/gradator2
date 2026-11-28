import type {
  CircleRadialGradient,
  CircleRadialSize,
  ConicGradient,
  EllipseRadialGradient,
  EllipseRadialSize,
  Gradient,
  GradientKind,
  LinearDirection,
  LinearGradient,
  RadialGradient,
  RadialShape,
  RadialSize,
} from './gradient.ts';
import {
  buildRadialGradient,
  createNoopSuccess,
  createOperationFailure,
  createOperationSuccess,
  isCompatibleRadialSize,
  isCompatibleStopPosition,
  isSameGradientPosition,
  isSameLinearDirection,
  isSameRadialSize,
  isSameStopPosition,
  rebuildGradientWithRepeating,
} from './operation-internal.ts';
import type {
  GradientOperationFailure,
  GradientOperationResult,
  GradientVariantOf,
} from './operation-result.ts';
import type { GradientPosition } from './position.ts';
import type {
  ColorHint,
  ColorStop,
  ConicGradientStop,
  GradientStop,
  LinearGradientStop,
} from './stop.ts';
import { isAngle, percentage, type Angle, type Percentage } from './units.ts';

export type LinearRadialIncompatibleStopStrategy = 'error' | 'convert-angle' | 'drop';

export type ConicIncompatibleStopStrategy = 'error' | 'drop';

export type IncompatibleStopPositionStrategy =
  | LinearRadialIncompatibleStopStrategy
  | ConicIncompatibleStopStrategy;

export type GradientByKind<TKind extends GradientKind> = TKind extends 'linear'
  ? LinearGradient
  : TKind extends 'radial'
    ? RadialGradient
    : ConicGradient;

export interface SetLinearGradientKindOptions {
  readonly direction?: LinearDirection | undefined;
  readonly incompatibleStopPosition?: LinearRadialIncompatibleStopStrategy;
}

export interface SetRadialGradientKindBaseOptions {
  readonly position?: GradientPosition | undefined;
  readonly incompatibleStopPosition?: LinearRadialIncompatibleStopStrategy;
}

export interface SetCircleRadialGradientKindOptions extends SetRadialGradientKindBaseOptions {
  readonly shape: 'circle';
  readonly size?: CircleRadialSize | undefined;
}

export interface SetEllipseRadialGradientKindOptions extends SetRadialGradientKindBaseOptions {
  readonly shape: 'ellipse';
  readonly size?: EllipseRadialSize | undefined;
}

export interface SetUnspecifiedShapeRadialGradientKindOptions extends SetRadialGradientKindBaseOptions {
  readonly shape?: undefined;
  readonly size?: RadialSize | undefined;
}

export type SetRadialGradientKindOptions =
  | SetCircleRadialGradientKindOptions
  | SetEllipseRadialGradientKindOptions
  | SetUnspecifiedShapeRadialGradientKindOptions;

export interface SetConicGradientKindOptions {
  readonly angle?: Angle | undefined;
  readonly position?: GradientPosition | undefined;
  readonly incompatibleStopPosition?: ConicIncompatibleStopStrategy;
}

export interface SetSharedGradientKindOptions {
  readonly incompatibleStopPosition?: ConicIncompatibleStopStrategy;
}

export interface SetLinearRadialSharedGradientKindOptions {
  readonly incompatibleStopPosition?: LinearRadialIncompatibleStopStrategy;
}

export interface SetRadialConicSharedGradientKindOptions {
  readonly position?: GradientPosition | undefined;
  readonly incompatibleStopPosition?: ConicIncompatibleStopStrategy;
}

export type SetGradientKindOptions<TKind extends GradientKind = GradientKind> = [TKind] extends [
  never,
]
  ? never
  : [TKind] extends ['linear']
    ? SetLinearGradientKindOptions
    : [TKind] extends ['radial']
      ? SetRadialGradientKindOptions
      : [TKind] extends ['conic']
        ? SetConicGradientKindOptions
        : [TKind] extends ['linear' | 'radial']
          ? SetLinearRadialSharedGradientKindOptions
          : [TKind] extends ['radial' | 'conic']
            ? SetRadialConicSharedGradientKindOptions
            : SetSharedGradientKindOptions;

type AnySetGradientKindOptions =
  | SetLinearGradientKindOptions
  | SetRadialGradientKindOptions
  | SetConicGradientKindOptions
  | SetSharedGradientKindOptions;

function angleToRelativePercentage(angleValue: Angle): Percentage {
  switch (angleValue.unit) {
    case 'deg':
      return percentage((angleValue.value * 100) / 360);
    case 'grad':
      return percentage(angleValue.value / 4);
    case 'turn':
      return percentage(angleValue.value * 100);
    case 'rad':
      return percentage((angleValue.value / (2 * Math.PI)) * 100);
  }
}

type ConvertedStopsResult<TStop extends GradientStop> =
  | { readonly ok: true; readonly stops: readonly TStop[] }
  | GradientOperationFailure;

function convertStopsForLinearOrRadial(
  stops: readonly GradientStop[],
  targetKind: 'linear' | 'radial',
  strategy: LinearRadialIncompatibleStopStrategy,
): ConvertedStopsResult<LinearGradientStop> {
  let mutated = false;
  const converted: LinearGradientStop[] = [];

  for (const stop of stops) {
    if (stop.position === undefined || isCompatibleStopPosition(targetKind, stop.position)) {
      converted.push(stop as LinearGradientStop);
      continue;
    }

    if (strategy === 'convert-angle' && isAngle(stop.position)) {
      mutated = true;
      const convertedPosition = angleToRelativePercentage(stop.position);
      if (stop.kind === 'color') {
        const nextStop: ColorStop<Percentage> = {
          kind: 'color',
          id: stop.id,
          color: stop.color,
          position: convertedPosition,
        };
        converted.push(nextStop);
      } else {
        const nextHint: ColorHint<Percentage> = {
          kind: 'hint',
          id: stop.id,
          position: convertedPosition,
        };
        converted.push(nextHint);
      }
      continue;
    }

    if (strategy === 'drop') {
      mutated = true;
      if (stop.kind === 'color') {
        const droppedStop: ColorStop<never> = {
          kind: 'color',
          id: stop.id,
          color: stop.color,
        };
        converted.push(droppedStop);
      }
      continue;
    }

    return createOperationFailure(
      'INCOMPATIBLE_STOP_POSITION',
      `Stop "${stop.id}" has position unit "${stop.position.unit}", which is incompatible with "${targetKind}" gradient.`,
      { stopId: stop.id },
    );
  }

  return {
    ok: true,
    stops: mutated ? converted : (stops as readonly LinearGradientStop[]),
  };
}

function convertStopsForConic(
  stops: readonly GradientStop[],
  strategy: ConicIncompatibleStopStrategy,
): ConvertedStopsResult<ConicGradientStop> {
  let mutated = false;
  const converted: ConicGradientStop[] = [];

  for (const stop of stops) {
    if (stop.position === undefined || isCompatibleStopPosition('conic', stop.position)) {
      converted.push(stop as ConicGradientStop);
      continue;
    }

    if (strategy === 'drop') {
      mutated = true;
      if (stop.kind === 'color') {
        const droppedStop: ColorStop<never> = {
          kind: 'color',
          id: stop.id,
          color: stop.color,
        };
        converted.push(droppedStop);
      }
      continue;
    }

    return createOperationFailure(
      'INCOMPATIBLE_STOP_POSITION',
      `Stop "${stop.id}" has position unit "${stop.position.unit}", which is incompatible with "conic" gradient.`,
      { stopId: stop.id },
    );
  }

  return {
    ok: true,
    stops: mutated ? converted : (stops as readonly ConicGradientStop[]),
  };
}

export function setRepeating<TGradient extends Gradient>(
  gradient: TGradient,
  repeating: boolean,
): GradientOperationResult<GradientVariantOf<TGradient>> {
  if (gradient.repeating === repeating) {
    return createNoopSuccess(gradient);
  }
  return createOperationSuccess(rebuildGradientWithRepeating(gradient, repeating));
}

export function setGradientKind(
  gradient: Gradient,
  kind: 'linear',
  options?: SetLinearGradientKindOptions,
): GradientOperationResult<LinearGradient>;
export function setGradientKind(
  gradient: Gradient,
  kind: 'radial',
  options: SetCircleRadialGradientKindOptions,
): GradientOperationResult<CircleRadialGradient>;
export function setGradientKind(
  gradient: Gradient,
  kind: 'radial',
  options: SetEllipseRadialGradientKindOptions,
): GradientOperationResult<EllipseRadialGradient>;
export function setGradientKind(
  gradient: Gradient,
  kind: 'radial',
  options?: SetUnspecifiedShapeRadialGradientKindOptions,
): GradientOperationResult<RadialGradient>;
export function setGradientKind(
  gradient: Gradient,
  kind: 'radial',
  options?: SetRadialGradientKindOptions,
): GradientOperationResult<RadialGradient>;
export function setGradientKind(
  gradient: Gradient,
  kind: 'conic',
  options?: SetConicGradientKindOptions,
): GradientOperationResult<ConicGradient>;
export function setGradientKind<TKind extends GradientKind>(
  gradient: Gradient,
  kind: TKind,
  options?: NoInfer<SetGradientKindOptions<TKind>>,
): GradientOperationResult<GradientByKind<TKind>>;
export function setGradientKind(
  gradient: Gradient,
  kind: GradientKind,
  options?: AnySetGradientKindOptions,
): GradientOperationResult<Gradient> {
  if (kind === 'linear') {
    const linearOptions = options as SetLinearGradientKindOptions | undefined;
    const hasDirection = linearOptions !== undefined && 'direction' in linearOptions;
    const nextDirection = hasDirection
      ? linearOptions.direction
      : gradient.kind === 'linear'
        ? gradient.direction
        : undefined;

    if (gradient.kind === 'linear') {
      if (isSameLinearDirection(gradient.direction, nextDirection)) {
        return createOperationSuccess(gradient);
      }
      const updatedLinear: LinearGradient = {
        kind: 'linear',
        id: gradient.id,
        repeating: gradient.repeating,
        ...(nextDirection === undefined ? {} : { direction: nextDirection }),
        stops: gradient.stops,
      };
      return createOperationSuccess(updatedLinear);
    }

    const strategy: LinearRadialIncompatibleStopStrategy =
      linearOptions?.incompatibleStopPosition ?? 'error';
    const converted = convertStopsForLinearOrRadial(gradient.stops, 'linear', strategy);
    if (!converted.ok) {
      return converted;
    }

    const nextLinear: LinearGradient = {
      kind: 'linear',
      id: gradient.id,
      repeating: gradient.repeating,
      ...(nextDirection === undefined ? {} : { direction: nextDirection }),
      stops: converted.stops,
    };
    return createOperationSuccess(nextLinear);
  }

  if (kind === 'radial') {
    const radialOptions = options as SetRadialGradientKindOptions | undefined;
    const hasShape = radialOptions !== undefined && 'shape' in radialOptions;
    const hasSize = radialOptions !== undefined && 'size' in radialOptions;
    const hasPosition = radialOptions !== undefined && 'position' in radialOptions;

    const nextShape: RadialShape | undefined = hasShape
      ? radialOptions.shape
      : gradient.kind === 'radial'
        ? gradient.shape
        : undefined;

    if (nextShape !== undefined && nextShape !== 'circle' && nextShape !== 'ellipse') {
      return createOperationFailure(
        'INVALID_GEOMETRY',
        `Invalid radial shape "${String(nextShape)}".`,
      );
    }

    const nextSize: RadialSize | undefined = hasSize
      ? radialOptions.size
      : gradient.kind === 'radial'
        ? gradient.size
        : undefined;

    const nextPosition: GradientPosition | undefined = hasPosition
      ? radialOptions.position
      : gradient.kind === 'radial' || gradient.kind === 'conic'
        ? gradient.position
        : undefined;

    if (!isCompatibleRadialSize(nextShape, nextSize)) {
      return createOperationFailure(
        'INVALID_GEOMETRY',
        `Radial size kind "${nextSize?.kind}" is incompatible with radial shape "${nextShape}".`,
      );
    }

    if (gradient.kind === 'radial') {
      const shapeUnchanged = gradient.shape === nextShape;
      const sizeUnchanged = isSameRadialSize(gradient.size, nextSize);
      const positionUnchanged = isSameGradientPosition(gradient.position, nextPosition);
      if (shapeUnchanged && sizeUnchanged && positionUnchanged) {
        return createOperationSuccess(gradient);
      }

      const resolvedSize = sizeUnchanged ? gradient.size : nextSize;
      const resolvedPosition = positionUnchanged ? gradient.position : nextPosition;

      return createOperationSuccess(
        buildRadialGradient(
          gradient.id,
          gradient.repeating,
          nextShape,
          resolvedSize,
          resolvedPosition,
          gradient.stops,
        ),
      );
    }

    const strategy: LinearRadialIncompatibleStopStrategy =
      radialOptions?.incompatibleStopPosition ?? 'error';
    const converted = convertStopsForLinearOrRadial(gradient.stops, 'radial', strategy);
    if (!converted.ok) {
      return converted;
    }

    return createOperationSuccess(
      buildRadialGradient(
        gradient.id,
        gradient.repeating,
        nextShape,
        nextSize,
        nextPosition,
        converted.stops,
      ),
    );
  }

  const conicOptions = options as SetConicGradientKindOptions | undefined;
  const hasAngle = conicOptions !== undefined && 'angle' in conicOptions;
  const hasPosition = conicOptions !== undefined && 'position' in conicOptions;

  const nextAngle: Angle | undefined = hasAngle
    ? conicOptions.angle
    : gradient.kind === 'conic'
      ? gradient.angle
      : undefined;

  const nextPosition: GradientPosition | undefined = hasPosition
    ? conicOptions.position
    : gradient.kind === 'conic' || gradient.kind === 'radial'
      ? gradient.position
      : undefined;

  if (gradient.kind === 'conic') {
    const angleUnchanged = isSameStopPosition(gradient.angle, nextAngle);
    const positionUnchanged = isSameGradientPosition(gradient.position, nextPosition);
    if (angleUnchanged && positionUnchanged) {
      return createOperationSuccess(gradient);
    }

    const resolvedAngle = angleUnchanged ? gradient.angle : nextAngle;
    const resolvedPosition = positionUnchanged ? gradient.position : nextPosition;

    const updatedConic: ConicGradient = {
      kind: 'conic',
      id: gradient.id,
      repeating: gradient.repeating,
      ...(resolvedAngle === undefined ? {} : { angle: resolvedAngle }),
      ...(resolvedPosition === undefined ? {} : { position: resolvedPosition }),
      stops: gradient.stops,
    };
    return createOperationSuccess(updatedConic);
  }

  const strategy: ConicIncompatibleStopStrategy = conicOptions?.incompatibleStopPosition ?? 'error';
  const converted = convertStopsForConic(gradient.stops, strategy);
  if (!converted.ok) {
    return converted;
  }

  const nextConic: ConicGradient = {
    kind: 'conic',
    id: gradient.id,
    repeating: gradient.repeating,
    ...(nextAngle === undefined ? {} : { angle: nextAngle }),
    ...(nextPosition === undefined ? {} : { position: nextPosition }),
    stops: converted.stops,
  };
  return createOperationSuccess(nextConic);
}
