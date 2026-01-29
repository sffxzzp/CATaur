import { Button } from "@/components/ui/button";
import { ArrowRight, BellRing, BriefcaseBusiness, CalendarClock, FolderCheck, Mail, MapPin, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const RECOMMENDED_JOBS = [
  {
    title: "Senior Backend Engineer (Go)",
    company: "Neptune Pay",
    location: "Remote · Canada",
    match: "93%",
    tags: ["Go", "PostgreSQL", "Microservices"],
  },
  {
    title: "Frontend Engineer (React/Next.js)",
    company: "Eurora Cloud Platform",
    location: "Hybrid · Toronto",
    match: "90%",
    tags: ["TypeScript", "React", "Tailwind"],
  },
  {
    title: "DevOps / SRE",
    company: "Atlas Robotics",
    location: "Hybrid · Vancouver",
    match: "88%",
    tags: ["Kubernetes", "AWS", "Terraform"],
  },
  {
    title: "Mobile Engineer (iOS)",
    company: "Orbit Health",
    location: "Remote · Montreal",
    match: "86%",
    tags: ["Swift", "SwiftUI", "CI/CD"],
  },
  {
    title: "Data Engineer",
    company: "Nova Analytics",
    location: "Hybrid · Calgary",
    match: "85%",
    tags: ["Python", "Airflow", "dbt"],
  },
  {
    title: "Full‑stack Engineer",
    company: "Lunaris AI",
    location: "On-site · Ottawa",
    match: "84%",
    tags: ["Next.js", "Node.js", "Prisma"],
  },
];

const APPLICATION_SUMMARY = [
  { label: "In review", value: "4" },
  { label: "Interviews", value: "3" },
  { label: "Offers", value: "1" },
  { label: "Archived", value: "6" },
];

// Removed Active pipeline dataset per layout revision

type Reminder = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const REMINDERS: Reminder[] = [
  {
    icon: CalendarClock,
    title: "Panel interview",
    description: "Thu 14:30 CET · Eurora Cloud",
  },
  {
    icon: Mail,
    title: "Send thank-you note",
    description: "Client interview follow-up · Atlas Robotics",
  },
  {
    icon: FolderCheck,
    title: "Upload portfolio",
    description: "Add case studies for Nova Analytics",
  },
];

const AI_ASSIST = [
  {
    title: "Interview prep pack",
    description: "Cue cards and market intel refreshed this morning.",
  },
  {
    title: "Resume suggestions",
    description: "Quantify impact for lifecycle marketing achievements.",
  },
];

export default function CandidateDashboard() {
  return (
    <div className="space-y-10 px-6 pb-20 pt-12">
      <header className="mx-auto w-full max-w-6xl rounded-[32px] border border-border bg-white/90 px-8 py-8 shadow-[0_32px_80px_-60px_rgba(12,24,55,0.65)]">
        <div className="flex flex-col gap-5">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Candidate dashboard
            </span>
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Your activity overview</h1>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="md" className="px-6">
                Continue application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPLICATION_SUMMARY.map((k) => (
            <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">{k.label}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{k.value}</div>
            </div>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6">
        {/* Charts first */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[32px] border border-border bg-white/90 p-6 shadow-[0_28px_90px_-70px_rgba(12,24,55,0.6)]">
            <header className="mb-2">
              <h2 className="text-base font-semibold text-slate-900">Applications (weekly)</h2>
              <p className="text-sm text-slate-500">Last 12 weeks</p>
            </header>
            <LineChart data={WEEKLY_APPLICATIONS} color="#2563eb" />
          </section>

          <section className="rounded-[32px] border border-border bg-white/90 p-6 shadow-[0_28px_90px_-70px_rgba(12,24,55,0.6)]">
            <header className="mb-2">
              <h2 className="text-base font-semibold text-slate-900">Stage breakdown</h2>
              <p className="text-sm text-slate-500">Current pipeline by stage</p>
            </header>
            <BarChart data={APPLICATION_SUMMARY.map((d) => ({ label: d.label, value: Number(d.value) }))} color="#7c3aed" />
          </section>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_0.4fr]">
          <section className="self-stretch">
            <DashboardCard title="Suggested for you" icon={BriefcaseBusiness}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {RECOMMENDED_JOBS.map((job) => (
                  <div
                    key={job.title}
                    className="flex h-full flex-col gap-4 rounded-[24px] border border-border/80 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.company}</p>
                      </div>
                      <span className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full bg-primary/10 px-3 text-xs font-semibold leading-none text-primary">Match {job.match}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <MapPin className="h-4 w-4 text-primary" />
                      {job.location}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {job.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-border px-3 py-1">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <Button size="sm" className="w-full justify-center">View details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </section>

          <aside className="space-y-6">
            <DashboardCard title="Reminders" icon={BellRing}>
              <ul className="space-y-3 text-sm text-muted">
                {REMINDERS.map((reminder) => {
                  const Icon = reminder.icon;
                  return (
                    <li key={reminder.title} className="flex items-start gap-3 rounded-[18px] border border-border/70 bg-white px-4 py-3">
                      <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{reminder.title}</p>
                        <p className="text-xs text-muted-foreground">{reminder.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </DashboardCard>

            <DashboardCard title="AI assistant" icon={Sparkles}>
              <div className="space-y-3 text-sm text-muted">
                {AI_ASSIST.map((card) => (
                  <div key={card.title} className="rounded-[20px] border border-border/70 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                    <button className="mt-3 inline-flex items-center text-xs font-medium text-primary">
                      Open module
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </aside>
        </div>
      </main>
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

function DashboardCard({ title, icon: Icon, children }: DashboardCardProps) {
  return (
    <section className="rounded-[32px] border border-border bg-white/90 p-6 shadow-[0_28px_90px_-70px_rgba(12,24,55,0.6)]">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

// ----- Lightweight charts (SVG) -----
type SeriesPoint = { label: string; value: number };

const WEEKLY_APPLICATIONS: SeriesPoint[] = Array.from({ length: 12 }, (_, i) => ({
  label: `W${i + 1}`,
  value: [2, 3, 4, 3, 5, 6, 4, 7, 5, 6, 8, 7][i] ?? 3,
}));

function LineChart({ data, color = "#2563eb" }: { data: SeriesPoint[]; color?: string }) {
  const W = 640, H = 180, P = 28;
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map((d, i) => {
    const x = P + (i * (W - 2 * P)) / (data.length - 1);
    const y = H - P - (d.value / max) * (H - 2 * P);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="lg-cand" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts.join(" ")} />
      <polygon fill="url(#lg-cand)" points={`${P},${H - P} ${pts.join(" ")} ${W - P},${H - P}`} />
      {data.map((d, i) => {
        const x = P + (i * (W - 2 * P)) / (data.length - 1);
        const y = H - P - (d.value / max) * (H - 2 * P);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function BarChart({ data, color = "#7c3aed" }: { data: SeriesPoint[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex-1">
          <div className="h-40 rounded-md bg-slate-100">
            <div
              className="mx-auto w-4 rounded-md"
              style={{ height: `${(d.value / max) * 100}%`, background: color }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <div className="mt-2 text-center text-xs text-slate-600">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
