import { describe, expect, it } from "vitest";
import { generateDeviceToken, hashDeviceToken, parseBearer } from "./tokens";

describe("tokens de dispositivo", () => {
  it("genera tokens distintos, de 43 caracteres base64url (32 bytes)", () => {
    const a = generateDeviceToken();
    const b = generateDeviceToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it("guarda solo el SHA-256 en hex (valor conocido de 'abc')", () => {
    expect(hashDeviceToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("lee el token del header Authorization: Bearer", () => {
    expect(parseBearer("Bearer tok_123")).toBe("tok_123");
    expect(parseBearer("bearer   tok_123  ")).toBe("tok_123");
    expect(parseBearer(null)).toBeNull();
    expect(parseBearer("Basic abc")).toBeNull();
    expect(parseBearer("Bearer ")).toBeNull();
  });
});
