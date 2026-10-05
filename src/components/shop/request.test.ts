import { describe, expect, it } from "vitest";

import { NO_PRESSES, press, settle, wasAnswered } from "./request";

/** Ids as a counter, so a test can say which press made which. */
function counter() {
  let made = 0;
  const newId = () => `id-${++made}`;
  return { newId, made: () => made };
}

describe("press", () => {
  it("sends a first press under a new id", () => {
    const ids = counter();
    const first = press(NO_PRESSES, "cinder-pack", ids.newId);
    expect(first.requestId).toBe("id-1");
    expect(first.state.flying).toBe("cinder-pack");
  });

  it("drops a second press before the first is answered, and makes no id", () => {
    const ids = counter();
    const first = press(NO_PRESSES, "cinder-pack", ids.newId);
    const second = press(first.state, "cinder-pack", ids.newId);
    expect(second.requestId).toBeNull();
    expect(second.state).toBe(first.state);
    expect(ids.made()).toBe(1);
  });

  it("drops a press on another pack while one is on its way", () => {
    const ids = counter();
    const first = press(NO_PRESSES, "cinder-pack", ids.newId);
    const other = press(first.state, "tide-pack", ids.newId);
    expect(other.requestId).toBeNull();
    expect(ids.made()).toBe(1);
  });

  it("makes a new id for a press after the pack was opened", () => {
    const ids = counter();
    const first = press(NO_PRESSES, "cinder-pack", ids.newId);
    const answered = settle(first.state, "cinder-pack", true);
    const again = press(answered, "cinder-pack", ids.newId);
    expect(again.requestId).toBe("id-2");
    expect(ids.made()).toBe(2);
  });

  it("makes a new id for a press after the server refused", () => {
    const ids = counter();
    const first = press(NO_PRESSES, "cinder-pack", ids.newId);
    // Too few coins is an answer: nothing was bought under that id.
    const refused = settle(first.state, "cinder-pack", wasAnswered(400));
    expect(press(refused, "cinder-pack", ids.newId).requestId).toBe("id-2");
  });

  it("sends a retry under the same id when the first was never answered", () => {
    const ids = counter();
    const first = press(NO_PRESSES, "cinder-pack", ids.newId);
    const lost = settle(first.state, "cinder-pack", wasAnswered(undefined));
    expect(lost.flying).toBeNull();
    const retry = press(lost, "cinder-pack", ids.newId);
    expect(retry.requestId).toBe(first.requestId);
    expect(ids.made()).toBe(1);

    // And again, for as long as nobody answers.
    const lostAgain = settle(retry.state, "cinder-pack", false);
    expect(press(lostAgain, "cinder-pack", ids.newId).requestId).toBe("id-1");
    expect(ids.made()).toBe(1);
  });

  it("forgets the id once the retry is answered", () => {
    const ids = counter();
    const first = press(NO_PRESSES, "cinder-pack", ids.newId);
    const lost = settle(first.state, "cinder-pack", false);
    const retry = press(lost, "cinder-pack", ids.newId);
    const done = settle(retry.state, "cinder-pack", true);
    expect(done).toEqual(NO_PRESSES);
    expect(press(done, "cinder-pack", ids.newId).requestId).toBe("id-2");
  });

  it("keeps an unanswered press to its own pack", () => {
    const ids = counter();
    const cinder = press(NO_PRESSES, "cinder-pack", ids.newId);
    const lost = settle(cinder.state, "cinder-pack", false);
    // Another pack is another press, under an id of its own.
    const tide = press(lost, "tide-pack", ids.newId);
    expect(tide.requestId).toBe("id-2");
    const opened = settle(tide.state, "tide-pack", true);
    // The pack nobody answered for is still waiting on its first id.
    expect(press(opened, "cinder-pack", ids.newId).requestId).toBe("id-1");
    expect(ids.made()).toBe(2);
  });

  it("is not fooled by a pack named like a property of every object", () => {
    const ids = counter();
    expect(press(NO_PRESSES, "constructor", ids.newId).requestId).toBe("id-1");
  });
});

describe("settle", () => {
  it("leaves a request for another pack on its way", () => {
    const first = press(NO_PRESSES, "cinder-pack", () => "a");
    expect(settle(first.state, "tide-pack", true).flying).toBe("cinder-pack");
  });

  it("does not change the state it was given", () => {
    const first = press(NO_PRESSES, "cinder-pack", () => "a");
    const before = structuredClone(first.state);
    settle(first.state, "cinder-pack", true);
    expect(first.state).toEqual(before);
    expect(NO_PRESSES).toEqual({ flying: null, kept: {} });
  });
});

describe("wasAnswered", () => {
  it("takes a refusal for an answer", () => {
    for (const status of [400, 401, 403, 404, 409, 422, 429]) {
      expect(wasAnswered(status), String(status)).toBe(true);
    }
  });

  it("takes anything else for no answer at all", () => {
    for (const status of [undefined, 408, 499, 500, 502, 503, 504]) {
      expect(wasAnswered(status), String(status)).toBe(false);
    }
  });
});
