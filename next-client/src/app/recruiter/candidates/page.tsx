"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CANDIDATE_RECORDS } from "@/data/recruiter";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Search } from "lucide-react";

type CandidateRow = {
  id: string;
  first: string;
  last: string;
  phone: string;
  city: string;
  state: string;
  skills: string;
  modified: string;
};

const CITIES = [
  ["Toronto", "ON"],
  ["Vancouver", "BC"],
  ["Montreal", "QC"],
  ["Calgary", "AB"],
  ["Ottawa", "ON"],
  ["Edmonton", "AB"],
  ["Waterloo", "ON"],
  ["Victoria", "BC"],
  ["Halifax", "NS"],
  ["Quebec City", "QC"],
  ["Mississauga", "ON"],
  ["Brampton", "ON"],
  ["Markham", "ON"],
  ["Burnaby", "BC"],
  ["Richmond", "BC"],
];

function buildRows(): CandidateRow[] {
  return CANDIDATE_RECORDS.map((c, idx) => {
    const [first, ...rest] = c.name.split(" ");
    const last = rest.join(" ") || "—";
    const digits = (parseInt(c.id.replace(/\D/g, "")) || 1000) + idx;
    const phone = `${Math.floor(200 + (digits % 700))}-${String(200 + (digits % 700)).padStart(3, "0")}-${String(1000 + (digits % 9000)).slice(-4)}`;
    const [city, state] = CITIES[idx % CITIES.length];
    const skills = c.role.includes("Director") ? "Leadership, Strategy" : c.role.includes("Engineer") ? "Python, AWS" : c.role;
    const day = String(((digits % 28) + 1)).padStart(2, "0");
    const month = String(((digits % 12) + 1)).padStart(2, "0");
    const year = String(25);
    const modified = `${month}-${day}-${year}`;
    return { id: c.id, first, last, phone, city, state, skills, modified };
  });
}

export default function RecruiterCandidatesPage() {
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
      rows = rows.filter(
        (r) =>
          r.first.toLowerCase().includes(q) ||
          r.last.toLowerCase().includes(q) ||
          r.skills.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q),
      );
    }
    // onlyMine/onlyHot 为占位示例，将来接真实字段
    return rows;
  }, [allRows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3 text-slate-800">
            <span className="text-base font-semibold">Candidates</span>
            <span className="text-sm text-slate-500">Home</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">
              <Plus className="mr-2 h-4 w-4" /> Add Candidate
            </Button>
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">
              Search Candidates
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
            Only My Candidates
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={onlyHot} onChange={(e) => setOnlyHot(e.target.checked)} />
            Only Hot Candidates
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
                <th className="w-10 px-4 py-3"> </th>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">Cell Phone</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Key Skills</th>
                <th className="px-4 py-3">Modified</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="px-4 py-3"><input type="checkbox" /></td>
                  <td className="px-4 py-3">
                    <Link href={`/recruiter/candidates/${encodeURIComponent(r.id)}/edit`} className="text-slate-500 hover:text-slate-700" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/recruiter/candidates/${encodeURIComponent(r.id)}`} className="font-semibold text-slate-900 hover:underline">{r.first}</Link>
                  </td>
                  <td className="px-4 py-3">{r.last}</td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3">{r.city}</td>
                  <td className="px-4 py-3">{r.state}</td>
                  <td className="px-4 py-3">{r.skills}</td>
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
