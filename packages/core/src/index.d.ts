export declare const GRADATOR_CORE_VERSION = "0.1.0";
export declare const GRADIENT_KINDS: readonly ['linear', 'radial', 'conic'];
export type GradientKind = (typeof GRADIENT_KINDS)[number];
export interface CorePackageInfo {
    readonly name: '@gradator/core';
    readonly version: string;
    readonly supportedKinds: readonly GradientKind[];
}
export declare function getCorePackageInfo(): CorePackageInfo;
