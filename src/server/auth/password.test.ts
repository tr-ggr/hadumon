import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("round trips", async () => {
    const hash = await hashPassword("demo1234");
    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(await verifyPassword("demo1234", hash)).toBe(true);
    expect(await verifyPassword("demo12345", hash)).toBe(false);
  });

  it("salts: the same password hashes differently each time", async () => {
    expect(await hashPassword("demo1234")).not.toBe(
      await hashPassword("demo1234"),
    );
  });

  // Better Auth hands over `{ hash, password }`; the adapter in
  // `src/server/auth/index.ts` must pass them in this order.
  it("takes the password first and the stored hash second", async () => {
    const hash = await hashPassword("demo1234");
    expect(await verifyPassword(hash, "demo1234")).toBe(false);
  });

  it("refuses a stored value it does not recognise", async () => {
    expect(await verifyPassword("demo1234", "")).toBe(false);
    expect(await verifyPassword("demo1234", "bcrypt$aa$bb")).toBe(false);
    expect(await verifyPassword("demo1234", "scrypt$$")).toBe(false);
  });
});
