import "~/styles/globals.css";

import { type Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";

import { AppShell } from "~/components/AppShell";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "HaduMon — Idle Feline Collector",
  description:
    "Summon feline Fakemon, send them on idle adventures, climb the ladder and trade on the market.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport = {
  themeColor: "#0f0b1e",
  width: "device-width",
  initialScale: 1,
};

const pixel = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
  display: "swap",
});

const body = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable}`}>
      <body>
        <TRPCReactProvider>
          <AppShell>{children}</AppShell>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
