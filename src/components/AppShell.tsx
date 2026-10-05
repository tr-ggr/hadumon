"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { LogoutDialog } from "~/components/LogoutDialog";
import { PixelIcon } from "~/components/PixelIcon";
import { MenuMusic } from "~/components/MenuMusic";
import { MusicButton } from "~/components/run/music/MusicButton";
import { playSound } from "~/components/run/sfx/engine";
import { SoundButton } from "~/components/run/sfx/SoundButton";
import { useReducedMotion } from "~/components/run/useStepper";
import { moveMs, placeFor } from "~/components/tower/places";
import { TowerBackdrop } from "~/components/tower/TowerBackdrop";
import type { IconName } from "~/components/sprites/icons";
import { tableButtonClass, type TableButtonSize } from "~/components/ui";
import { AUTH_ROUTES } from "~/lib/auth/constants";
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
/** The signed-out forms bring their own lid, signed in or not. */
const BARE_ROUTES = AUTH_ROUTES;
/** The table takes the whole screen: no lid, no dock. See `TableNav`. */
const TABLE_ROUTE = "/run";

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
  return <Shell pathname={pathname}>{children}</Shell>;
}

const ShellMoving = createContext(false);

/**
 * True while the camera is on its way to the page and the page is put away.
 * Something that plays by itself on arriving waits for it to be false, since
 * an animation runs whether or not the page it is on is showing.
 */
export function useShellMoving(): boolean {
  return useContext(ShellMoving);
}

/** A page being gone to: where from, where to, and whether the camera is there. */
interface Move {
  from: string;
  to: string;
  settled: boolean;
}

/** If the page gone to never comes, the one being left is shown again. */
const MOVE_LIMIT_MS = 4000;
/** How long the pieces of a page take to land. */
const LAND_MS = 320;

/**
 * Everything around a signed-in page. The tower stands behind it all, and a
 * press on a link to another place moves the camera there: the page being
 * left is put away at once, and the one arrived at is set down when the
 * camera has stopped and the page has come. The table has the whole screen,
 * so the lid and the dock are only up around it while the camera is moving.
 */
function Shell({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  const calm = useReducedMotion();
  const [move, setMove] = useState<Move | null>(null);
  const [landed, setLanded] = useState(false);

  const arrived = move !== null && pathname !== move.from;
  const moving = move !== null && !(arrived && move.settled);
  const here = move?.to ?? pathname;
  const onTable = isActive(pathname, TABLE_ROUTE);

  useEffect(() => {
    if (!move || move.settled) return;
    const timer = setTimeout(
      () => setMove((now) => (now === move ? { ...now, settled: true } : now)),
      moveMs(placeFor(move.from), placeFor(move.to)),
    );
    return () => clearTimeout(timer);
  }, [move]);

  const leaving = move ? `${move.from} ${move.to}` : null;
  useEffect(() => {
    if (leaving === null) return;
    const timer = setTimeout(() => setMove(null), MOVE_LIMIT_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    if (!move || !arrived || !move.settled) return;
    setMove(null);
    setLanded(true);
    playSound("settle");
  }, [move, arrived]);

  useEffect(() => {
    if (!landed) return;
    const timer = setTimeout(() => setLanded(false), LAND_MS);
    return () => clearTimeout(timer);
  }, [landed]);

  /** A plain press on a link to another place starts the camera for it. */
  const startMove = (event: MouseEvent<HTMLDivElement>) => {
    if (calm || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.target === "_blank" || link.origin !== window.location.origin) {
      return;
    }
    if (placeFor(link.pathname) === placeFor(pathname)) return;
    setMove({ from: pathname, to: link.pathname, settled: false });
  };

  return (
    <div
      className="tower-app relative isolate flex min-h-dvh flex-col"
      data-nav={
        moving ? "moving" : move !== null || landed ? "landed" : undefined
      }
      data-place={placeFor(here)}
      onClickCapture={startMove}
    >
      <TowerBackdrop
        place={placeFor(here)}
        moving={moving}
        hidden={onTable && !moving}
      />
      {/* One tune for every page that is not the table, so it carries from
          page to page; the table plays its own. */}
      {onTable ? null : <MenuMusic />}
      {onTable && !moving ? null : <Lid pathname={here} />}
      {/* The table lays its own cloth edge to edge and carries its own way
          out; every other page is a column on the app's cloth. */}
      <main
        className={
          onTable
            ? "flex min-w-0 flex-1 flex-col"
            : "shell-page mx-auto w-full max-w-[1180px] min-w-0 flex-1 px-3 pt-5 pb-28 sm:px-5 md:pb-12"
        }
      >
        <ShellMoving.Provider value={moving}>{children}</ShellMoving.Provider>
      </main>
      {onTable && !moving ? null : <Dock pathname={here} />}
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
