import "~/styles/globals.css";

import { type Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";

import { AppShell } from "~/components/AppShell";
import { ToastProvider } from "~/components/ui";
import { env } from "~/env";
import { getCurrentUser } from "~/server/auth/session";
import { TRPCReactProvider } from "~/trpc/react";

const TITLE = "HaduMon — Idle Feline Collector";
const DESCRIPTION =
  "Summon feline Fakemon, send them on idle adventures, climb the ladder and trade on the market.";

/** Where absolute share URLs are resolved against; the deploy sets the rest. */
const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://hadumon.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  // Images come from the `opengraph-image` file convention.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "HaduMon",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Signed-out visitors get the landing page, which brings its own chrome.
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${pixel.variable} ${body.variable}`}>
      <body>
        <TRPCReactProvider>
          <ToastProvider>
            <AppShell authenticated={user !== null}>{children}</AppShell>
          </ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
