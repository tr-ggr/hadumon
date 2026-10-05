import { describe, expect, it } from "vitest";

import {
  buildResetEmail,
  escapeHtml,
  RESET_LINK_TTL_SECONDS,
} from "./reset-email";

const URL =
  "https://hadumon.vercel.app/api/auth/reset-password/tok123?callbackURL=%2Freset-password";

describe("buildResetEmail", () => {
  it("carries the link in both bodies", () => {
    const email = buildResetEmail({ name: "Whisker", url: URL });
    expect(email.subject).toBe("Reset your HaduMon password");
    expect(email.text).toContain(URL);
    expect(email.html).toContain(`href="${escapeHtml(URL)}"`);
    expect(email.text).toContain("Hello Whisker,");
  });

  it("says how long the link lasts, from the same number the server uses", () => {
    const minutes = RESET_LINK_TTL_SECONDS / 60;
    const email = buildResetEmail({ name: "Whisker", url: URL });
    expect(email.text).toContain(`for ${minutes} minutes`);
    expect(email.html).toContain(`for ${minutes} minutes`);
  });

  it("escapes the name in the HTML and leaves it alone in the text", () => {
    const name = '<img src=x onerror="alert(1)">&';
    const email = buildResetEmail({ name, url: URL });
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;",
    );
    expect(email.text).toContain(name);
  });

  it("escapes a link that tries to break out of its attribute", () => {
    const email = buildResetEmail({
      name: "Whisker",
      url: 'https://example.com/?a="><script>',
    });
    expect(email.html).not.toContain("<script>");
  });
});
