/** How long a reset link works for. The email says so, so they share it. */
export const RESET_LINK_TTL_SECONDS = 60 * 60;

export interface ResetEmail {
  subject: string;
  text: string;
  html: string;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * The password reset email. Pure, so it can be read and tested without
 * sending anything. `name` is whatever the player typed at signup, so it is
 * escaped before it goes into the HTML.
 */
export function buildResetEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}): ResetEmail {
  const minutes = Math.round(RESET_LINK_TTL_SECONDS / 60);
  const lines = [
    `Hello ${name},`,
    "Someone asked to reset the password for your HaduMon account. If that was you, follow this link to choose a new one:",
    url,
    `The link works once and for ${minutes} minutes.`,
    "If you did not ask for this, ignore this email. Your password stays as it is.",
  ];

  const safeUrl = escapeHtml(url);
  const html = [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.5;color:#1b1b1b;max-width:480px">',
    `<p>Hello ${escapeHtml(name)},</p>`,
    "<p>Someone asked to reset the password for your HaduMon account. If that was you, follow this link to choose a new one:</p>",
    `<p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#1b1b1b;color:#fff8e7;font-weight:800;text-decoration:none">Choose a new password</a></p>`,
    `<p style="font-size:14px;word-break:break-all">Or paste this into your browser:<br>${safeUrl}</p>`,
    `<p>The link works once and for ${minutes} minutes.</p>`,
    "<p>If you did not ask for this, ignore this email. Your password stays as it is.</p>",
    "</div>",
  ].join("");

  return {
    subject: "Reset your HaduMon password",
    text: lines.join("\n\n"),
    html,
  };
}
