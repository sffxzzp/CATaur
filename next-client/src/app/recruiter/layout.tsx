"use client";

import { RecruiterSidebar } from "@/components/layout/recruiter-sidebar";
import { Bell, ChevronRight, Menu, User, Type, Sun, Moon, LogOut, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { request } from "@/lib/request";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/recruiter": { title: "Dashboard", subtitle: "Overview of your recruitment pipeline" },
  "/recruiter/job-orders": { title: "Job Orders", subtitle: "Manage and track all open requisitions" },
  "/recruiter/applications": { title: "Applications", subtitle: "Track and manage candidate applications" },
  "/recruiter/candidates": { title: "Candidates", subtitle: "Your talent pool" },
  "/recruiter/clients": { title: "Companies", subtitle: "Manage client relationships" },
  "/recruiter/reports": { title: "Reports & Analytics", subtitle: "Performance metrics and insights" },
  "/recruiter/users": { title: "User Management", subtitle: "Manage user accounts and permissions" },
  "/recruiter/ai": { title: "AI Provider Config", subtitle: "Securely manage provider credentials" },
  "/recruiter/email": { title: "Email Server", subtitle: "SMTP configuration and sender identity" },
  "/recruiter/activity": { title: "Audit Logs", subtitle: "Track sign-ins, updates, and admin actions" },
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const info = PAGE_TITLES[path];
    crumbs.push({
      label: info?.title || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      href: path,
    });
  }
  return crumbs;
}

const FONT_SIZES = [
  { label: "X-Small", value: 0.75 },
  { label: "Small", value: 0.875 },
  { label: "Medium", value: 1 },
  { label: "Large", value: 1.125 },
] as const;

/* ─── Notification Dropdown ──────────────────────────────────────────────── */

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

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some((n) => !n.isRead);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await request<NotificationItem[]>("/recruiter/notifications?status=unread");
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      }
    };
    loadNotifications();
  }, []);

  // Close on click-outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
  };

  const handleReadAll = async () => {
    if (!hasUnread) return;
    try {
      await request<void>("/recruiter/notifications/read-all", { method: "PATCH" });
    } finally {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] hover:text-[var(--gray-600)] transition-colors"
      >
        <Bell className="h-[18px] w-[18px]" />
        {hasUnread && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] animate-scale-in z-50">
          <div className="border-b border-[var(--border)] px-4 py-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">Notifications</h3>
            <button
              onClick={handleReadAll}
              disabled={!hasUnread}
              className="text-xs font-medium text-[var(--accent)] disabled:text-[var(--gray-400)] disabled:cursor-not-allowed cursor-pointer hover:underline"
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
                  <div key={n.id} className={`p-4 transition-colors cursor-pointer ${!n.isRead ? "bg-[var(--accent-light)]/30 hover:bg-[var(--accent-light)]/50" : "hover:bg-[var(--gray-50)]"}`}>
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

/* ─── Avatar Dropdown ────────────────────────────────────────────────────── */

function AvatarDropdown() {
  const [open, setOpen] = useState(false);
  const [fontIdx, setFontIdx] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [nickname, setNickname] = useState("Recruiter");
  const [email, setEmail] = useState("-");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Init from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("catats-theme") as "light" | "dark" | null;
    const initial = saved || "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);

    const savedFont = localStorage.getItem("catats-font-idx");
    if (savedFont !== null) {
      const idx = Number(savedFont);
      setFontIdx(idx);
      document.documentElement.style.setProperty("--font-scale", String(FONT_SIZES[idx]?.value ?? 0.875));
    } else {
      // No saved preference — apply default (Small / 0.875)
      document.documentElement.style.setProperty("--font-scale", String(FONT_SIZES[0].value));
    }
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await request<{ id?: string; nickname?: string; email?: string; avatarUrl?: string }>("/users/me");
        setNickname(user?.nickname || "Recruiter");
        setEmail(user?.email || "-");

        const uid = user?.id || "";
        const localAvatar = uid ? localStorage.getItem(`avatar_${uid}`) : null;
        setAvatarUrl(localAvatar || user?.avatarUrl || null);
      } catch {
        setNickname("Recruiter");
        setEmail("-");
        setAvatarUrl(null);
      }
    };
    loadCurrentUser();

    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarUrl: string }>;
      setAvatarUrl(customEvent.detail.avatarUrl);
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  // Close on click-outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Apply font scale
  const handleFontChange = (idx: number) => {
    setFontIdx(idx);
    localStorage.setItem("catats-font-idx", String(idx));
    document.documentElement.style.setProperty("--font-scale", String(FONT_SIZES[idx].value));
  };

  // Apply theme
  const handleThemeChange = (t: "light" | "dark") => {
    setTheme(t);
    localStorage.setItem("catats-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const signOut = () => {
    localStorage.removeItem("recruiterLoggedIn");
    localStorage.removeItem("userRole");
    window.location.replace("/login?role=recruiter");
  };

  const avatarLabel = nickname
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "R";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-semibold text-white transition-shadow hover:ring-2 hover:ring-[var(--accent-ring)] hover:ring-offset-1 overflow-hidden"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          avatarLabel
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] animate-scale-in z-50">
          {/* User info */}
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--gray-900)]">{nickname}</p>
            <p className="text-xs text-[var(--gray-500)]">{email}</p>
          </div>

          {/* Profile */}
          <div className="py-1">
            <Link
              href="/recruiter/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-100)]"
            >
              <User className="h-4 w-4 text-[var(--gray-400)]" />
              Profile
            </Link>
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* Font Size */}
          <div className="py-1">
            <div className="px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--gray-400)]">
              Font Size
            </div>
            {FONT_SIZES.map((fs, i) => (
              <button
                key={fs.label}
                onClick={() => handleFontChange(i)}
                className="flex w-full items-center gap-3 px-4 py-1.5 text-sm text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-100)]"
              >
                <Type className="h-4 w-4 text-[var(--gray-400)]" />
                <span className="flex-1 text-left">{fs.label}</span>
                {fontIdx === i && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
              </button>
            ))}
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* Theme */}
          <div className="py-1">
            <div className="px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--gray-400)]">
              Theme
            </div>
            <button
              onClick={() => handleThemeChange("light")}
              className="flex w-full items-center gap-3 px-4 py-1.5 text-sm text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-100)]"
            >
              <Sun className="h-4 w-4 text-[var(--gray-400)]" />
              <span className="flex-1 text-left">Light</span>
              {theme === "light" && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className="flex w-full items-center gap-3 px-4 py-1.5 text-sm text-[var(--gray-700)] cursor-pointer hover:bg-[var(--gray-100)]"
            >
              <Moon className="h-4 w-4 text-[var(--gray-400)]" />
              <span className="flex-1 text-left">Dark</span>
              {theme === "dark" && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
            </button>
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--danger)] cursor-pointer hover:bg-[var(--danger-bg)]"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Layout ─────────────────────────────────────────────────────────────── */

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loggedIn = localStorage.getItem("recruiterLoggedIn") === "1";
    if (!loggedIn) {
      setAuthorized(false);
      window.location.replace("/login?role=recruiter");
      return;
    }
    setAuthorized(true);
    setIsAdmin(localStorage.getItem("userRole") === "admin");
  }, [pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (authorized !== true) return null;

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <RecruiterSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={desktopCollapsed}
        onToggleCollapse={() => setDesktopCollapsed(v => !v)}
        isAdmin={isAdmin}
      />

      <div className={`flex flex-1 flex-col transition-all duration-200 ${desktopCollapsed ? "lg:pl-[64px]" : "lg:pl-[240px]"}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-500)] cursor-pointer hover:bg-[var(--gray-100)] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--gray-300)]" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-[var(--gray-900)]">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-[var(--gray-400)] cursor-pointer hover:text-[var(--gray-600)] transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            {/* Mobile: just current page title */}
            <span className="sm:hidden text-sm font-semibold text-[var(--gray-900)]">
              {breadcrumbs[breadcrumbs.length - 1]?.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationDropdown />

            <div className="ml-1 h-6 w-px bg-[var(--gray-200)]" />

            {/* Avatar Dropdown */}
            <div className="ml-1">
              <AvatarDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
