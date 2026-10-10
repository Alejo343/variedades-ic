import { describe, expect, it } from "vitest";
import { resolveUploadPath } from "./upload-path";

describe("resolveUploadPath", () => {
  it("accepts an uploaded product photo", () => {
    expect(resolveUploadPath(["products", "7442d9bf-e5e1-4e43-b591-fa660cdf0497.webp"])).toEqual({
      relativePath: "products/7442d9bf-e5e1-4e43-b591-fa660cdf0497.webp",
      contentType: "image/webp",
    });
    expect(resolveUploadPath(["products", "foto.JPG"])?.contentType).toBe("image/jpeg");
  });

  it("rejects anything that could leave public/uploads", () => {
    expect(resolveUploadPath(["..", "..", ".env.local"])).toBeNull();
    expect(resolveUploadPath(["products", "..", "x.webp"])).toBeNull();
    expect(resolveUploadPath(["products", "a..webp"])).toBeNull();
    expect(resolveUploadPath(["products/../x.webp"])).toBeNull();
    expect(resolveUploadPath(["products", "a\\b.webp"])).toBeNull();
    expect(resolveUploadPath([".hidden.webp"])).toBeNull();
    expect(resolveUploadPath([])).toBeNull();
  });

  it("rejects files that aren't stored images", () => {
    expect(resolveUploadPath(["products", "x.svg"])).toBeNull();
    expect(resolveUploadPath(["products", "x"])).toBeNull();
    expect(resolveUploadPath(["products"])).toBeNull();
  });
});
