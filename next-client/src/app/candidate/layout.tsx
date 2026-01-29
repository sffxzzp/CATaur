"use client";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { authClient } from "@/lib/api";
import { useEffect, useState } from "react";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Candidate now requires login; avoid flashing content
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkAuth = async () => {
      try {
        const res = await authClient.me();
        if (res.user?.role === "candidate") {
          setAuthorized(true);
          localStorage.setItem("candidateLoggedIn", "1");
          return;
        }
      } catch (_) {
        /* ignore */
      }
      setAuthorized(false);
      const redirect = encodeURIComponent("/candidate");
      window.location.replace(`/login?role=candidate&redirect=${redirect}`);
    };
    checkAuth();
  }, []);

  if (authorized !== true) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(900px_500px_at_110%_10%,rgba(236,72,153,0.16),transparent_55%),radial-gradient(800px_500px_at_50%_120%,rgba(20,184,166,0.14),transparent_55%)]" />
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
