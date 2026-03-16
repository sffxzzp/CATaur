"use client";

import { Logo } from "@/components/branding/logo";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  User,
  LogOut,
  Info,
  ALargeSmall,
  ChevronDown,
  Minus,
  Plus,
  Check,
  Home,
  BriefcaseBusiness,
  FileText,
  Sparkles,
  Sun,
  Moon,
  Bell,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { request } from "@/lib/request";

// ─── Font-size levels ─────────────────────────────────────────────────────────
// Small = 17px (was Large), Default = 20px (was X-Large), Large = 24px (new)
const FONT_SIZES = [
  { label: "Small", value: "17px" },
  { label: "Default", value: "20px" },
  { label: "Large", value: "24px" },
] as const;

const FONT_SIZE_KEY = "candidateFontSize";
const THEME_KEY = "candidateTheme";

function applyFontSize(size: string) {
  document.documentElement.style.setProperty("--page-font-size", size);
  localStorage.setItem(FONT_SIZE_KEY, size);
}

function applyTheme(theme: "light" | "dark") {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem(THEME_KEY, theme);
}

// ─── Notification types ───────────────────────────────────────────────────────
type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min > 1 ? "s" : ""} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function toBadgeLabel(type: string) {
  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

// ─── Nav items ────────────────────────────────────────────────────────────────
type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/candidate", icon: Home },
  { label: "Profile", href: "/candidate/profile", icon: User },
  { label: "Job Search", href: "/candidate/jobs", icon: BriefcaseBusiness },
  { label: "Applications", href: "/candidate/applications", icon: FileText },
  { label: "AI Assistant", href: "/candidate/assistant", icon: Sparkles },
];

// ─── Notification dropdown ────────────────────────────────────────────────────
function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some((n) => !n.isRead);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const loadNotifications = async () => {
      try {
        const data = await request<NotificationItem[]>("/candidate/notifications?status=unread");
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      }
    };
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleReadAll = async () => {
    if (!hasUnread) return;
    try {
      await request<void>("/candidate/notifications/read-all", { method: "PATCH" });
    } finally {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-400)] transition-colors hover:bg-[var(--gray-100)] hover:text-[var(--gray-600)]"
      >
        <Bell className="h-[18px] w-[18px]" />
        {hasUnread && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] z-50">
          <div className="border-b border-[var(--border)] px-4 py-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">Notifications</h3>
            <button
              onClick={handleReadAll}
              disabled={!hasUnread}
              className="text-xs font-medium text-[var(--accent)] disabled:text-[var(--gray-400)] disabled:cursor-not-allowed hover:underline"
            >
              Read all
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--gray-500)]">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-light)]">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-4 transition-colors ${!n.isRead ? "bg-[var(--accent-light)]/30 hover:bg-[var(--accent-light)]/50" : "hover:bg-[var(--gray-50)]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-[var(--gray-900)]">
                            {n.title}
                          </p>
                          {n.type && (
                            <span className="inline-flex items-center rounded-full bg-[var(--status-green-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--status-green-text)]">
                              {toBadgeLabel(n.type)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--gray-600)] leading-snug">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-[var(--gray-400)] mt-2">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="h-2 w-2 rounded-full bg-[var(--accent)] mt-1 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Avatar dropdown ──────────────────────────────────────────────────────────
function AvatarDropdown({ onSignOut }: { onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [fontSizeValue, setFontSizeValue] = useState("20px");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [candidateEmail, setCandidateEmail] = useState("");

  // Fetch actual profile info
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      request("/candidate/profile").then((res) => {
        if (res && res.data && res.data.email) {
           setCandidateEmail(res.data.email);
        }
      }).catch(() => {});
    }
  }, []);

  // Init from localStorage on mount
  useEffect(() => {
    const savedFont = localStorage.getItem(FONT_SIZE_KEY) ?? "20px";
    setFontSizeValue(savedFont);
    applyFontSize(savedFont);

    const savedTheme = (localStorage.getItem(THEME_KEY) ?? "light") as "light" | "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleFontSize = (value: string) => {
    setFontSizeValue(value);
    applyFontSize(value);
  };

  const handleThemeToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  };

  const currentIdx = FONT_SIZES.findIndex((f) => f.value === fontSizeValue);

  const decrease = () => {
    if (currentIdx > 0) handleFontSize(FONT_SIZES[currentIdx - 1].value);
  };
  const increase = () => {
    if (currentIdx < FONT_SIZES.length - 1) handleFontSize(FONT_SIZES[currentIdx + 1].value);
  };

  const email = (() => {
    if (candidateEmail) return candidateEmail;
    if (typeof window === "undefined") return "";
    return localStorage.getItem("candidateEmail") ?? "";
  })();

  const initial = email ? email[0].toUpperCase() : "U";
  const isDark = theme === "dark";

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-1 py-1 pr-2.5 text-sm transition",
          open
            ? "border-[var(--accent)] bg-[var(--accent-light)]"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
        )}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white select-none">
          {initial}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[var(--gray-400)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)]">

          {/* ── User info ── */}
          <div className="bg-[var(--gray-50)] px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white select-none">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--gray-900)]">
                  {email || "—"}
                </p>
                <p className="truncate text-xs text-[var(--gray-400)]">Candidate Account</p>
              </div>
            </div>
          </div>

          {/* ── Account info link ── */}
          <div className="py-1">
            <Link
              href="/candidate/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--gray-600)] transition hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]"
            >
              <Info className="h-4 w-4 text-[var(--gray-400)]" />
              Account Information
            </Link>
          </div>

          {/* ── Theme toggle ── */}
          <div className="border-t border-[var(--border)] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isDark ? (
                  <Moon className="h-3.5 w-3.5 text-[var(--gray-400)]" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-[var(--gray-400)]" />
                )}
                <span className="text-xs font-medium text-[var(--gray-600)]">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </span>
              </div>

              {/* Pill toggle */}
              <button
                onClick={handleThemeToggle}
                aria-label="Toggle dark mode"
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200 focus:outline-none",
                  isDark
                    ? "bg-[var(--accent)] border-[var(--accent)]"
                    : "bg-[var(--gray-200)] border-[var(--border)]"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-transform duration-200",
                    isDark ? "translate-x-[22px]" : "translate-x-[2px]"
                  )}
                >
                  {isDark ? (
                    <Moon className="h-2.5 w-2.5 text-[var(--accent)]" />
                  ) : (
                    <Sun className="h-2.5 w-2.5 text-amber-600" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* ── Font size ── */}
          <div className="border-t border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <ALargeSmall className="h-3.5 w-3.5 text-[var(--gray-400)]" />
              <span className="text-xs font-medium text-[var(--gray-600)]">Text Size</span>
            </div>

            {/* Size buttons */}
            <div className="flex items-center gap-1 mb-2">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFontSize(f.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-0.5 rounded border px-1 py-1.5 text-xs whitespace-nowrap transition",
                    fontSizeValue === f.value
                      ? "border-[var(--accent)] bg-[var(--accent-light)] font-semibold text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--gray-400)] hover:border-[var(--gray-300)]"
                  )}
                >
                  {fontSizeValue === f.value && <Check className="h-2.5 w-2.5" />}
                  {f.label}
                </button>
              ))}
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between rounded border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
              <button
                onClick={decrease}
                disabled={currentIdx <= 0}
                className="flex h-8 w-8 items-center justify-center text-[var(--gray-600)] transition hover:bg-[var(--gray-100)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex-1 text-center text-xs font-medium text-[var(--gray-600)]">
                {FONT_SIZES.find((f) => f.value === fontSizeValue)?.label ?? "Default"}
              </span>
              <button
                onClick={increase}
                disabled={currentIdx >= FONT_SIZES.length - 1}
                className="flex h-8 w-8 items-center justify-center text-[var(--gray-600)] transition hover:bg-[var(--gray-100)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── Sign out ── */}
          <div className="border-t border-[var(--border)] py-1">
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] transition hover:bg-[var(--danger-bg)]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Site Header ──────────────────────────────────────────────────────────────

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(false);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () =>
      setCandidateLoggedIn(localStorage.getItem("candidateLoggedIn") === "1");
    update();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "candidateLoggedIn") update();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signOut = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("candidateLoggedIn");
    setCandidateLoggedIn(false);
    // Stay on the portal — guest can still browse Job Search
    window.location.replace("/candidate/jobs");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="relative mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
        <Logo />

        {/* Desktop nav — absolutely centered */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isHome = item.href === "/candidate";
            const isActive = isHome
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-[var(--accent)] bg-[var(--accent-light)]"
                    : "text-[var(--gray-600)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--accent)] lg:hidden" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right: notifications + avatar or login */}
        <div className="hidden items-center gap-2 md:flex">
          {candidateLoggedIn ? (
            <>
              <NotificationDropdown />
              <div className="h-6 w-px bg-[var(--gray-200)]" />
              <AvatarDropdown onSignOut={signOut} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/candidate-login"
                className="text-sm font-medium text-[var(--gray-600)] hover:text-[var(--accent)] transition"
              >
                Log in
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border)] text-[var(--gray-600)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Open navigation menu"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isHome = item.href === "/candidate";
              const isActive = isHome
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "text-[var(--gray-600)] hover:bg-[var(--gray-50)] hover:text-[var(--accent)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 flex flex-col gap-2 border-t border-[var(--border)] pt-5">
            {candidateLoggedIn ? (
              <>
                <Link
                  href="/candidate/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--gray-600)] hover:text-[var(--accent)] transition"
                >
                  <User className="h-4 w-4" />
                  Account Information
                </Link>
                <button
                  onClick={() => { signOut(); closeMenu(); }}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--danger)] hover:opacity-80 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/candidate-login"
                onClick={closeMenu}
                className="flex items-center gap-2 text-sm font-medium text-[var(--gray-600)] hover:text-[var(--accent)] transition"
              >
                <LogOut className="h-4 w-4" />
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
