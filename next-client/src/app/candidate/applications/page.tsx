"use client";

import { Button } from "@/components/ui/button";
import React, { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { CalendarClock, CheckCircle2, ClipboardCheck } from "lucide-react";

const KPIS = [
  { title: "Interviews", value: "3", caption: "This week", icon: CalendarClock },
  { title: "Awaiting feedback", value: "2", caption: "Needs review", icon: ClipboardCheck },
  { title: "Offers", value: "1", caption: "In negotiation", icon: CheckCircle2 },
];

type RecentApplication = {
  appliedAt: string;
  role: string;
  company: string;
  status: string;
};

const RECENT_APPLICATIONS: RecentApplication[] = [
  { appliedAt: "2025-10-24 10:12", role: "Senior Backend Engineer (Go)", company: "Maple Fintech · Toronto", status: "In review" },
  { appliedAt: "2025-10-24 09:01", role: "Frontend Engineer (React/Next.js)", company: "Aurora Health · Vancouver", status: "Awaiting feedback" },
  { appliedAt: "2025-10-23 17:45", role: "DevOps / SRE", company: "Granite AI · Calgary", status: "Interview scheduled" },
  { appliedAt: "2025-10-23 14:30", role: "Data Engineer", company: "Polar Analytics · Montreal", status: "In review" },
  { appliedAt: "2025-10-22 11:18", role: "Mobile Engineer (iOS)", company: "Lighthouse Mobility · Ottawa", status: "Offer discussion" },
  { appliedAt: "2025-10-21 16:05", role: "Full‑stack Engineer", company: "Cedar Labs · Remote Canada", status: "In review" },
];

// Replaced kanban-like pipeline with candidate-centric data
const UPCOMING = [
  { when: "Thu · 14:30 EDT", role: "DevOps / SRE", company: "Granite AI · Calgary", note: "Panel interview · Zoom" },
  { when: "Fri · 09:00 PDT", role: "Frontend Engineer (React)", company: "Aurora Health · Vancouver", note: "Portfolio review" },
  { when: "Mon · 11:00 EST", role: "Senior Backend Engineer (Go)", company: "Maple Fintech · Toronto", note: "System design round" },
];

const NOTES = [
  "Highlight scale-up playbooks for Eurora Cloud.",
  "Confirm compensation range before next Atlas call.",
  "Upload portfolio links for Nova Analytics.",
];

const TASKS = [
  "Confirm availability for next round",
  "Share GitHub/portfolio links",
  "Add references for Maple Fintech",
];

export default function ApplicationsPage() {
  return (
    <div className="px-6 pb-20 pt-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Recent applications */}
        <section className="rounded-[32px] border border-border bg-white/90 px-8 py-8 shadow-[0_32px_80px_-60px_rgba(12,24,55,0.65)]">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Recent applications</h1>
          </div>
          <RecentList />
        </section>

        <section className="rounded-[32px] border border-border bg-white/90 p-6 shadow-[0_32px_100px_-70px_rgba(12,24,55,0.65)]">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">Candidate view</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Upcoming interviews & next steps</h2>
          </div>

          {/* KPIs row */}
          <div className="grid gap-4 md:grid-cols-3">
            {KPIS.map((k) => (
              <KpiCard key={k.title} title={k.title} value={k.value} caption={k.caption} icon={k.icon} max={8} />
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <SimplePanel title="Upcoming interviews" icon={<CalendarClock className="h-5 w-5" />}>
              <ul className="space-y-3 text-sm text-muted">
                {UPCOMING.map((e) => (
                  <li key={`${e.when}-${e.role}`} className="flex items-start justify-between rounded-2xl border border-border/70 bg-white px-4 py-3">
                    <div>
                      <p className="text-xs text-primary">{e.when}</p>
                      <p className="text-base font-semibold text-foreground">{e.role}</p>
                      <p className="text-xs text-muted-foreground">{e.company}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{e.note}</span>
                  </li>
                ))}
              </ul>
            </SimplePanel>

            <SimplePanel title="Next steps" icon={<ClipboardCheck className="h-5 w-5" />}>
              <ul className="space-y-2 text-sm text-muted">
                {TASKS.map((t) => (
                  <li key={t} className="flex items-center gap-2 rounded-2xl border border-border/70 bg-white px-4 py-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-right">
                <Button variant="ghost" size="sm" className="border border-border px-4">Mark completed</Button>
              </div>
            </SimplePanel>
          </div>
        </section>

        {/* Shared notes / Next actions removed as requested */}
      </div>
    </div>
  );
}

type KpiCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  max: number;
};

function KpiCard({ title, value, caption, icon: Icon, max }: KpiCardProps) {
  const v = Number(value) || 0;
  const pct = Math.max(5, Math.min(100, (v / Math.max(1, max)) * 100));
  return (
    <div className="rounded-[24px] border border-border bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <span className="text-sm text-muted-foreground">{caption}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#ec4899]" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{v}</div>
        </div>
      </div>
    </div>
  );
}

function RecentList() {
  const [count, setCount] = useState(5);
  const visible = RECENT_APPLICATIONS.slice(0, count);
  const canMore = count < RECENT_APPLICATIONS.length;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-[13px] font-medium text-slate-600">
            <tr>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-200">
                <td className="px-4 py-3 text-slate-600">{row.appliedAt}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{row.role}</td>
                <td className="px-4 py-3">{row.company}</td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canMore && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" className="border border-border px-4" onClick={() => setCount((c) => Math.min(c + 5, RECENT_APPLICATIONS.length))}>
            View more
          </Button>
        </div>
      )}
    </div>
  );
}

type SimplePanelProps = {
  title: string;
  icon: ReactNode;
  children: React.ReactNode;
};

function SimplePanel({ title, icon, children }: SimplePanelProps) {
  return (
    <div className="rounded-[32px] border border-border bg-white/90 p-6 shadow-[0_24px_80px_-60px_rgba(12,24,55,0.65)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
