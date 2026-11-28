import { GRADIENT_KINDS, type GradientKind } from './gradient.ts';

export * from './color.ts';
export * from './gradient.ts';
export * from './position.ts';
export * from './stop.ts';
export * from './units.ts';

export const GRADATOR_CORE_VERSION = '0.1.0';

export interface CorePackageInfo {
  readonly name: '@gradator/core';
  readonly version: string;
  readonly supportedKinds: readonly GradientKind[];
}

export function getCorePackageInfo(): CorePackageInfo {
  return {
    name: '@gradator/core',
    version: GRADATOR_CORE_VERSION,
    supportedKinds: GRADIENT_KINDS,
  };
}
