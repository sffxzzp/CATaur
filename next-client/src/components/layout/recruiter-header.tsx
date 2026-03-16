"use client";

import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    Users,
    Building2,
    BarChart3,
    Menu,
    X,
    LogOut,
    Settings,
    User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
    { label: "Job Orders", href: "/recruiter/job-orders", icon: FileText },
    { label: "Candidates", href: "/recruiter/candidates", icon: Users },
    { label: "Clients", href: "/recruiter/clients", icon: Building2 },
    { label: "Reports", href: "/recruiter/reports", icon: BarChart3 },
];

export function RecruiterHeader() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [recruiterLoggedIn, setRecruiterLoggedIn] = useState(false);

    const closeMenu = () => setIsOpen(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const update = () =>
            setRecruiterLoggedIn(localStorage.getItem("recruiterLoggedIn") === "1");
        update();
        const onStorage = (e: StorageEvent) => {
            if (e.key === "recruiterLoggedIn") update();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const signOut = () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem("recruiterLoggedIn");
        setRecruiterLoggedIn(false);
        window.location.replace("/login?role=recruiter");
    };

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <Logo />
                    <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 sm:inline-block">
                        Recruiter Console
                    </span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 lg:flex">
                    {NAV_ITEMS.map((item) => {
                        const isRoot = item.href === "/recruiter";
                        const isActive = isRoot
                            ? pathname === "/recruiter"
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer hover:text-primary",
                                    isActive
                                        ? "text-primary after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                        : "text-slate-600"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="hidden items-center gap-4 lg:flex">
                    {recruiterLoggedIn && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-9 w-9 rounded-full"
                                >
                                    <Avatar className="h-9 w-9 border border-slate-200">
                                        <AvatarImage src="/avatars/02.png" alt="Recruiter" />
                                        <AvatarFallback>AR</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Allan Recruiter
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            allan@cataur.com
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={signOut} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors cursor-pointer hover:border-primary cursor-pointer hover:text-primary lg:hidden"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-label="Open navigation menu"
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="border-t border-slate-200 bg-white px-6 py-5 shadow-lg lg:hidden">
                    <nav className="flex flex-col gap-2">
                        {NAV_ITEMS.map((item) => {
                            const isRoot = item.href === "/recruiter";
                            const isActive = isRoot
                                ? pathname === "/recruiter"
                                : pathname === item.href ||
                                pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors",
                                        isActive
                                            ? "bg-slate-50 text-primary"
                                            : "text-slate-600 cursor-pointer hover:bg-slate-50 cursor-pointer hover:text-primary"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-6 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <Avatar className="h-10 w-10 border border-slate-200">
                                <AvatarFallback>AR</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">
                                    Allan Recruiter
                                </span>
                                <span className="text-xs text-slate-500">allan@cataur.com</span>
                            </div>
                        </div>
                        <div className="mt-2 space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-slate-600 cursor-pointer hover:text-primary"
                                onClick={closeMenu}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-red-600 cursor-pointer hover:bg-red-50 cursor-pointer hover:text-red-700"
                                onClick={() => {
                                    signOut();
                                    closeMenu();
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
