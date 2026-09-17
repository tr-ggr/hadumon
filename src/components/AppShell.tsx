"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { api } from "~/trpc/react";

type IconName =
  "home" | "summon" | "adventure" | "battle" | "market" | "collection" | "more";
export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/summon", label: "Summon", icon: "summon" },
  { href: "/adventure", label: "Adventure", icon: "adventure" },
  { href: "/battle", label: "Battle", icon: "battle" },
  { href: "/market", label: "Market", icon: "market" },
  { href: "/collection", label: "Collection", icon: "collection" },
];
const BARE_ROUTES = ["/login", "/signup"];

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
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 gap-5 px-3 py-4 sm:px-5 lg:gap-7 lg:px-6">
        <SideNav pathname={pathname} />
        <main className="app-main min-w-0 flex-1 pb-20 md:pb-6">
          {children}
        </main>
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
    <header className="bg-cream/95 sticky top-0 z-30 border-b border-black/5 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-3 py-3 sm:px-5 lg:px-6">
        <Link href="/" className="text-pixel text-ink text-xl sm:text-2xl">
          Hadu<span className="text-coral">Mon</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <WalletChip
            label="Gold"
            value={me.data?.wallet.gold}
            tone="text-volt"
          />
          <WalletChip
            label="Gems"
            value={me.data?.wallet.gems}
            tone="text-cobalt"
          />
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="touch-target text-ink-soft hover:bg-sky-soft rounded-full px-3 text-xs font-bold disabled:opacity-50"
          >
            {me.data?.user.displayName ?? "Logout"}
          </button>
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
      className={`pill flex min-h-10 items-center gap-1.5 border border-black/5 bg-white px-3 text-sm font-bold tabular-nums shadow-sm ${tone}`}
      aria-label={label}
    >
      <span className="text-ink-soft text-[10px] tracking-wide uppercase">
        {label}
      </span>
      {value?.toLocaleString() ?? "—"}
    </span>
  );
}

function SideNav({ pathname }: { pathname: string }) {
  return (
    <nav className="app-rail hidden w-48 shrink-0 flex-col gap-1 p-3 md:flex">
      <Link
        href="/"
        className="text-ink-soft mb-4 px-3 text-xs font-bold tracking-[0.16em] uppercase"
      >
        Trainer menu
      </Link>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
        />
      ))}
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-cobalt text-white shadow-sm" : "text-ink-soft hover:bg-sky-soft hover:text-ink"}`}
    >
      <Icon name={item.icon} active={active} />
      <span>{item.label}</span>
    </Link>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();
  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push("/login");
      router.refresh();
    },
  });
  const visible: NavItem[] = [
    NAV_ITEMS[0],
    NAV_ITEMS[2],
    NAV_ITEMS[1],
    NAV_ITEMS[3],
  ].filter(Boolean) as NavItem[];
  return (
    <>
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 items-end gap-1 rounded-2xl border border-black/5 bg-white/95 p-2 shadow-[0_12px_36px_rgba(23,33,43,0.18)] backdrop-blur md:hidden">
        {visible.slice(0, 2).map((item) => (
          <MobileNavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
        <Link
          href="/summon"
          className="bg-cobalt -mt-7 flex min-h-16 flex-col items-center justify-center gap-1 rounded-full px-4 text-[11px] font-extrabold text-white shadow-lg"
        >
          <Icon name="summon" active />
          <span>Summon</span>
        </Link>
        {visible.slice(3).map((item) => (
          <MobileNavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="text-ink-soft flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold"
        >
          <Icon name="more" />
          <span>More</span>
        </button>
      </nav>
      {moreOpen ? (
        <div
          className="bg-ink/20 fixed inset-0 z-40"
          role="presentation"
          onClick={() => setMoreOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="More destinations"
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-sky-surface mx-auto mb-5 h-1.5 w-12 rounded-full" />
            <div className="grid grid-cols-2 gap-3">
              {NAV_ITEMS.slice(4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="bg-sky-soft flex min-h-14 items-center gap-3 rounded-xl px-4 font-bold"
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/"
                onClick={() => setMoreOpen(false)}
                className="bg-sky-soft flex min-h-14 items-center gap-3 rounded-xl px-4 font-bold"
              >
                <Icon name="home" />
                Account
              </Link>
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="bg-cream text-ink flex min-h-14 items-center gap-3 rounded-xl px-4 text-left font-bold disabled:opacity-50"
              >
                <Icon name="more" />
                {logout.isPending ? "Signing out…" : "Log out"}
              </button>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => setMoreOpen(false)}
              className="bg-cream text-ink mt-5 min-h-12 w-full rounded-full font-bold"
            >
              Close
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}

function MobileNavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${active ? "text-cobalt" : "text-ink-soft"}`}
    >
      <Icon name={item.icon} active={active} />
      <span>{item.label}</span>
    </Link>
  );
}

function Icon({ name, active = false }: { name: IconName; active?: boolean }) {
  const stroke = active ? "currentColor" : "currentColor";
  const path = {
    home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H11v6H7a1 1 0 0 1-1-1z",
    summon: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4",
    adventure: "m4 5 6-2 4 2 6-2v16l-6 2-4-2-6 2zM10 3v16M14 5v16",
    battle: "m5 5 14 14M19 5 5 19M7 3l4 4M17 3l-4 4M3 7l4 4M21 17l-4-4",
    market: "M4 10h16l-1 10H5L4 10Zm2 0 2-6h8l2 6M9 14v3m6-3v3",
    collection: "M5 5h14v14H5zM9 9h6m-6 4h6m-6 4h4",
    more: "M5 12h.01M12 12h.01M19 12h.01",
  }[name];
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
