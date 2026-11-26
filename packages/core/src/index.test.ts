import { describe, expect, it } from 'vite-plus/test';
import { GRADATOR_CORE_VERSION, GRADIENT_KINDS, getCorePackageInfo } from './index.ts';

describe('@gradator/core', () => {
  it('exports package metadata and supported gradient kinds', () => {
    const info = getCorePackageInfo();
    expect(info.name).toBe('@gradator/core');
    expect(info.version).toBe(GRADATOR_CORE_VERSION);
    expect(info.supportedKinds).toEqual(['linear', 'radial', 'conic']);
    expect(GRADIENT_KINDS).toHaveLength(3);
  });
});
