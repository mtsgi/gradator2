import { GRADATOR_CORE_VERSION } from '@gradator/core';
import { describe, expect, it } from 'vite-plus/test';
import { GRADATOR_CSS_VERSION, formatGradientFunctionName, getCssPackageInfo } from './index.ts';

describe('@gradator/css', () => {
  it('integrates with @gradator/core and returns CSS package metadata', () => {
    const info = getCssPackageInfo();
    expect(info.name).toBe('@gradator/css');
    expect(info.version).toBe(GRADATOR_CSS_VERSION);
    expect(info.coreVersion).toBe(GRADATOR_CORE_VERSION);
    expect(info.supportedKinds).toEqual(['linear', 'radial', 'conic']);
  });

  it('formats CSS gradient function names', () => {
    expect(formatGradientFunctionName('linear')).toBe('linear-gradient');
    expect(formatGradientFunctionName('radial', true)).toBe('repeating-radial-gradient');
  });
});
