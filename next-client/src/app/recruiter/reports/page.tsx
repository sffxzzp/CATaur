"use client";

import { Button } from "@/components/ui/button";
import { REPORTS, JOB_ORDERS, CANDIDATE_RECORDS } from "@/data/recruiter";
import { useMemo, useRef } from "react";
import { Download, Printer } from "lucide-react";

type SeriesPoint = { label: string; value: number };

function LineChart({ data, color = "#2563eb" }: { data: SeriesPoint[]; color?: string }) {
  const W = 640, H = 180, P = 28; // width, height, padding
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map((d, i) => {
    const x = P + (i * (W - 2 * P)) / (data.length - 1);
    const y = H - P - (d.value / max) * (H - 2 * P);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts.join(" ")} />
      <polygon
        fill="url(#lg)"
        points={`${P},${H - P} ${pts.join(" ")} ${W - P},${H - P}`}
      />
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

function toCSV(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))];
  return lines.join("\n");
}

export default function RecruiterReportsPage() {
  const printRef = useRef<HTMLDivElement>(null);

  // KPIs from existing snapshot
  const kpis = REPORTS.slice(0, 3);

  // Weekly new candidates (12 weeks)
  const weeklyCandidates = useMemo<SeriesPoint[]>(() => {
    const base = CANDIDATE_RECORDS.length;
    return Array.from({ length: 12 }, (_, i) => ({ label: `W${i + 1}`, value: Math.round((base % 30) + (i * 1.7)) }));
  }, []);

  // Monthly job orders (last 8 months)
  const monthlyOrders = useMemo<SeriesPoint[]>(() => {
    const base = JOB_ORDERS.length;
    return Array.from({ length: 8 }, (_, i) => ({ label: `M${i + 1}`, value: Math.round((base % 10) + (i * 0.9) + (i % 3)) }));
  }, []);

  // Pipeline summary
  const pipeline = useMemo<SeriesPoint[]>(() => {
    const active = JOB_ORDERS.filter((j) => j.status !== "filled").length;
    const interview = JOB_ORDERS.filter((j) => j.status === "interview").length;
    const offer = JOB_ORDERS.filter((j) => j.status === "offer").length;
    const filled = JOB_ORDERS.filter((j) => j.status === "filled").length;
    return [
      { label: "Active", value: active },
      { label: "Interviews", value: interview },
      { label: "Offers", value: offer },
      { label: "Hires", value: filled },
    ];
  }, []);

  const downloadCSV = (name: string, rows: Array<Record<string, string | number>>) => {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    // 简化：使用浏览器打印，用户可选择保存为 PDF
    window.print();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <div className="flex items-center gap-2 print:hidden">
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700" onClick={() => downloadCSV("kpis", kpis.map(k => ({ metric: k.label, value: k.value })))}>
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
          <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={printPDF}>
            <Printer className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((k, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.15)]">
              <div className="text-sm text-slate-500">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Line chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">New Candidates (weekly)</h2>
              <p className="text-sm text-slate-500">Last 12 weeks</p>
            </div>
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 print:hidden" onClick={() => downloadCSV("weekly_candidates", weeklyCandidates.map(d => ({ week: d.label, value: d.value })))}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
          <LineChart data={weeklyCandidates} color="#2563eb" />
        </div>

        {/* Bar chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Job Orders (monthly)</h2>
              <p className="text-sm text-slate-500">Last 8 months</p>
            </div>
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 print:hidden" onClick={() => downloadCSV("monthly_job_orders", monthlyOrders.map(d => ({ month: d.label, value: d.value })))}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
          <BarChart data={monthlyOrders} color="#7c3aed" />
        </div>

        {/* Pipeline summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Pipeline Summary</h2>
              <p className="text-sm text-slate-500">Active, interviews, offers, hires</p>
            </div>
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 print:hidden" onClick={() => downloadCSV("pipeline_summary", pipeline.map(d => ({ stage: d.label, value: d.value })))}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
          <BarChart data={pipeline} color="#10b981" />
        </div>
      </div>
    </div>
  );
}
