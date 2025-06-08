/**
 * Calculates the appropriate contrasting color (black or white) for a given hex color.
 * @param {string} hex - The hex color string (e.g., '#RRGGBB').
 * @returns {'#000000' | '#FFFFFF'} - Black or white for the best contrast.
 */
export function getContrastColor(hex) {
  if (!hex) return '#000000'; // Default to black if color is undefined

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

  return luminance > 140 ? '#000000' : '#FFFFFF';
}
