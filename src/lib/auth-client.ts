import { createAuthClient } from "better-auth/react";

/** The browser's way to `/api/auth`, on whatever origin the page is on. */
export const authClient = createAuthClient();
