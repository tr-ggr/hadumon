import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    /**
     * Signs session cookies. Required in production; outside it Better Auth
     * falls back to a built-in development secret.
     *
     * Also required anywhere on Vercel, whatever `NODE_ENV` is: the build
     * migrates the database before it builds, and a migration must not run
     * for a deploy that is then going to fail for want of this.
     */
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production" || process.env.VERCEL
        ? z.string().min(32)
        : z.string().min(32).optional(),
    /**
     * The one origin the app is served from, such as a custom domain. Leave it
     * unset on Vercel and locally: the origin is then worked out per request
     * from the `VERCEL_*` hosts below, or from localhost.
     */
    BETTER_AUTH_URL: z.string().url().optional(),
    /** Sends the password reset email. Without it the link is only logged. */
    RESEND_API_KEY: z.string().optional(),
    /** The reset email's sender, on a domain verified with Resend. */
    EMAIL_FROM: z.string().optional(),
    /** Set by Vercel: the hosts this deployment answers on, without scheme. */
    VERCEL_URL: z.string().optional(),
    VERCEL_BRANCH_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    /**
     * Public origin used to resolve `metadataBase`, so Open Graph and Twitter
     * cards get absolute URLs. Optional: the layout falls back to the
     * production origin when it is unset.
     */
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
