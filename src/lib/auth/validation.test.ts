import { describe, expect, it } from "vitest";

import {
  emailSchema,
  firstIssue,
  passwordSchema,
  resetSchema,
  signupSchema,
  usernameSchema,
} from "./validation";

const SIGNUP = {
  username: "Whisker_9",
  email: "cat@example.com",
  password: "hunter2hunter2",
  confirmPassword: "hunter2hunter2",
};

describe("usernameSchema", () => {
  it("takes letters, numbers and underscores, 3 to 20 long", () => {
    expect(usernameSchema.safeParse("abc").success).toBe(true);
    expect(usernameSchema.safeParse("A_b_9".padEnd(20, "x")).success).toBe(
      true,
    );
  });

  it.each([
    ["ab", "Username must be at least 3 characters"],
    ["a".repeat(21), "Username must be at most 20 characters"],
    ["has space", "Use letters, numbers and underscores only"],
    ["cat@home", "Use letters, numbers and underscores only"],
  ])("refuses %j", (value, message) => {
    const parsed = usernameSchema.safeParse(value);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(firstIssue(parsed.error)).toBe(message);
  });
});

describe("emailSchema", () => {
  it("trims what was typed", () => {
    expect(emailSchema.parse("  cat@example.com ")).toBe("cat@example.com");
  });

  it.each(["", "cat", "cat@", "@example.com"])("refuses %j", (value) => {
    expect(emailSchema.safeParse(value).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("draws the line at 8 characters", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });

  it("stops at 128", () => {
    expect(passwordSchema.safeParse("a".repeat(128)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("passes a good form", () => {
    expect(signupSchema.safeParse(SIGNUP).success).toBe(true);
  });

  it("says when the retype differs", () => {
    const parsed = signupSchema.safeParse({
      ...SIGNUP,
      confirmPassword: "hunter2hunter3",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(firstIssue(parsed.error)).toBe("Passwords do not match");
      expect(parsed.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("reports a short password before a mismatch", () => {
    const parsed = signupSchema.safeParse({
      ...SIGNUP,
      password: "short",
      confirmPassword: "other",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(firstIssue(parsed.error)).toBe(
        "Password must be at least 8 characters",
      );
    }
  });
});

describe("resetSchema", () => {
  it("needs the two to match", () => {
    expect(
      resetSchema.safeParse({
        password: "hunter2hunter2",
        confirmPassword: "hunter2hunter2",
      }).success,
    ).toBe(true);

    const parsed = resetSchema.safeParse({
      password: "hunter2hunter2",
      confirmPassword: "",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(firstIssue(parsed.error)).toBe("Passwords do not match");
    }
  });
});
