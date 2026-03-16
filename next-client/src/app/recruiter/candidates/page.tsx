"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { jobOrdersClient } from "@/lib/api/jobOrders";
import { recruiterCandidatesClient, type ImportCandidateInput } from "@/lib/api/recruiter-candidates";
import type { Application, JobOrder } from "@/lib/api/types";
import { LocationSelector, formatLocation } from "@/components/location-selector";
import {
  Search,
  MapPin,
  X,
  Users,
  Briefcase,
  Plus,
  Upload,
  FileUp,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Phone,
  UserCheck,
  Import,
} from "lucide-react";

type CandidateSource = Application["source"];

/* ─── Source Badge ───────────────────────────────────────────────────────── */
function SourceBadge({ source }: { source?: CandidateSource }) {
  if (source === "recruiter_import") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-blue-bg)] text-[var(--status-blue-text)] px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
        <Import className="h-3 w-3 shrink-0" />
        Imported
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-green-bg)] text-[var(--status-green-text)] px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
      <UserCheck className="h-3 w-3 shrink-0" />
      Applied
    </span>
  );
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function formatShortDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Add Candidate Modal ──────────────────────────────────────────────── */
function AddCandidateModal({ activeJobs, onAdd, onClose }: {
  activeJobs: { id: string; title: string }[];
  onAdd: (payload: { jobOrderId: string; candidates: ImportCandidateInput[] }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", jobId: activeJobs[0]?.id ?? "" });
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const inp = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";
  const lbl = "text-xs font-medium text-[var(--gray-500)]";
  const valid = form.name.trim() && form.email.trim() && form.phone.trim() && form.jobId;

  useEffect(() => {
    if (!form.jobId && activeJobs[0]?.id) {
      setForm((f) => ({ ...f, jobId: activeJobs[0]!.id }));
    }
  }, [activeJobs, form.jobId]);

  const handleSubmit = () => {
    if (!valid) return;
    onAdd({
      jobOrderId: form.jobId,
      candidates: [
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          locationCountry: country || undefined,
          locationState: state || undefined,
          locationCity: city || undefined,
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">Add New Candidate</h3>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">Manually add a candidate to the talent pool</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className={lbl}>Full Name *</label>
              <input autoFocus type="text" className={inp} placeholder="e.g. Jane Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Email *</label>
              <input type="email" className={inp} placeholder="jane@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Phone *</label>
              <input type="tel" className={inp} placeholder="416-555-0100" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Assign to Job Order *</label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
              <select className={`${inp} pl-9`} value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}>
                {activeJobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.id})</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Location</label>
            <LocationSelector
              country={country}
              state={state}
              city={city}
              onCountryChange={setCountry}
              onStateChange={setState}
              onCityChange={setCity}
            />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Resume (PDF)</label>
            <label className="flex items-center gap-2 rounded-md border border-dashed border-[var(--gray-300)] px-3 py-3 text-sm text-[var(--gray-500)] cursor-pointer hover:border-[var(--gray-400)] hover:bg-[var(--gray-50)] transition">
              <FileUp className="h-4 w-4 text-[var(--gray-400)]" />
              {resume ? resume.name : "Click to upload resume…"}
              <input type="file" accept=".pdf" className="hidden" onChange={e => setResume(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
          <button onClick={handleSubmit} disabled={!valid}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium text-white transition ${valid ? "bg-[var(--accent)] cursor-pointer hover:bg-[var(--accent-hover)]" : "bg-[var(--gray-300)] cursor-not-allowed"}`}>Add Candidate</button>
        </div>
      </div>
    </div>
  );
}

/* ─── CSV Import Modal ─────────────────────────────────────────────────── */
type CSVRow = { name: string; email: string; phone: string; locationCountry: string; locationState: string; locationCity: string };

function ImportCSVModal({ activeJobs, onImport, onClose }: {
  activeJobs: { id: string; title: string }[];
  onImport: (payload: { jobOrderId: string; candidates: ImportCandidateInput[] }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [jobId, setJobId] = useState(activeJobs[0]?.id ?? "");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobId && activeJobs[0]?.id) {
      setJobId(activeJobs[0]!.id);
    }
  }, [activeJobs, jobId]);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n").map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
    if (lines.length < 2) return;
    const header = lines[0].map(h => h.toLowerCase());
    const ni = header.findIndex(h => h.includes("name"));
    const ei = header.findIndex(h => h.includes("email"));
    const pi = header.findIndex(h => h.includes("phone"));
    const ci = header.findIndex(h => h.includes("country"));
    const si = header.findIndex(h => h.includes("state") || h.includes("province"));
    const cti = header.findIndex(h => h.includes("city"));
    const parsed: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i];
      if (!c[ni]?.trim()) continue;
      parsed.push({
        name: c[ni] ?? "",
        email: c[ei] ?? "",
        phone: c[pi] ?? "",
        locationCountry: c[ci] ?? "",
        locationState: c[si] ?? "",
        locationCity: c[cti] ?? "",
      });
    }
    setRows(parsed);
    if (parsed.length > 0) setStep("preview");
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => parseCSV(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  const handleConfirm = () => {
    const candidates: ImportCandidateInput[] = rows.map((r) => ({
      name: r.name,
      email: r.email,
      phone: r.phone || undefined,
      locationCountry: r.locationCountry || undefined,
      locationState: r.locationState || undefined,
      locationCity: r.locationCity || undefined,
    }));
    onImport({ jobOrderId: jobId, candidates });
    setStep("done");
  };

  const inp = "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-modal)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">Import Candidates from CSV</h3>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              {step === "upload" && "Upload a CSV file with candidate data"}
              {step === "preview" && `${rows.length} candidates found in ${fileName}`}
              {step === "done" && "Import completed successfully!"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] transition"><X className="h-4 w-4" /></button>
        </div>

        {step === "upload" && (
          <div className="px-5 py-8">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-14 cursor-pointer transition-colors ${dragOver ? "border-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--gray-300)] bg-[var(--gray-50)] hover:border-[var(--gray-400)]"}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--gray-100)]">
                <Upload className="h-5 w-5 text-[var(--gray-400)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--gray-700)]">Drag &amp; drop your CSV file here</p>
                <p className="text-xs text-[var(--gray-400)] mt-1">or click to browse</p>
              </div>
              <p className="text-[11px] text-[var(--gray-400)]">Expected columns: Name, Email, Phone, Country, State/Province, City</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="px-5 py-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--gray-500)]">Assign all to Job Order *</label>
              <div className="relative max-w-sm">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
                <select className={`${inp} pl-9`} value={jobId} onChange={e => setJobId(e.target.value)}>
                  {activeJobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.id})</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-[var(--border)]">
              <div className="hidden sm:grid grid-cols-[2fr_2fr_1.5fr_1.5fr] border-b border-[var(--border)] bg-[var(--gray-50)] px-4 py-2">
                {["Name", "Email", "Phone", "Location"].map(h => (
                  <span key={h} className="text-[11px] font-medium uppercase tracking-wider text-[var(--gray-400)]">{h}</span>
                ))}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {rows.slice(0, 50).map((r, i) => (
                  <div key={i} className="flex flex-col sm:grid sm:grid-cols-[2fr_2fr_1.5fr_1.5fr] border-b border-[var(--border-light)] px-4 py-2 last:border-0">
                    <span className="text-sm text-[var(--gray-700)] font-medium truncate">{r.name}</span>
                    <span className="text-sm text-[var(--gray-500)] truncate">{r.email}</span>
                    <span className="text-sm text-[var(--gray-500)] truncate">{r.phone}</span>
                    <span className="text-sm text-[var(--gray-500)] truncate">{formatLocation(r.locationCity, r.locationState)}</span>
                  </div>
                ))}
              </div>
              {rows.length > 50 && (
                <div className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--gray-400)] text-center">
                  … and {rows.length - 50} more
                </div>
              )}
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-green-bg)]">
              <CheckCircle2 className="h-6 w-6 text-[var(--status-green-text)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--gray-900)]">{rows.length} candidates imported!</p>
            <p className="text-sm text-[var(--gray-500)]">Added to talent pool · Assigned to <span className="font-medium text-[var(--gray-700)]">{activeJobs.find(j => j.id === jobId)?.title}</span></p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          {step === "upload" && (
            <button onClick={onClose} className="rounded-md border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Cancel</button>
          )}
          {step === "preview" && (<>
            <button onClick={() => { setStep("upload"); setRows([]); }} className="rounded-md border border-[var(--border)] px-3.5 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition">Back</button>
            <button onClick={handleConfirm} className="rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">
              Import {rows.length} Candidates
            </button>
          </>)}
          {step === "done" && (
            <button onClick={onClose} className="rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition">Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function RecruiterCandidatesPage() {
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);

  const loadJobOrders = async () => {
    try {
      const response = await jobOrdersClient.list({ page: 1, limit: 100 });
      setJobOrders(response.data.filter(j => j.status !== "filled" && j.status !== "paused"));
    } catch (err) {
      console.error("Failed to load job orders:", err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const resp = await recruiterCandidatesClient.list({
        page: currentPage,
        limit: pageSize,
        search: query.trim() ? query.trim() : undefined,
        location: locationFilter !== "all" ? locationFilter : undefined,
      });
      setCandidates(resp.data);
      setTotal(resp.total);
    } catch (err) {
      console.error("Failed to load candidates:", err);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobOrders();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, query, locationFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, locationFilter]);

  const activeJobs = useMemo(
    () => jobOrders.filter(j => j.status !== "filled" && j.status !== "paused"),
    [jobOrders],
  );

  const locations = useMemo(() => {
    const locs = [...new Set(
      candidates
        .map(c => formatLocation(c.locationCity || null, c.locationState || null))
        .filter((l): l is string => typeof l === "string" && Boolean(l.trim()) && l !== "—"),
    )].sort();
    return locs;
  }, [candidates]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, total);

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  const handleImport = async (payload: { jobOrderId: string; candidates: ImportCandidateInput[] }) => {
    try {
      await recruiterCandidatesClient.bulkImport(payload);
      toast.success(`Imported ${payload.candidates.length} candidate${payload.candidates.length === 1 ? "" : "s"}`);
      setShowAddModal(false);
      setShowImportModal(false);
      setCurrentPage(1);
      loadData();
    } catch (err) {
      console.error("Import failed:", err);
      toast.error("Import failed");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--gray-900)]">Candidates</h2>
          <p className="mt-0.5 text-sm text-[var(--gray-500)]">Your talent pool — {total} candidates total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--gray-600)] cursor-pointer hover:bg-[var(--gray-50)] transition"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition"
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
          <input
            type="text" placeholder="Search by name, email or role…" value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
          />
        </div>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
          <select
            value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-8 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] cursor-pointer"
          >
            <option value="all">All Locations</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-400)]" />
        </div>
        {locationFilter !== "all" && (
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] px-2.5 py-1 text-xs font-medium">
            <MapPin className="h-3 w-3" />
            {locationFilter}
            <button onClick={() => setLocationFilter("all")} className="ml-0.5 hover:opacity-70"><X className="h-3 w-3" /></button>
          </div>
        )}
        <p className="ml-auto text-sm text-[var(--gray-400)] hidden sm:block">
          Showing <span className="font-medium text-[var(--gray-600)]">{candidates.length}</span> of{" "}
          <span className="font-medium text-[var(--gray-600)]">{total}</span>
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Desktop header — 7 cols: Name | Role | Email | Location | Phone | Added | Source */}
        <div className="hidden xl:grid grid-cols-[2fr_1.5fr_2fr_1.3fr_1.2fr_1fr_1.1fr] items-center border-b border-[var(--border)] px-5 py-2.5 bg-[var(--gray-50)]">
          {["Candidate", "Role", "Email", "Location", "Phone", "Added", "Source"].map((h) => (
            <span key={h} className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">{h}</span>
          ))}
        </div>
        {/* Tablet header — 5 cols without Phone */}
        <div className="hidden lg:grid xl:hidden grid-cols-[2fr_1.5fr_2fr_1.3fr_1.1fr] items-center border-b border-[var(--border)] px-5 py-2.5 bg-[var(--gray-50)]">
          {["Candidate", "Role", "Email", "Added", "Source"].map((h) => (
            <span key={h} className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-[var(--gray-400)]">
            <Users className="h-7 w-7" />
            <p className="text-sm">Loading candidates…</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-[var(--gray-400)]">
            <Users className="h-7 w-7" />
            <p className="text-sm">No candidates match your search.</p>
          </div>
        ) : (
          candidates.map((c) => {
            const name = c.candidate?.nickname || c.candidate?.email || "Candidate";
            const email = c.candidate?.email || "—";
            const role = c.jobOrder?.title || "—";
            const loc = formatLocation(c.locationCity, c.locationState);
            const phone = c.candidate?.phone || "—";
            const added = formatShortDate(c.createdAt as any);
            return (
            <Link href={`/recruiter/candidates/${c.id}`} key={c.id}
              className="flex flex-col xl:grid xl:grid-cols-[2fr_1.5fr_2fr_1.3fr_1.2fr_1fr_1.1fr] xl:items-center gap-2 xl:gap-3 border-b border-[var(--border-light)] px-5 py-3 last:border-0 hover:bg-[var(--gray-50)] transition-colors cursor-pointer">

              {/* Name only (no ID) */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-xs font-semibold text-[var(--accent)]">
                  {initials(name)}
                </div>
                <p className="text-sm font-medium text-[var(--gray-900)] truncate">{name}</p>
              </div>

              {/* Role */}
              <p className="text-sm text-[var(--gray-700)] truncate">{role}</p>

              {/* Email */}
              <div className="flex items-center gap-1 text-sm text-[var(--gray-500)] min-w-0">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--gray-400)] xl:hidden" />
                <span className="truncate">{email}</span>
              </div>

              {/* Location — hidden on tablet compact view */}
              <div className="hidden xl:flex items-center gap-1 text-sm text-[var(--gray-500)] min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--gray-400)]" />
                <span className="truncate">{loc}</span>
              </div>

              {/* Phone — xl only */}
              <div className="hidden xl:flex items-center gap-1 text-sm text-[var(--gray-500)]">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--gray-400)]" />
                <span>{phone}</span>
              </div>

              {/* Added (createdAt = appliedAt) */}
              <span className="text-sm text-[var(--gray-500)]">{added}</span>

              {/* Source */}
              <SourceBadge source={c.source} />
            </Link>
          );
          })
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--border)] px-5 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--gray-500)]">
              <span>Rows</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="h-7 appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 pr-6 text-xs font-medium text-[var(--gray-600)] cursor-pointer">
                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span><span className="font-medium text-[var(--gray-700)]">{startIdx}–{endIdx}</span> of <span className="font-medium text-[var(--gray-700)]">{total}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={safePage === 1}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-[var(--gray-400)]">…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-md text-xs font-medium transition ${p === safePage ? "bg-[var(--accent)] text-white" : "text-[var(--gray-500)] cursor-pointer hover:bg-[var(--gray-100)]"}`}>{p}</button>
                )
              )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--gray-400)] cursor-pointer hover:bg-[var(--gray-100)] disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddCandidateModal
          activeJobs={activeJobs.map(j => ({ id: j.id, title: j.title }))}
          onAdd={handleImport}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showImportModal && (
        <ImportCSVModal
          activeJobs={activeJobs.map(j => ({ id: j.id, title: j.title }))}
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}
