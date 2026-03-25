"use client";

import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BriefcaseBusiness,
    Users,
    FileCheck2,
    X,
    ChevronsLeft,
    ChevronsRight,
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
    { label: "Dashboard", href: "/client", icon: LayoutDashboard },
    { label: "Job Orders", href: "/client/orders", icon: BriefcaseBusiness },
    { label: "Applications", href: "/client/applications", icon: Users },
    { label: "Decisions", href: "/client/decisions", icon: FileCheck2 },
];

export function ClientSidebar({
    open,
    onClose,
    collapsed,
    onToggleCollapse,
    userName,
}: {
    open?: boolean;
    onClose?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    userName?: string;
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
                        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
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
                        href="/client"
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
                                style={{ filter: "hue-rotate(55deg) saturate(0.8)" }}
                                priority
                                unoptimized
                            />
                        </div>

                        {/* Name + role badge */}
                        {!collapsed && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-semibold text-[var(--gray-900)] leading-tight truncate">
                                    {userName || "Client User"}
                                </span>
                                <span className={cn(
                                    "mt-0.5 inline-flex self-start items-center rounded px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide leading-5",
                                    "bg-[var(--accent-light)] text-[var(--accent)]"
                                )}>
                                    Client
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
                    <ul className="space-y-0.5">
                        {NAV_ITEMS.map((item, i) => renderNavItem(item, i === 0))}
                    </ul>
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
