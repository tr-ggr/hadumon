const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

/** A count spelled out, as far as the game's numbers go. */
export function word(n: number, capital = false): string {
  const tens = TENS[Math.floor(n / 10)];
  const text =
    WORDS[n] ??
    (tens ? `${tens}${n % 10 ? `-${WORDS[n % 10]}` : ""}` : String(n));
  return capital ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
