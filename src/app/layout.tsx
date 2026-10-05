import "~/styles/globals.css";

import { type Metadata } from "next";

import { AppShell } from "~/components/AppShell";
import { SkinProvider } from "~/components/skins/SkinProvider";
import { skinVars } from "~/components/skins/skins";
import { SoundRig } from "~/components/SoundRig";
import { ToastProvider } from "~/components/ui";
import { env } from "~/env";
import { profileOf } from "~/server/api/routers/profile";
import { getCurrentUser } from "~/server/auth/session";
import { db } from "~/server/db";
import { DEFAULT_LOOK } from "~/server/game/cosmetics";
import { pixelFont } from "~/styles/fonts";
import { TRPCReactProvider } from "~/trpc/react";

const TITLE = "HaduMon — a roguelike engine-builder about cats";
const DESCRIPTION =
  "Play feline Fakemon into three rows and chain their powers. Six rivals, twenty-six turns each, and nothing for sale.";

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
  themeColor: "#fff8e7",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Signed-out visitors get the landing page, which brings its own chrome.
  const user = await getCurrentUser();
  // The look is read here so the first paint is already dressed in it.
  const look = user
    ? await profileOf(db, user)
        .then((profile) => profile.look)
        .catch(() => DEFAULT_LOOK)
    : DEFAULT_LOOK;

  return (
    <html lang="en">
      {/* The whole app is one tabletop: every page is laid on the cloth, and a
          dialog drawn on the body is cardboard like the rest. The skin's
          colours are set here, on the body, so they reach both. */}
      <body
        className={`tabletop ${pixelFont.variable}`}
        style={skinVars(look) as React.CSSProperties}
      >
        <SoundRig />
        <TRPCReactProvider>
          <ToastProvider>
            <SkinProvider initial={look} signedIn={user !== null}>
              <AppShell authenticated={user !== null}>{children}</AppShell>
            </SkinProvider>
          </ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
