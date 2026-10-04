import { Jersey_20 } from "next/font/google";

/**
 * The pixel face for print on the board. It is drawn on a 20px grid, so it
 * is set at 20px and 30px. Applied on the tabletop only, so no other route
 * loads it.
 */
export const pixelFont = Jersey_20({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-pixel",
});
