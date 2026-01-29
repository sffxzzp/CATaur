import { Logo } from "@/components/branding/logo";
import Link from "next/link";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface/80">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <Logo />
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </main>
  
    </div>
  );
}
