import type { Color } from './color.ts';
import type { ConicGradient, Gradient, LinearGradient, RadialGradient } from './gradient.ts';
import {
  createNoopSuccess,
  createOperationFailure,
  createOperationSuccess,
  isCompatibleStopPosition,
  isSameColor,
  isSameStopPosition,
  isValidStopId,
  isValidStopIndex,
  rebuildGradientWithStops,
} from './operation-internal.ts';
import type { GradientOperationResult, GradientVariantOf } from './operation-result.ts';
import type { ColorHint, ColorStop, GradientStop } from './stop.ts';
import type { AnglePercentage, LengthPercentage, Percentage, StopPosition } from './units.ts';

export type StopPositionOf<TGradient extends Gradient> = [TGradient] extends [never]
  ? never
  : [TGradient] extends [LinearGradient | RadialGradient]
    ? LengthPercentage
    : [TGradient] extends [ConicGradient]
      ? AnglePercentage
      : Percentage;

export type GradientStopOf<TGradient extends Gradient> = GradientStop<StopPositionOf<TGradient>>;

export interface AddStopOptions {
  readonly index?: number;
}

export interface GradientStopPatch<TPosition extends StopPosition = StopPosition> {
  readonly id?: never;
  readonly kind?: never;
  readonly color?: Color;
  readonly position?: TPosition | undefined;
}

export interface DuplicateStopOptions<TPosition extends StopPosition = StopPosition> {
  readonly id: string;
  readonly index?: number;
  readonly position?: TPosition | undefined;
}

export function addStop<TGradient extends Gradient>(
  gradient: TGradient,
  stop: NoInfer<GradientStopOf<TGradient>>,
  options?: AddStopOptions,
): GradientOperationResult<GradientVariantOf<TGradient>> {
  if (!isValidStopId(stop.id)) {
    return createOperationFailure('INVALID_STOP_ID', 'Stop id must be a non-empty string.', {
      stopId: typeof stop.id === 'string' ? stop.id : undefined,
    });
  }

  if (gradient.stops.some((existing) => existing.id === stop.id)) {
    return createOperationFailure(
      'DUPLICATE_STOP_ID',
      `Stop with id "${stop.id}" already exists in gradient "${gradient.id}".`,
      { stopId: stop.id },
    );
  }

  if (stop.position !== undefined && !isCompatibleStopPosition(gradient.kind, stop.position)) {
    return createOperationFailure(
      'INCOMPATIBLE_STOP_POSITION',
      `Stop position unit "${stop.position.unit}" is incompatible with "${gradient.kind}" gradient.`,
      { stopId: stop.id },
    );
  }

  const insertIndex = options?.index ?? gradient.stops.length;
  if (!isValidStopIndex(insertIndex, 0, gradient.stops.length)) {
    return createOperationFailure(
      'INVALID_STOP_INDEX',
      `Stop insert index ${insertIndex} is out of bounds (expected integer in 0..${gradient.stops.length}).`,
      { index: insertIndex },
    );
  }

  const nextStops: GradientStop[] = [
    ...gradient.stops.slice(0, insertIndex),
    stop,
    ...gradient.stops.slice(insertIndex),
  ];

  return createOperationSuccess(rebuildGradientWithStops(gradient, nextStops));
}

export function removeStop<TGradient extends Gradient>(
  gradient: TGradient,
  stopId: string,
): GradientOperationResult<GradientVariantOf<TGradient>> {
  const targetIndex = gradient.stops.findIndex((existing) => existing.id === stopId);
  if (targetIndex === -1) {
    return createOperationFailure(
      'STOP_NOT_FOUND',
      `Stop with id "${stopId}" was not found in gradient "${gradient.id}".`,
      { stopId },
    );
  }

  const nextStops: GradientStop[] = [
    ...gradient.stops.slice(0, targetIndex),
    ...gradient.stops.slice(targetIndex + 1),
  ];

  return createOperationSuccess(rebuildGradientWithStops(gradient, nextStops));
}

export function updateStop<TGradient extends Gradient>(
  gradient: TGradient,
  stopId: string,
  patch: NoInfer<GradientStopPatch<StopPositionOf<TGradient>>>,
): GradientOperationResult<GradientVariantOf<TGradient>> {
  const targetIndex = gradient.stops.findIndex((existing) => existing.id === stopId);
  if (targetIndex === -1) {
    return createOperationFailure(
      'STOP_NOT_FOUND',
      `Stop with id "${stopId}" was not found in gradient "${gradient.id}".`,
      { stopId },
    );
  }

  if ('id' in patch || 'kind' in patch) {
    return createOperationFailure(
      'INVALID_STOP_PATCH',
      'Stop "id" and "kind" cannot be modified via updateStop.',
      { stopId },
    );
  }

  const current = gradient.stops[targetIndex];
  const hasColor = 'color' in patch;
  const hasPosition = 'position' in patch;

  if (hasColor && patch.color === undefined) {
    return createOperationFailure('INVALID_STOP_PATCH', 'Stop color cannot be set to undefined.', {
      stopId,
    });
  }

  if (current.kind === 'hint') {
    if (hasColor) {
      return createOperationFailure(
        'INVALID_STOP_PATCH',
        `Cannot update "color" on color hint "${stopId}".`,
        { stopId },
      );
    }
    if (hasPosition && patch.position === undefined) {
      return createOperationFailure(
        'INVALID_STOP_PATCH',
        `Color hint "${stopId}" requires a defined position.`,
        { stopId },
      );
    }
    if (hasPosition && patch.position !== undefined) {
      if (!isCompatibleStopPosition(gradient.kind, patch.position)) {
        return createOperationFailure(
          'INCOMPATIBLE_STOP_POSITION',
          `Stop position unit "${patch.position.unit}" is incompatible with "${gradient.kind}" gradient.`,
          { stopId },
        );
      }
      if (isSameStopPosition(current.position, patch.position)) {
        return createNoopSuccess(gradient);
      }
      const updatedHint: ColorHint = {
        kind: 'hint',
        id: current.id,
        position: patch.position,
      };
      const nextStops: GradientStop[] = [
        ...gradient.stops.slice(0, targetIndex),
        updatedHint,
        ...gradient.stops.slice(targetIndex + 1),
      ];
      return createOperationSuccess(rebuildGradientWithStops(gradient, nextStops));
    }
    return createNoopSuccess(gradient);
  }

  if (hasPosition && patch.position !== undefined) {
    if (!isCompatibleStopPosition(gradient.kind, patch.position)) {
      return createOperationFailure(
        'INCOMPATIBLE_STOP_POSITION',
        `Stop position unit "${patch.position.unit}" is incompatible with "${gradient.kind}" gradient.`,
        { stopId },
      );
    }
  }

  const colorUnchanged = !hasColor || isSameColor(current.color, patch.color as Color);
  const nextPosition: StopPosition | undefined = hasPosition ? patch.position : current.position;
  const positionUnchanged = !hasPosition || isSameStopPosition(current.position, nextPosition);

  if (colorUnchanged && positionUnchanged) {
    return createNoopSuccess(gradient);
  }

  const resolvedColor: Color = colorUnchanged ? current.color : (patch.color as Color);
  const resolvedPosition: StopPosition | undefined = positionUnchanged
    ? current.position
    : nextPosition;

  const updatedStop: ColorStop =
    resolvedPosition === undefined
      ? {
          kind: 'color',
          id: current.id,
          color: resolvedColor,
        }
      : {
          kind: 'color',
          id: current.id,
          color: resolvedColor,
          position: resolvedPosition,
        };

  const nextStops: GradientStop[] = [
    ...gradient.stops.slice(0, targetIndex),
    updatedStop,
    ...gradient.stops.slice(targetIndex + 1),
  ];

  return createOperationSuccess(rebuildGradientWithStops(gradient, nextStops));
}

export function moveStop<TGradient extends Gradient>(
  gradient: TGradient,
  stopId: string,
  toIndex: number,
): GradientOperationResult<GradientVariantOf<TGradient>> {
  const fromIndex = gradient.stops.findIndex((existing) => existing.id === stopId);
  if (fromIndex === -1) {
    return createOperationFailure(
      'STOP_NOT_FOUND',
      `Stop with id "${stopId}" was not found in gradient "${gradient.id}".`,
      { stopId },
    );
  }

  const maxIndex = gradient.stops.length - 1;
  if (!isValidStopIndex(toIndex, 0, maxIndex)) {
    return createOperationFailure(
      'INVALID_STOP_INDEX',
      `Target stop index ${toIndex} is out of bounds (expected integer in 0..${maxIndex}).`,
      { stopId, index: toIndex },
    );
  }

  if (fromIndex === toIndex) {
    return createNoopSuccess(gradient);
  }

  const target = gradient.stops[fromIndex];
  const nextStops: GradientStop[] = [...gradient.stops];
  nextStops.splice(fromIndex, 1);
  nextStops.splice(toIndex, 0, target);

  return createOperationSuccess(rebuildGradientWithStops(gradient, nextStops));
}

export function duplicateStop<TGradient extends Gradient>(
  gradient: TGradient,
  stopId: string,
  options: NoInfer<DuplicateStopOptions<StopPositionOf<TGradient>>>,
): GradientOperationResult<GradientVariantOf<TGradient>> {
  const sourceIndex = gradient.stops.findIndex((existing) => existing.id === stopId);
  if (sourceIndex === -1) {
    return createOperationFailure(
      'STOP_NOT_FOUND',
      `Stop with id "${stopId}" was not found in gradient "${gradient.id}".`,
      { stopId },
    );
  }

  if (!isValidStopId(options.id)) {
    return createOperationFailure('INVALID_STOP_ID', 'Duplicated stop id must be non-empty.', {
      stopId: typeof options.id === 'string' ? options.id : undefined,
    });
  }

  if (gradient.stops.some((existing) => existing.id === options.id)) {
    return createOperationFailure(
      'DUPLICATE_STOP_ID',
      `Stop with id "${options.id}" already exists in gradient "${gradient.id}".`,
      { stopId: options.id },
    );
  }

  const insertIndex = options.index ?? sourceIndex + 1;
  if (!isValidStopIndex(insertIndex, 0, gradient.stops.length)) {
    return createOperationFailure(
      'INVALID_STOP_INDEX',
      `Stop insert index ${insertIndex} is out of bounds (expected integer in 0..${gradient.stops.length}).`,
      { index: insertIndex },
    );
  }

  const source = gradient.stops[sourceIndex];
  const hasPosition = 'position' in options;

  if (source.kind === 'hint') {
    if (hasPosition && options.position === undefined) {
      return createOperationFailure(
        'INVALID_STOP_PATCH',
        `Color hint "${stopId}" requires a defined position when duplicated.`,
        { stopId },
      );
    }
    const nextPosition: StopPosition = hasPosition
      ? (options.position as StopPosition)
      : source.position;
    if (!isCompatibleStopPosition(gradient.kind, nextPosition)) {
      return createOperationFailure(
        'INCOMPATIBLE_STOP_POSITION',
        `Stop position unit "${nextPosition.unit}" is incompatible with "${gradient.kind}" gradient.`,
        { stopId: options.id },
      );
    }
    const duplicatedHint: ColorHint = {
      kind: 'hint',
      id: options.id,
      position: nextPosition,
    };
    const nextStops: GradientStop[] = [
      ...gradient.stops.slice(0, insertIndex),
      duplicatedHint,
      ...gradient.stops.slice(insertIndex),
    ];
    return createOperationSuccess(rebuildGradientWithStops(gradient, nextStops));
  }

  const nextPosition: StopPosition | undefined = hasPosition ? options.position : source.position;
  if (nextPosition !== undefined && !isCompatibleStopPosition(gradient.kind, nextPosition)) {
    return createOperationFailure(
      'INCOMPATIBLE_STOP_POSITION',
      `Stop position unit "${nextPosition.unit}" is incompatible with "${gradient.kind}" gradient.`,
      { stopId: options.id },
    );
  }

  const duplicatedColorStop: ColorStop =
    nextPosition === undefined
      ? {
          kind: 'color',
          id: options.id,
          color: source.color,
        }
      : {
          kind: 'color',
          id: options.id,
          color: source.color,
          position: nextPosition,
        };

  const nextStops: GradientStop[] = [
    ...gradient.stops.slice(0, insertIndex),
    duplicatedColorStop,
    ...gradient.stops.slice(insertIndex),
  ];

  return createOperationSuccess(rebuildGradientWithStops(gradient, nextStops));
}
