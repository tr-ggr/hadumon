import { Amatic_SC, Jersey_20 } from "next/font/google";

/**
 * The pixel face for print on the board. It is drawn on a 20px grid, so it
 * is set at 20px and 30px, and at 40px for a page's one heading. Applied on
 * the body, since every page is a tabletop.
 */
export const pixelFont = Jersey_20({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-pixel",
});

/**
 * The face of a cat card's name plate and of the trigger in its power band:
 * narrow hand-drawn small capitals. On a cat card only, and never under 14px.
 */
export const plateFont = Amatic_SC({
  subsets: ["latin"],
  weight: "700",
  display: "swap",
  variable: "--font-plate",
});
