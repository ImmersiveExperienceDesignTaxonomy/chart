/**
 * Default palette for experience profiles.
 * 9 visually distinct, vibrant colors (hex integers).
 */
export const DEFAULT_PALETTE = [
  0x4488ff, // blue
  0xff4444, // red
  0x44cc66, // green
  0xffaa22, // orange
  0xaa44ff, // purple
  0x44dddd, // teal
  0xff66aa, // pink
  0xcccc22, // yellow
  0x8866cc, // lavender
];

/**
 * Pick the next color from the palette based on current profile count.
 * @param {number} index
 * @returns {number}
 */
export function paletteColor(index) {
  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}
