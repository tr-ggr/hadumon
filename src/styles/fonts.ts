import { Jersey_20 } from "next/font/google";

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
