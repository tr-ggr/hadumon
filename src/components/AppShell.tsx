"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { api } from "~/trpc/react";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/summon", label: "Summon", icon: "✦" },
  { href: "/adventure", label: "Adventure", icon: "▶" },
  { href: "/battle", label: "Battle", icon: "⚔" },
  { href: "/market", label: "Market", icon: "⚖" },
  { href: "/collection", label: "Collection", icon: "☷" },
];

/** Routes that render without the shell (unauthenticated). */
const BARE_ROUTES = ["/login", "/signup"];

/** localStorage key for the CRT scanline overlay (off by default). */
const SCANLINE_KEY = "hadumon:scanlines";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [scanlines, setScanlines] = useScanlines();

  if (
    BARE_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    return <>{children}</>;
  }

  return (
    <div
      className={`bg-navy flex min-h-dvh flex-col ${scanlines ? "scanlines" : ""}`}
    >
      <TopBar scanlines={scanlines} onToggleScanlines={setScanlines} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-3 py-4 sm:px-4">
        <SideNav pathname={pathname} />
        <main className="min-w-0 flex-1 pb-20 md:pb-4">{children}</main>
      </div>
      <BottomNav pathname={pathname} />
    </div>
  );
}

function TopBar({
  scanlines,
  onToggleScanlines,
}: {
  scanlines: boolean;
  onToggleScanlines: (value: boolean) => void;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push("/login");
      router.refresh();
    },
  });

  return (
    <header className="border-edge bg-panel sticky top-0 z-20 border-b-2">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <Link
          href="/"
          className="text-pixel text-gold shrink-0 text-xs sm:text-sm"
        >
          Hadu<span className="text-pink">Mon</span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <WalletChip label="G" value={me.data?.wallet.gold} tone="text-gold" />
          <WalletChip label="◆" value={me.data?.wallet.gems} tone="text-mint" />
          <button
            type="button"
            onClick={() => onToggleScanlines(!scanlines)}
            aria-pressed={scanlines}
            title="Toggle CRT scanlines"
            className={`text-pixel border-edge border-2 px-2 py-1 text-[8px] ${
              scanlines ? "text-gold" : "text-ink-dim hover:text-ink"
            }`}
          >
            CRT
          </button>
          {me.data ? (
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-pixel border-edge text-ink-dim hover:text-ink border-2 px-2 py-1 text-[8px] disabled:opacity-50"
              title={`Signed in as ${me.data.user.displayName}`}
            >
              <span className="hidden sm:inline">
                {me.data.user.displayName} ·{" "}
              </span>
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function WalletChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone: string;
}) {
  return (
    <span
      className={`panel-flat px-2 py-1 text-base leading-none tabular-nums ${tone}`}
      aria-label={label === "G" ? "Gold" : "Gems"}
    >
      <span className="text-pixel mr-1 text-[8px]">{label}</span>
      {value?.toLocaleString() ?? "—"}
    </span>
  );
}

function SideNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden w-40 shrink-0 flex-col gap-1 md:flex">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={`text-pixel flex items-center gap-2 border-2 px-2 py-2 text-[9px] ${
            isActive(pathname, item.href)
              ? "border-gold bg-panel-hi text-gold"
              : "border-edge bg-panel text-ink-dim hover:text-ink"
          }`}
        >
          <span aria-hidden className="text-sm">
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="border-edge bg-panel fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t-2 md:hidden">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={`flex flex-col items-center gap-0.5 py-1.5 ${
            isActive(pathname, item.href) ? "text-gold" : "text-ink-dim"
          }`}
        >
          <span aria-hidden className="text-base leading-none">
            {item.icon}
          </span>
          <span className="text-pixel text-[6px] leading-none">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}

/**
 * Remembers the CRT overlay preference per browser. Reads localStorage after
 * mount only, so the server and first client render always agree (overlay off).
 */
function useScanlines(): [boolean, (value: boolean) => void] {
  const [scanlines, setScanlines] = useState(false);

  useEffect(() => {
    try {
      setScanlines(window.localStorage.getItem(SCANLINE_KEY) === "on");
    } catch {
      // Private mode or blocked storage — keep the default.
    }
  }, []);

  const update = useCallback((value: boolean) => {
    setScanlines(value);
    try {
      window.localStorage.setItem(SCANLINE_KEY, value ? "on" : "off");
    } catch {
      // Preference simply will not persist.
    }
  }, []);

  return [scanlines, update];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
