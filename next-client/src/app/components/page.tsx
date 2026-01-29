"use client";

import { Button } from "@/components/ui/button";
import { DataTable, GradientCard, Section } from "@/components/recruiter/cards";
import { cn } from "@/lib/utils";
import { Download, Filter, Sparkles } from "lucide-react";

type SeriesPoint = { label: string; value: number };

function LineMini({ data, color = "#2563eb" }: { data: SeriesPoint[]; color?: string }) {
  const W = 220, H = 64, P = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map((d, i) => {
    const x = P + (i * (W - 2 * P)) / (data.length - 1);
    const y = H - P - (d.value / max) * (H - 2 * P);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts.join(" ")} />
    </svg>
  );
}

function BarMini({ data, color = "#7c3aed" }: { data: SeriesPoint[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex-1">
          <div className="h-10 rounded bg-slate-100">
            <div className="mx-auto w-2 rounded" style={{ height: `${(d.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ComponentsGallery() {
  const demoRows = [
    { col1: "Row A", col2: "Detail", col3: "Meta" },
    { col1: "Row B", col2: "Detail", col3: "Meta" },
    { col1: "Row C", col2: "Detail", col3: "Meta" },
  ];
  const trend: SeriesPoint[] = [
    { label: "1", value: 3 },
    { label: "2", value: 5 },
    { label: "3", value: 4 },
    { label: "4", value: 7 },
    { label: "5", value: 6 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Components Gallery</h1>
        <p className="text-sm text-slate-600">Reusable UI kit matching the current app styles for fast Figma prototyping.</p>
      </header>

      <div className="space-y-6">
        <Section title="Buttons" subtitle="Variants and sizes" icon={<Sparkles className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-3 px-5 py-5">
            <Button>Primary</Button>
            <Button variant="outline" className="border-slate-300 text-slate-700">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button variant="outline" className="border-slate-300 text-slate-700" size="sm">
              <Download className="mr-2 h-4 w-4" /> With icon
            </Button>
          </div>
        </Section>

        <Section title="Pills & Badges" subtitle="Chips for filters and tags">
          <div className="flex flex-wrap gap-2 px-5 py-5 text-xs">
            <span className="rounded-full border border-slate-300 px-4 py-2">Default pill</span>
            <span className="rounded-full border border-slate-300 bg-primary/10 px-4 py-2 text-primary">Active pill</span>
            <span className="rounded-full border border-slate-300 px-4 py-2 uppercase tracking-[0.12em]">Uppercase chip</span>
          </div>
        </Section>

        <Section title="Form controls" subtitle="Inputs & selects" icon={<Filter className="h-4 w-4" />}>
          <div className="flex flex-wrap items-center gap-3 px-5 py-5">
            <div className="rounded-full border border-slate-300 bg-white px-5 py-2">
              <input className="w-64 border-0 bg-transparent text-sm outline-none" placeholder="Search…" />
            </div>
            <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option>All</option>
              <option>Active</option>
              <option>Archived</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" /> Checkbox
            </label>
          </div>
        </Section>

        <Section title="Cards & KPIs" subtitle="Gradient cards and stat bars">
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-3">
            <GradientCard title="18" subtitle="Active job orders" accent="from-[#4f46e5] via-[#4338ca] to-[#312e81]" />
            <GradientCard title="9" subtitle="Interviews scheduled" accent="from-[#22d3ee] via-[#0ea5e9] to-[#2563eb]" />
            <GradientCard title="37 days" subtitle="Avg time-to-fill" accent="from-[#34d399] via-[#10b981] to-[#047857]" />
          </div>
        </Section>

        <Section title="Table" subtitle="DataTable component">
          <div className="px-5 pb-6">
            <DataTable
              columns={[
                { key: "col1", label: "Column 1" },
                { key: "col2", label: "Column 2" },
                { key: "col3", label: "Column 3" },
              ]}
              rows={demoRows}
            />
          </div>
        </Section>

        <Section title="Progress & Charts" subtitle="Mini progress bar and charts">
          <div className="grid gap-6 px-5 py-5 md:grid-cols-3">
            <div>
              <p className="mb-2 text-sm text-slate-600">Progress</p>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#ec4899]" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-600">Line</p>
              <LineMini data={trend} />
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-600">Bars</p>
              <BarMini data={trend} />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

