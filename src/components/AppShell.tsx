"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button, Modal } from "~/components/ui";
import { api } from "~/trpc/react";

type IconName = "home" | "play" | "codex";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/run", label: "Play", icon: "play" },
  { href: "/codex", label: "Codex", icon: "codex" },
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
    <div className="app-shell min-h-dvh md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
      <SideNav pathname={pathname} />
      <div className="flex min-h-dvh min-w-0 flex-col">
        <TopBar />
        <main className="app-main mx-auto min-w-0 flex-1 px-3 py-4 pb-20 sm:px-5 md:pb-6 lg:px-6">
          {children}
        </main>
      </div>
      <BottomNav pathname={pathname} />
    </div>
  );
}

/**
 * Sticky account bar, shown at every width: the wordmark on mobile (the rail
 * carries it on desktop), who is signed in, and Log out behind a confirm.
 */
function TopBar() {
  const router = useRouter();
  const utils = api.useUtils();
  const [confirming, setConfirming] = useState(false);
  const me = api.auth.me.useQuery(undefined, { retry: false });
  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      setConfirming(false);
      await utils.invalidate();
      router.push("/login");
      router.refresh();
    },
  });
  const displayName = me.data?.user.displayName;

  return (
    <header className="bg-cream/95 sticky top-0 z-30 border-b border-black/5 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-3 py-2 sm:px-5 lg:px-6">
        <Link
          href="/"
          className="text-pixel text-ink shrink-0 text-xl sm:text-2xl md:hidden"
        >
          Hadu<span className="text-coral">Mon</span>
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-1">
          {displayName ? (
            <span className="text-ink min-w-0 truncate px-2 text-sm font-bold">
              {displayName}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="touch-target text-ink-soft hover:bg-sky-soft hover:text-ink shrink-0 rounded-full px-3 text-sm font-bold"
          >
            Log out
          </button>
        </div>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Log out?"
        footer={
          <>
            <Button
              variant="secondary"
              data-autofocus
              disabled={logout.isPending}
              onClick={() => setConfirming(false)}
            >
              Stay
            </Button>
            <Button
              variant="danger"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Logging out…" : "Log out"}
            </Button>
          </>
        }
      >
        <p>
          A run in progress is saved. It will be where you left it when you log
          back in.
        </p>
        {logout.error ? (
          <p role="alert" className="text-coral mt-2 font-semibold">
            That did not work. Try again.
          </p>
        ) : null}
      </Modal>
    </header>
  );
}

function SideNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="app-rail sticky top-0 hidden h-dvh w-48 shrink-0 flex-col gap-1 overflow-y-auto px-3 py-4 md:flex"
    >
      <Link href="/" className="text-pixel text-ink mb-8 px-3 text-2xl">
        Hadu<span className="text-coral">Mon</span>
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
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 gap-1 rounded-2xl border border-black/5 bg-white/95 p-2 shadow-[0_12px_36px_rgba(23,33,43,0.18)] backdrop-blur md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold ${active ? "bg-sky-soft text-cobalt" : "text-ink-soft"}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const ICON_PATHS: Record<IconName, string> = {
  home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H11v6H7a1 1 0 0 1-1-1z",
  play: "M8 5v14l11-7z",
  codex: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM9 4v16M13 9h2",
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
