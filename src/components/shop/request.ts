/**
 * The ids a pack is opened under. The server answers a request id it has
 * seen before with the pack that id opened, so the id is what keeps a retry
 * or a double click from buying twice: one press of the button makes one id,
 * and that id is sent again, never replaced, until the server has answered.
 *
 * Pure: the state is a value, and the caller says how an id is made.
 */

export interface Presses {
  /** The pack whose request is on its way, or `null` when none is. */
  flying: string | null;
  /**
   * The id each pack's last press went out under, by pack id, kept while the
   * server has not answered it. A press that failed without an answer may
   * have been bought all the same, so the next press on that pack is the
   * same press again.
   */
  kept: Readonly<Record<string, string>>;
}

export const NO_PRESSES: Presses = { flying: null, kept: {} };

export interface Pressed {
  state: Presses;
  /** The id to send, or `null` if the press is to be dropped. */
  requestId: string | null;
}

/**
 * A press on Open for `packId`. While a request is on its way a second press
 * is dropped and no id is made. Otherwise it goes out under the id that pack
 * is still waiting on, or under a new one.
 */
export function press(
  state: Presses,
  packId: string,
  newId: () => string,
): Pressed {
  if (state.flying !== null) return { state, requestId: null };
  const requestId = Object.hasOwn(state.kept, packId)
    ? (state.kept[packId] ?? newId())
    : newId();
  return {
    state: { flying: packId, kept: { ...state.kept, [packId]: requestId } },
    requestId,
  };
}

/**
 * The request for `packId` is over. `answered` is true if the server said
 * what became of it, a pack or a refusal: that press is done, and the next
 * one is new. False (the network failed, or the server fell over) keeps the
 * id for a retry.
 */
export function settle(
  state: Presses,
  packId: string,
  answered: boolean,
): Presses {
  const flying = state.flying === packId ? null : state.flying;
  if (!answered) return { ...state, flying };
  const kept = { ...state.kept };
  delete kept[packId];
  return { flying, kept };
}

/** A request that ran out of time, or was dropped: 4xx, and no answer. */
const UNSETTLED = [408, 499];

/**
 * Whether a failed request was answered. A refusal the server chose to make
 * (too few coins, nothing left in the pack, not signed in) comes back as a
 * client error, and nothing was bought. Anything else, or no status at all,
 * leaves it unknown.
 */
export function wasAnswered(httpStatus: number | undefined): boolean {
  if (httpStatus === undefined || UNSETTLED.includes(httpStatus)) return false;
  return httpStatus >= 400 && httpStatus < 500;
}
