export const GRADATOR_CORE_VERSION = '0.1.0';

export const GRADIENT_KINDS = ['linear', 'radial', 'conic'] as const;

export type GradientKind = (typeof GRADIENT_KINDS)[number];

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
