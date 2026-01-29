"use client";

import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { authClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/candidate" },
  { label: "Profile", href: "/candidate/profile" },
  { label: "Job Search", href: "/candidate/jobs" },
  { label: "Applications", href: "/candidate/applications" },
  { label: "AI Assistant", href: "/candidate/assistant" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateLocal = () => setCandidateLoggedIn(localStorage.getItem("candidateLoggedIn") === "1");
    const hydrate = async () => {
      try {
        const res = await authClient.me();
        if (res.user?.role === "candidate") {
          localStorage.setItem("candidateLoggedIn", "1");
        }
      } catch (_) {
        /* ignore */
      }
      updateLocal();
    };
    hydrate();
    updateLocal();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "candidateLoggedIn") updateLocal();
    };
    const onAuth = () => updateLocal();
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-updated", onAuth);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-updated", onAuth);
    };
  }, []);

  const performLogout = async () => {
    try {
      await authClient.logout();
    } catch (_) {
      /* ignore */
    }
    localStorage.removeItem("candidateLoggedIn");
    setCandidateLoggedIn(false);
    window.dispatchEvent(new Event("auth-updated"));
    window.location.replace("/login?role=candidate&redirect=%2Fcandidate");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav className="hidden items-center gap-9 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isHome = item.href === "/candidate";
            const isActive = isHome
              ? pathname === item.href // Home only active on exact path
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium tracking-tight transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {candidateLoggedIn ? (
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              onClick={() => setShowLogout(true)}
            >
              Sign out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Create profile</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary/60 hover:text-primary lg:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Open navigation menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border/70 bg-white/90 px-6 py-5 shadow-[0_40px_70px_-50px_rgba(15,30,64,0.35)] backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_ITEMS.map((item) => {
              const isHome = item.href === "/candidate";
              const isActive = isHome
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "text-base font-medium",
                    isActive ? "text-foreground" : "text-muted hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            {candidateLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700"
                onClick={() => {
                  setShowLogout(true);
                  closeMenu();
                }}
              >
                Sign out
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login" onClick={closeMenu}>
                    Log in
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register" onClick={closeMenu}>
                    Create profile
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <Modal open={showLogout} onClose={() => setShowLogout(false)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Confirm sign out</h3>
              <p className="text-sm text-muted-foreground">We'll clear your secure session and return to login.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowLogout(false)}>
              Stay signed in
            </Button>
            <Button size="sm" onClick={performLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
