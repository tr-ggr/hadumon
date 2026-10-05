import "server-only";

import { env } from "~/env";
import { buildResetEmail } from "./reset-email";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Sends the password reset link through Resend.
 *
 * Without a key and a sender there is nowhere to send it. Outside production
 * the link is printed to the server console, which is how a developer follows
 * it; in production it is not, since a link in the logs resets an account.
 *
 * Never throws: the caller has already answered the visitor, and the answer
 * is the same whether or not this works.
 */
export async function sendResetEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (env.NODE_ENV === "production") {
      console.warn(
        "[auth] Password reset email not sent: RESEND_API_KEY and EMAIL_FROM are not both set.",
      );
    } else {
      console.log(`[auth] Password reset link for ${to}: ${url}`);
    }
    return;
  }

  const email = buildResetEmail({ name, url });
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], ...email }),
    });
    if (!response.ok) {
      console.error(
        `[auth] Resend refused the password reset email (${response.status}): ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error("[auth] Could not reach Resend", error);
  }
}
