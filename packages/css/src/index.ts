import { GRADATOR_CORE_VERSION, type GradientKind, getCorePackageInfo } from '@gradator/core';

export const GRADATOR_CSS_VERSION = '0.1.0';

export interface CssPackageInfo {
  readonly name: '@gradator/css';
  readonly version: string;
  readonly coreVersion: string;
  readonly supportedKinds: readonly GradientKind[];
}

export function getCssPackageInfo(): CssPackageInfo {
  const coreInfo = getCorePackageInfo();
  return {
    name: '@gradator/css',
    version: GRADATOR_CSS_VERSION,
    coreVersion: GRADATOR_CORE_VERSION,
    supportedKinds: coreInfo.supportedKinds,
  };
}

export function formatGradientFunctionName(kind: GradientKind, repeating = false): string {
  return repeating ? `repeating-${kind}-gradient` : `${kind}-gradient`;
}
