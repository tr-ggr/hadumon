import { describe, expect, it } from "vitest";

import {
  authErrorMessage,
  GENERIC_AUTH_ERROR,
  isExpiredLink,
  RATE_LIMIT_ERROR,
} from "./errors";

describe("authErrorMessage", () => {
  it("puts Better Auth's codes in our words", () => {
    expect(
      authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }),
    ).toBe("Wrong email or password");
    expect(
      authErrorMessage({
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        status: 422,
      }),
    ).toBe("That email already has an account. Sign in instead.");
    expect(authErrorMessage({ code: "PASSWORD_TOO_SHORT", status: 400 })).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("answers a 429 the same whatever the body says", () => {
    expect(
      authErrorMessage({ status: 429, message: "Too many requests." }),
    ).toBe(RATE_LIMIT_ERROR);
    expect(
      authErrorMessage({ status: 429, code: "INVALID_EMAIL_OR_PASSWORD" }),
    ).toBe(RATE_LIMIT_ERROR);
  });

  it("shows the username rule the server wrote", () => {
    expect(
      authErrorMessage({
        code: "INVALID_USERNAME",
        message: "Use letters, numbers and underscores only",
        status: 400,
      }),
    ).toBe("Use letters, numbers and underscores only");
  });

  it("never passes an unknown message through", () => {
    expect(
      authErrorMessage({
        code: "FAILED_TO_CREATE_USER",
        message: 'insert into "hadumon_users" failed',
        status: 500,
      }),
    ).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage({ message: "boom" })).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage(null)).toBe(GENERIC_AUTH_ERROR);
  });
});

describe("isExpiredLink", () => {
  it("is the invalid-token code and nothing else", () => {
    expect(isExpiredLink({ code: "INVALID_TOKEN", status: 400 })).toBe(true);
    expect(isExpiredLink({ code: "PASSWORD_TOO_SHORT", status: 400 })).toBe(
      false,
    );
    expect(isExpiredLink(null)).toBe(false);
  });
});
