import { describe, expect, it } from "vitest";
import { canSignInToPanel, normalizeUsername, ownerSeedFromEnv } from "./users";

describe("normalizeUsername", () => {
  it("ignora mayúsculas y espacios alrededor", () => {
    expect(normalizeUsername("  Admin@IcVariedades.com ")).toBe("admin@icvariedades.com");
  });
});

describe("canSignInToPanel", () => {
  it("solo un dueño activo entra al panel web", () => {
    expect(canSignInToPanel({ role: "owner", active: true })).toBe(true);
    expect(canSignInToPanel({ role: "owner", active: false })).toBe(false);
    expect(canSignInToPanel({ role: "seller", active: true })).toBe(false);
  });
});

describe("ownerSeedFromEnv", () => {
  const env = { ADMIN_EMAIL: " Admin@X.com ", ADMIN_PASSWORD_HASH: "$2b$10$hash" };

  it("siembra el dueño desde el env si todavía no hay ninguno", () => {
    expect(ownerSeedFromEnv(env, false)).toEqual({
      username: "admin@x.com",
      name: "Dueño",
      passwordHash: "$2b$10$hash",
      role: "owner",
    });
  });

  it("no hace nada si ya existe un dueño (el env deja de mandar)", () => {
    expect(ownerSeedFromEnv(env, true)).toBeNull();
  });

  it("no hace nada si falta alguna de las dos variables", () => {
    expect(ownerSeedFromEnv({ ADMIN_EMAIL: "a@x.com" }, false)).toBeNull();
    expect(ownerSeedFromEnv({ ADMIN_PASSWORD_HASH: "h" }, false)).toBeNull();
    expect(ownerSeedFromEnv({ ADMIN_EMAIL: "  ", ADMIN_PASSWORD_HASH: "h" }, false)).toBeNull();
  });
});
