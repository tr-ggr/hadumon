"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-navy">
      <TopBar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-3 py-4 sm:px-4">
        <SideNav pathname={pathname} />
        <main className="min-w-0 flex-1 pb-20 md:pb-4">{children}</main>
      </div>
      <BottomNav pathname={pathname} />
    </div>
  );
}

function TopBar() {
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
    <header className="sticky top-0 z-20 border-b-2 border-edge bg-panel">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <Link href="/" className="text-pixel shrink-0 text-xs text-gold sm:text-sm">
          Hadu<span className="text-pink">Mon</span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <WalletChip label="G" value={me.data?.wallet.gold} tone="text-gold" />
          <WalletChip label="◆" value={me.data?.wallet.gems} tone="text-mint" />
          {me.data ? (
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-pixel border-2 border-edge px-2 py-1 text-[8px] text-ink-dim hover:text-ink disabled:opacity-50"
              title={`Signed in as ${me.data.user.displayName}`}
            >
              <span className="hidden sm:inline">{me.data.user.displayName} · </span>Logout
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
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t-2 border-edge bg-panel md:hidden">
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
          <span className="text-pixel text-[6px] leading-none">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
