"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CLIENTS, JOB_ORDERS } from "@/data/recruiter";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Search } from "lucide-react";

type Row = {
  name: string;
  jobs: number;
  city: string;
  state: string;
  phone: string;
  owner: string;
  created: string;
  modified: string;
};

const CITIES: Array<[string, string]> = [
  ["Toronto", "ON"],
  ["Vancouver", "BC"],
  ["Calgary", "AB"],
  ["Montreal", "QC"],
  ["Ottawa", "ON"],
  ["Waterloo", "ON"],
  ["Victoria", "BC"],
  ["Edmonton", "AB"],
];

function buildRows(): Row[] {
  return CLIENTS.map((c, idx) => {
    const [city, state] = CITIES[idx % CITIES.length];
    const jobs = JOB_ORDERS.filter((j) => j.client === c.company).length || c.openRoles;
    const phone = `256-${String(200 + idx).padStart(3, "0")}-${String(8000 + idx).slice(-4)}`;
    const created = `05-${String(12 + (idx % 10)).padStart(2, "0")}-25`;
    const modified = created;
    return { name: c.company, jobs, city, state, phone, owner: "Allan J.", created, modified };
  });
}

export default function RecruiterClientsPage() {
  const allRows = useMemo(() => buildRows(), []);
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyHot, setOnlyHot] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = allRows.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q));
    }
    // onlyMine/onlyHot 为占位，后续可接真实字段
    return rows;
  }, [allRows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3 text-slate-800">
            <span className="text-base font-semibold">Companies</span>
            <span className="text-sm text-slate-500">Home</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">
              <Building2 className="mr-2 h-4 w-4" /> Add Company
            </Button>
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">
              <Plus className="mr-2 h-4 w-4" /> Go To My Company
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Quick search..."
              className="h-9 rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <label className="ml-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
            Only My Companies
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={onlyHot} onChange={(e) => setOnlyHot(e.target.checked)} />
            Only Hot Companies
          </label>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Rows Per Page</span>
            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-slate-800"
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-[13px] font-medium text-slate-600">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" /></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Jobs</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Modified</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.name} className="border-t border-slate-200">
                  <td className="px-4 py-3"><input type="checkbox" /></td>
                  <td className="px-4 py-3">
                    <Link href={`/recruiter/clients/${encodeURIComponent(r.name)}`} className="font-semibold text-slate-900 hover:underline">{r.name}</Link>
                  </td>
                  <td className="px-4 py-3">{r.jobs}</td>
                  <td className="px-4 py-3">{r.city}</td>
                  <td className="px-4 py-3">{r.state}</td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3">{r.owner}</td>
                  <td className="px-4 py-3">{r.created}</td>
                  <td className="px-4 py-3">{r.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 text-sm text-slate-600">
          <div>
            Page {page} of {totalPages} — {filtered.length} total
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="border-slate-300 text-slate-700">Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="border-slate-300 text-slate-700">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
