/**
 * Everything in motion on the table, so a skip can end all of it in one go.
 * An entry is anything that can be finished: a Web Animation, or a number
 * rolling up on a frame timer.
 */

interface Running {
  finish: () => void;
}

const running = new Set<Running>();

/**
 * Follows an animation until it ends. `done` is called once, however it
 * ends (it ran out, a skip finished it, it was cancelled), and is the place
 * to take a temporary node off the page.
 */
export function track(animation: Animation, done?: () => void): Animation {
  let over = false;
  const entry: Running = {
    finish: () => {
      try {
        animation.finish();
      } catch {
        animation.cancel();
      }
    },
  };
  const end = () => {
    if (over) return;
    over = true;
    running.delete(entry);
    done?.();
  };
  running.add(entry);
  animation.finished.then(end, end);
  return animation;
}

/** Follows something that is not an animation. Returns how to let it go. */
export function trackTask(finish: () => void): () => void {
  const entry: Running = { finish };
  running.add(entry);
  return () => {
    running.delete(entry);
  };
}

/** Jumps everything in motion to its end. */
export function finishAll(): void {
  for (const entry of [...running]) entry.finish();
}

/** How many things are in motion; back to 0 when a turn has landed. */
export function runningCount(): number {
  return running.size;
}
