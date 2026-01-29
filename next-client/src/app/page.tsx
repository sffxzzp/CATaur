import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, ShieldCheck, Building2, Puzzle } from "lucide-react";

function Card({
  title,
  description,
  href,
  icon: Icon,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "blue" | "slate";
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_40px_90px_-70px_rgba(15,23,42,0.35)]">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            accent === "blue" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-700"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <Button asChild className="mt-5 self-start">
        <Link href={href}>Enter</Link>
      </Button>
    </div>
  );
}

export default function RootPage() {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Choose a workspace</h1>
           
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Candidate"
            description="Search jobs, manage profile, track applications."
            href="/candidate"
            icon={Users}
            accent="blue"
          />
          <Card
            title="Recruiter"
            description="Dashboards, job orders, candidates, clients."
            href="/recruiter"
            icon={Briefcase}
            accent="slate"
          />
         
        </section>
      </div>
    </main>
  );
}
