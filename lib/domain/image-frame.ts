// Framing of a product cut-out (photo with its background removed): find
// where the object is and fit it in a standard square, so every product photo
// ends up with the object the same size and the same empty margin around it,
// however much background the original had.

export type Box = { x: number; y: number; width: number; height: number };

export type BoundsOptions = {
  /** A pixel is part of the object when its alpha (0–255) is above this. */
  threshold?: number;
  /** A row or column counts only with at least this many object pixels. */
  minPixels?: number;
};

/**
 * Box around the object of a cut-out. `data` is RGBA, row by row (canvas
 * `ImageData.data`). Background removal leaves faint haze (skipped by
 * `threshold`) and isolated specks — BEN2 leaves single pixels at alpha ~50
 * in the photo's corners — which would stretch the box to the whole photo,
 * so rows/columns with fewer than `minPixels` object pixels don't count.
 * Null if there is no object.
 */
export function alphaBounds(
  data: ArrayLike<number>,
  width: number,
  height: number,
  { threshold = 64, minPixels = 3 }: BoundsOptions = {},
): Box | null {
  const rows = new Uint32Array(height);
  const cols = new Uint32Array(width);
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] > threshold) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  const first = (counts: Uint32Array) => counts.findIndex((n) => n >= minPixels);
  const last = (counts: Uint32Array) => counts.findLastIndex((n) => n >= minPixels);
  const minY = first(rows);
  const minX = first(cols);
  if (minY < 0 || minX < 0) return null;
  const maxY = last(rows);
  const maxX = last(cols);
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Where to draw a `width`×`height` object in a `size`×`size` square: scaled
 * (up or down) so its longest side spans the square minus `margin` (fraction
 * of `size`) on each side, keeping its proportions, centered. Whole pixels.
 */
export function fitInSquare(width: number, height: number, size: number, margin: number): Box {
  const available = size * (1 - 2 * margin);
  const scale = available / Math.max(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  return { x: Math.round((size - w) / 2), y: Math.round((size - h) / 2), width: w, height: h };
}
