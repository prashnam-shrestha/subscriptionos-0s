"use client";

import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Users,
  Repeat,
  Shield,
  Package,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";

const NAV_ITEMS = [
  { label: "Dashboard", shortLabel: "Dash", href: "/", icon: LayoutDashboard },
  { label: "Tasks", shortLabel: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Customers", shortLabel: "Customers", href: "/customers", icon: Users },
  { label: "Subscriptions", shortLabel: "Subs", href: "/subscriptions", icon: Repeat },
  { label: "Master Accounts", shortLabel: "Accounts", href: "/accounts", icon: Shield },
  { label: "Products", shortLabel: "Products", href: "/products", icon: Package },
  { label: "Revenue", shortLabel: "Revenue", href: "/analytics", icon: TrendingUp },
];

export function Navigation({ pendingTasksCount = 0 }: { pendingTasksCount?: number }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white dark:bg-slate-100 dark:text-slate-900">
                SOS
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                SubscriptionOS
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                v1.0
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                const isTasksTab = item.label === "Tasks";
                const showCount = isTasksTab && pendingTasksCount > 0;
                const label = showCount ? `Tasks (${pendingTasksCount})` : item.label;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? showCount
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                          : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : showCount
                          ? "text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 transition-colors"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 hover:border-red-300 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
              title="Sign out of your session"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex md:hidden items-center justify-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/95 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              const isTasksTab = item.label === "Tasks";
              const showCount = isTasksTab && pendingTasksCount > 0;
              const label = showCount ? `Tasks (${pendingTasksCount})` : item.label;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? showCount
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                        : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : showCount
                        ? "text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left block rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
            >
              Logout
            </button>
          </nav>
        )}
      </header>

      {/* Fixed Instagram-style Bottom Navigation Bar (Visible on Narrow/Minimized Screens) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white/95 px-1 py-1.5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const isTasksTab = item.label === "Tasks";
          const showCount = isTasksTab && pendingTasksCount > 0;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-0.5 text-[10px] font-medium transition-colors rounded-lg ${
                isActive
                  ? "text-slate-900 dark:text-white font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showCount && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-500 text-[8px] font-bold text-slate-950">
                    {pendingTasksCount}
                  </span>
                )}
              </div>
              <span className="mt-0.5 truncate max-w-full text-[9px]">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
