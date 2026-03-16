"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  X,
  Zap,
  ChevronsLeft,
  ChevronsRight,
  Users2,
  BrainCircuit,
  Mail,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LogoPng from "@/components/images/logo.png";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Job Orders", href: "/recruiter/job-orders", icon: FileText },
  { label: "Applications", href: "/recruiter/applications", icon: ClipboardCheck },
  { label: "Candidates", href: "/recruiter/candidates", icon: Users },
  { label: "Companies", href: "/recruiter/clients", icon: Building2 },
  { label: "Reports", href: "/recruiter/reports", icon: BarChart3 },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "User Management", href: "/recruiter/users", icon: Users2 },
  { label: "AI Provider Config", href: "/recruiter/ai", icon: BrainCircuit },
  { label: "Email Server", href: "/recruiter/email", icon: Mail },
  { label: "Audit Logs", href: "/recruiter/activity", icon: ClipboardList },
];

export function RecruiterSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  isAdmin,
}: {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem, isRoot = false) => {
    const active = isRoot
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onClose}
          title={collapsed ? item.label : undefined}
          className={cn(
            "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            collapsed && "lg:justify-center lg:px-0",
            active
              ? "bg-[var(--accent-light)] text-[var(--accent)]"
              : "text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-100)] hover:text-[var(--gray-900)]"
          )}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--accent)]" />
          )}
          <item.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              active ? "text-[var(--accent)]" : "text-[var(--gray-400)] group-hover:text-[var(--gray-600)]"
            )}
          />
          <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-[var(--surface)] border-[var(--border)] transition-all duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:translate-x-0 lg:w-[64px]" : "lg:translate-x-0 lg:w-[240px]",
          "w-[240px]"
        )}
      >
        {/* Logo / brand */}
        <div className={cn(
          "flex h-14 items-center shrink-0 border-b border-[var(--border)]",
          collapsed ? "lg:justify-center px-0" : "justify-between px-4"
        )}>
          <Link
            href="/recruiter"
            className={cn("flex items-center gap-2.5 min-w-0", collapsed && "lg:justify-center")}
          >
            {/* Logo image */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
              <Image
                src={LogoPng}
                alt="Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
                unoptimized
              />
            </div>

            {/* Name + role badge */}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-[var(--gray-900)] leading-tight truncate">
                  {isAdmin ? "Allan Admin" : "Allan Recruiter"}
                </span>
                <span className={cn(
                  "mt-0.5 inline-flex self-start items-center rounded px-1.5 py-0 text-xs font-semibold uppercase tracking-wide leading-5",
                  isAdmin
                    ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]"
                    : "bg-[var(--accent-light)] text-[var(--accent)]"
                )}>
                  {isAdmin ? "Admin" : "Recruiter"}
                </span>
              </div>
            )}
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {/* Core menu */}
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item, i) => renderNavItem(item, i === 0))}
          </ul>

          {/* Administration section — admin only */}
          {isAdmin && (
            <>
              <div className={cn("mt-4 mb-1 px-3", collapsed && "lg:hidden")}>
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--gray-400)]">
                  Administration
                </span>
              </div>
              {collapsed && (
                <div className="mt-3 mb-1 mx-2 border-t border-[var(--border)]" />
              )}
              <ul className="space-y-0.5">
                {ADMIN_NAV_ITEMS.map((item) => renderNavItem(item))}
              </ul>
            </>
          )}
        </nav>

        {/* Desktop collapse toggle */}
        <div className={cn(
          "hidden lg:flex border-t border-[var(--border)] py-2",
          collapsed ? "justify-center" : "justify-end px-3"
        )}>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] hover:text-[var(--gray-600)] transition-colors"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
