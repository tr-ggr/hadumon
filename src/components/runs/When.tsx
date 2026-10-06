"use client";

import { useEffect, useState } from "react";

import { timeAgo } from "./runText";

/**
 * A moment in the viewer's own locale and time zone. The server knows
 * neither, so a page rendered there prints the plain date and the browser
 * puts its own words in once it has the page; reading it in the first
 * render would make the two disagree.
 */
export function When({
  date,
  time = false,
  ago = false,
  className,
}: {
  date: Date;
  /** Also print the time of day. */
  time?: boolean;
  /** Say how long ago it was instead, with the full moment on hover. */
  ago?: boolean;
  className?: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const [full, setFull] = useState<string | undefined>();
  useEffect(() => {
    setFull(date.toLocaleString());
    setText(
      ago
        ? timeAgo(date.getTime(), Date.now())
        : time
          ? date.toLocaleString()
          : date.toLocaleDateString(),
    );
  }, [date, time, ago]);
  return (
    <time
      dateTime={date.toISOString()}
      title={ago ? full : undefined}
      className={className}
    >
      {text ?? date.toISOString().slice(0, 10)}
    </time>
  );
}
