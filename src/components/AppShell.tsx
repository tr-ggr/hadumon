"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { LogoutDialog } from "~/components/LogoutDialog";
import { PixelIcon } from "~/components/PixelIcon";
import { MusicButton } from "~/components/run/music/MusicButton";
import { SoundButton } from "~/components/run/sfx/SoundButton";
import { TowerBackdrop } from "~/components/tower/TowerBackdrop";
import type { IconName } from "~/components/sprites/icons";
import { tableButtonClass, type TableButtonSize } from "~/components/ui";
import { api } from "~/trpc/react";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/run", label: "Play", icon: "play" },
  { href: "/codex", label: "Codex", icon: "book" },
];
const BARE_ROUTES = ["/login", "/signup"];
/** The table takes the whole screen: no lid, no dock. See `TableNav`. */
const TABLE_ROUTE = "/run";
const CODEX_ROUTE = "/codex";

export function AppShell({
  children,
  authenticated,
}: {
  children: ReactNode;
  authenticated: boolean;
}) {
  const pathname = usePathname();
  if (
    !authenticated ||
    BARE_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  )
    return <>{children}</>;
  // The table lays its own cloth edge to edge and carries its own way out.
  if (isActive(pathname, TABLE_ROUTE)) {
    return (
      <div className="flex min-h-dvh flex-col">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    );
  }
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      {isActive(pathname, CODEX_ROUTE) ? null : <TowerBackdrop />}
      <Lid pathname={pathname} />
      <main className="mx-auto w-full max-w-[1180px] min-w-0 flex-1 px-3 pt-5 pb-28 sm:px-5 md:pb-12">
        {children}
      </main>
      <Dock pathname={pathname} />
    </div>
  );
}

/**
 * The lid of the box, across the top of every page but the table: the
 * wordmark, the three ways about the app (from 768px; a phone has them in
 * the dock), who is signed in, the sound, and Log out behind a confirm.
 */
function Lid({ pathname }: { pathname: string }) {
  const [confirming, setConfirming] = useState(false);
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const displayName = me.data?.user.displayName;
  const corner = tableButtonClass("secondary", "icon");

  return (
    <header className="lid bg-ink text-cream sticky top-0 z-30">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-3 pt-1 pb-2 sm:px-5">
        <Link href="/" className="text-pixel shrink-0 text-xl sm:text-2xl">
          Hadu<span className="text-coral">Mon</span>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="ml-3 hidden gap-2.5 md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              size="sm"
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          {displayName ? (
            <span className="mr-1 min-w-0 truncate text-sm font-bold">
              {displayName}
            </span>
          ) : null}
          <SoundButton className="shrink-0" />
          <MusicButton className="shrink-0" />
          <button
            type="button"
            aria-label="Log out"
            title="Log out"
            onClick={() => setConfirming(true)}
            className={`${corner} shrink-0`}
          >
            <PixelIcon name="exit" />
          </button>
        </div>
      </div>

      <LogoutDialog open={confirming} onClose={() => setConfirming(false)} />
    </header>
  );
}

/** The same three ways, docked along the bottom of a phone. */
function Dock({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="shell-dock rail fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2.5 px-3 pt-2.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] md:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.href}
          item={item}
          size="md"
          active={isActive(pathname, item.href)}
        />
      ))}
    </nav>
  );
}

/**
 * One way about the app, as a table button. The page you are on is lime and
 * pressed in; Play is the cobalt one, since it is where the game is.
 */
function NavButton({
  item,
  size,
  active,
}: {
  item: NavItem;
  size: TableButtonSize;
  active: boolean;
}) {
  const variant = active
    ? "chosen"
    : item.href === TABLE_ROUTE
      ? "primary"
      : "secondary";
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={tableButtonClass(variant, size, active ? "is-pressed" : "")}
    >
      <PixelIcon name={item.icon} />
      {item.label}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
