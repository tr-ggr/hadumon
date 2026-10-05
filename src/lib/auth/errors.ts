/** What a failed Better Auth call hands back, as far as we read it. */
export interface AuthError {
  code?: string;
  message?: string;
  status?: number;
}

export const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";
export const RATE_LIMIT_ERROR = "Too many tries. Wait a minute and try again.";
export const EXPIRED_LINK_CODE = "INVALID_TOKEN";

/** Better Auth's error codes, in our words. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Wrong email or password",
  INVALID_EMAIL: "Enter a valid email address",
  USER_ALREADY_EXISTS: "That email already has an account. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "That email already has an account. Sign in instead.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_TOO_LONG: "Password must be at most 128 characters",
  [EXPIRED_LINK_CODE]: "This reset link has expired or was already used.",
};

/** Codes whose message we wrote ourselves on the server, so it can be shown. */
const OWN_CODES = new Set(["INVALID_USERNAME"]);

/**
 * One line for the form's error slot. Better Auth's own wording never reaches
 * the page: a code we do not know becomes the generic line.
 */
export function authErrorMessage(error: AuthError | null | undefined): string {
  if (!error) return GENERIC_AUTH_ERROR;
  if (error.status === 429) return RATE_LIMIT_ERROR;
  if (!error.code) return GENERIC_AUTH_ERROR;
  if (OWN_CODES.has(error.code) && error.message) return error.message;
  return MESSAGES[error.code] ?? GENERIC_AUTH_ERROR;
}

export function isExpiredLink(error: AuthError | null | undefined): boolean {
  return error?.code === EXPIRED_LINK_CODE;
}
