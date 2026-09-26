import { describe, expect, it } from "vitest";
import { createLoginThrottle } from "./login-throttle";

const MIN = 60_000;

describe("createLoginThrottle", () => {
  it("bloquea tras N fallos dentro de la ventana y avisa cuánto falta", () => {
    const t = createLoginThrottle({ maxFailures: 3, windowMs: 15 * MIN });
    for (let i = 0; i < 3; i++) {
      expect(t.check("maria", 0).allowed).toBe(true);
      t.recordFailure("maria", i * MIN);
    }
    expect(t.check("maria", 3 * MIN)).toEqual({ allowed: false, retryAfterMs: 12 * MIN });
  });

  it("los fallos viejos salen de la ventana", () => {
    const t = createLoginThrottle({ maxFailures: 2, windowMs: 10 * MIN });
    t.recordFailure("maria", 0);
    t.recordFailure("maria", 1 * MIN);
    expect(t.check("maria", 5 * MIN).allowed).toBe(false);
    expect(t.check("maria", 11 * MIN).allowed).toBe(true);
  });

  it("un login correcto limpia los fallos, y cada usuario cuenta aparte", () => {
    const t = createLoginThrottle({ maxFailures: 2, windowMs: 10 * MIN });
    t.recordFailure("maria", 0);
    t.recordFailure("maria", 0);
    expect(t.check("pedro", 0).allowed).toBe(true);
    t.reset("maria");
    expect(t.check("maria", 0).allowed).toBe(true);
  });
});
