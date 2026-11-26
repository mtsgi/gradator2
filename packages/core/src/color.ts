export const COLOR_SPACES = ['srgb', 'hsl'] as const;

export type ColorSpace = (typeof COLOR_SPACES)[number];

export interface SrgbColor {
  readonly space: 'srgb';
  /** Red channel (0–255) */
  readonly r: number;
  /** Green channel (0–255) */
  readonly g: number;
  /** Blue channel (0–255) */
  readonly b: number;
  /** Alpha channel (0–1) */
  readonly alpha: number;
}

export interface HslColor {
  readonly space: 'hsl';
  /** Hue in degrees (0–360) */
  readonly h: number;
  /** Saturation percentage (0–100) */
  readonly s: number;
  /** Lightness percentage (0–100) */
  readonly l: number;
  /** Alpha channel (0–1) */
  readonly alpha: number;
}

export type Color = SrgbColor | HslColor;

const COLOR_SPACE_SET: ReadonlySet<string> = new Set<string>(COLOR_SPACES);

export function isColorSpace(value: unknown): value is ColorSpace {
  return typeof value === 'string' && COLOR_SPACE_SET.has(value);
}

export function isSrgbColor(color: Color): color is SrgbColor {
  return color.space === 'srgb';
}

export function isHslColor(color: Color): color is HslColor {
  return color.space === 'hsl';
}

export function srgb(r: number, g: number, b: number, alpha: number = 1): SrgbColor {
  return { space: 'srgb', r, g, b, alpha };
}

export function hsl(h: number, s: number, l: number, alpha: number = 1): HslColor {
  return { space: 'hsl', h, s, l, alpha };
}
