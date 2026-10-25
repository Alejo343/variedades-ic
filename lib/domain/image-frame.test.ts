import { describe, expect, it } from "vitest";
import { alphaBounds, fitInSquare } from "./image-frame";

/** RGBA pixels, all transparent except the (x, y) pairs given, set to `alpha`. */
function rgba(width: number, height: number, opaque: [number, number][], alpha = 255): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of opaque) data[(y * width + x) * 4 + 3] = alpha;
  return data;
}

/** Every pixel of the rectangle [x0, x1] × [y0, y1]. */
function rect(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const out: [number, number][] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

describe("alphaBounds", () => {
  it("returns the smallest box holding the visible object", () => {
    const data = rgba(20, 16, rect(4, 3, 12, 9));
    expect(alphaBounds(data, 20, 16)).toEqual({ x: 4, y: 3, width: 9, height: 7 });
  });

  it("ignores faint haze at or below the threshold", () => {
    const data = rgba(20, 20, rect(0, 0, 19, 19), 40);
    for (const [x, y] of rect(6, 6, 10, 10)) data[(y * 20 + x) * 4 + 3] = 255;
    expect(alphaBounds(data, 20, 20)).toEqual({ x: 6, y: 6, width: 5, height: 5 });
  });

  it("ignores isolated specks, like the ones background removal leaves in the corners", () => {
    // Real case: BEN2 left single pixels at alpha 51 in the photo's corners,
    // which stretched the box to the whole photo.
    const data = rgba(40, 30, [...rect(10, 12, 20, 25), [0, 0], [39, 0], [0, 29], [39, 29]]);
    expect(alphaBounds(data, 40, 30, { threshold: 16 })).toEqual({ x: 10, y: 12, width: 11, height: 14 });
  });

  it("keeps thin parts at least minPixels wide", () => {
    // 3-px-wide cable hanging below the object.
    const data = rgba(30, 30, [...rect(5, 5, 15, 15), ...rect(9, 16, 11, 27)]);
    expect(alphaBounds(data, 30, 30)).toEqual({ x: 5, y: 5, width: 11, height: 23 });
  });

  it("is null when nothing is visible", () => {
    expect(alphaBounds(rgba(5, 5, []), 5, 5)).toBeNull();
  });

  it("is null when only specks are visible", () => {
    expect(alphaBounds(rgba(10, 10, [[1, 1], [8, 8]]), 10, 10)).toBeNull();
  });

  it("covers the whole image when it is fully opaque", () => {
    expect(alphaBounds(rgba(8, 6, rect(0, 0, 7, 5)), 8, 6)).toEqual({ x: 0, y: 0, width: 8, height: 6 });
  });
});

describe("fitInSquare", () => {
  it("a wide object spans the width inside the margins and is centered vertically", () => {
    // 1000 canvas, 10% margin → 800 available; 400×200 scales ×2 → 800×400.
    expect(fitInSquare(400, 200, 1000, 0.1)).toEqual({ x: 100, y: 300, width: 800, height: 400 });
  });

  it("a tall object spans the height and is centered horizontally", () => {
    expect(fitInSquare(100, 400, 1000, 0.1)).toEqual({ x: 400, y: 100, width: 200, height: 800 });
  });

  it("a big object shrinks to the same frame as a small one", () => {
    expect(fitInSquare(3000, 3000, 1000, 0.1)).toEqual(fitInSquare(30, 30, 1000, 0.1));
    expect(fitInSquare(30, 30, 1000, 0.1)).toEqual({ x: 100, y: 100, width: 800, height: 800 });
  });

  it("rounds to whole pixels and keeps the object inside the canvas", () => {
    const box = fitInSquare(333, 100, 1200, 0.08);
    expect(Number.isInteger(box.x) && Number.isInteger(box.y)).toBe(true);
    expect(box.width).toBe(1008);
    expect(box.x + box.width).toBeLessThanOrEqual(1200);
    expect(box.y + box.height).toBeLessThanOrEqual(1200);
  });
});
