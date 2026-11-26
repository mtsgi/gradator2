import { describe, expect, it } from 'vite-plus/test';
import {
  GRADATOR_CORE_VERSION,
  GRADIENT_KINDS,
  angle,
  createColorHint,
  createColorStop,
  createConicGradient,
  createLinearGradient,
  createRadialGradient,
  getCorePackageInfo,
  gradientPosition,
  horizontalKeyword,
  hsl,
  isLinearGradient,
  length,
  linearAngleDirection,
  percentage,
  radialExtentSize,
  srgb,
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
});
