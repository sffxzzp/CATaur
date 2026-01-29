"use client";

import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, FileText, Users, Building2, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/recruiter", Icon: LayoutDashboard },
  { label: "Job Orders", href: "/recruiter/job-orders", Icon: FileText },
  { label: "Candidates", href: "/recruiter/candidates", Icon: Users },
  { label: "Clients", href: "/recruiter/clients", Icon: Building2 },
  { label: "Reports", href: "/recruiter/reports", Icon: BarChart3 },
];

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Require login for recruiter portal without flashing content
  useEffect(() => {
    if (typeof window === "undefined") return;
    const loggedIn = localStorage.getItem("recruiterLoggedIn") === "1";
    if (!loggedIn) {
      setAuthorized(false);
      const redirect = encodeURIComponent(pathname || "/recruiter");
      window.location.replace(`/login?role=recruiter&redirect=${redirect}`);
      return;
    }
    setAuthorized(true);
  }, [pathname]);

  if (authorized !== true) {
    // While checking or redirecting, render nothing to avoid flash
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0c1022] text-slate-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col overflow-y-auto border-r border-white/10 bg-gradient-to-b from-[#172445] via-[#1e305d] to-[#0b142d] lg:flex">
        <div className="flex items-center gap-3 px-6 py-8">
          <Logo showText={false} className="h-10 w-10" />
          <div className="text-xs font-medium text-slate-300">
            Recruiter<br />Console
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {NAV_ITEMS.map((item) => {
            const isRoot = item.href === "/recruiter";
            const active = isRoot
              ? pathname === "/recruiter"
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.Icon && <item.Icon className="h-4 w-4 opacity-90" />}
                  {item.label}
                </span>
                
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-6">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/30 text-slate-200 hover:bg-white/10"
            asChild
          >
         
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar (toggleable) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 translate-x-[-100%] bg-gradient-to-b from-[#172445] via-[#1e305d] to-[#0b142d] border-r border-white/10 transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <Logo showText={false} className="h-8 w-8" />
            <div className="text-xs font-medium text-slate-300">
              Recruiter<br />Console
            </div>
          </div>
          <button
            aria-label="Close menu"
            className="rounded-md p-2 text-slate-300 hover:bg-white/10"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 px-4">
          {NAV_ITEMS.map((item) => {
            const isRoot = item.href === "/recruiter";
            const active = isRoot
              ? pathname === "/recruiter"
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.Icon && <item.Icon className="h-4 w-4 opacity-90" />}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 bg-[#f3f5fb]">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex flex-col text-xs text-slate-500">
                <span className="font-semibold text-slate-800">Allan Recruiter</span>
                <span>Last login · 2 hours ago</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-300 text-slate-700">
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("recruiterLoggedIn");
                    window.location.href = "/";
                  }
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </header>
        <main className="bg-[radial-gradient(circle_at_top,_rgba(34,58,129,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(19,26,62,0.1),_transparent_45%)]">
          {children}
        </main>
      </div>
    </div>
  );
}
