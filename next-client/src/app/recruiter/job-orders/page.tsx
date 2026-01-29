"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { jobsClient, type JobOrder } from "@/lib/api";
import { Search, Plus, Copy, FilePlus2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const DEMO_COMPANIES = ["Vectaur", "Northwind Labs", "Globex", "Acme", "Stellar Insights", "OpenCore"];
const CA_LOCATIONS = [
  // ON
  { province: "ON", city: "Toronto" },
  { province: "ON", city: "Ottawa" },
  { province: "ON", city: "Mississauga" },
  { province: "ON", city: "Brampton" },
  { province: "ON", city: "Hamilton" },
  { province: "ON", city: "London" },
  { province: "ON", city: "Kitchener" },
  { province: "ON", city: "Windsor" },
  { province: "ON", city: "Waterloo" },
  // BC
  { province: "BC", city: "Vancouver" },
  { province: "BC", city: "Victoria" },
  { province: "BC", city: "Surrey" },
  { province: "BC", city: "Burnaby" },
  { province: "BC", city: "Richmond" },
  // QC
  { province: "QC", city: "Montreal" },
  { province: "QC", city: "Quebec City" },
  { province: "QC", city: "Laval" },
  { province: "QC", city: "Gatineau" },
  // AB
  { province: "AB", city: "Calgary" },
  { province: "AB", city: "Edmonton" },
  { province: "AB", city: "Red Deer" },
  // MB
  { province: "MB", city: "Winnipeg" },
  // NS
  { province: "NS", city: "Halifax" },
  // SK
  { province: "SK", city: "Saskatoon" },
  { province: "SK", city: "Regina" },
  // NL
  { province: "NL", city: "St. John's" },
  // NB
  { province: "NB", city: "Moncton" },
  { province: "NB", city: "Saint John" },
  { province: "NB", city: "Fredericton" },
  // PE
  { province: "PE", city: "Charlottetown" },
  // NT
  { province: "NT", city: "Yellowknife" },
  // YT
  { province: "YT", city: "Whitehorse" },
  // NU
  { province: "NU", city: "Iqaluit" },
];
const DEMO_JOBS: JobOrder[] = [
  {
    id: 9001,
    recruiter_id: 1,
    title: "Backend Engineer",
    company: "Vectaur",
    description: "Build APIs and integrations",
    location: "Remote",
    salary_min: "120000",
    salary_max: "160000",
    status: "open",
    created_at: new Date().toISOString(),
  },
  {
    id: 9002,
    recruiter_id: 1,
    title: "Data Analyst",
    company: "Globex",
    description: "Own dashboards and reporting",
    location: "Toronto",
    salary_min: "80000",
    salary_max: "110000",
    status: "draft",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 9003,
    recruiter_id: 1,
    title: "Product Manager",
    company: "Northwind Labs",
    description: "Ship outcomes with eng/design",
    location: "SF Bay Area",
    salary_min: null,
    salary_max: null,
    status: "closed",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

type FormState = {
  title: string;
  company: string;
  province: string;
  city: string;
  street: string;
  description: string;
  salaryMin: string;
  salaryMax: string;
  status: string;
  remote: boolean;
};

export default function RecruiterJobOrdersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "open" | "closed">("all");
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"empty" | "copy">("empty");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    company: DEMO_COMPANIES[0],
    province: CA_LOCATIONS[0].province,
    city: CA_LOCATIONS[0].city,
    street: "",
    description: "",
    salaryMin: "",
    salaryMax: "",
    status: "open",
    remote: false,
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await jobsClient.listAll();
        setJobs(res.jobs);
        setAuthError(false);
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.toLowerCase().includes("not authenticated")) {
          setAuthError(true);
          setJobs(DEMO_JOBS);
        } else {
          setError(msg || "Failed to load job orders");
          setJobs(DEMO_JOBS);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let items = [...jobs];
    if (statusFilter !== "all") {
      items = items.filter((j) => j.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((j) => j.title.toLowerCase().includes(q) || (j.location || "").toLowerCase().includes(q));
    }
    return items;
  }, [jobs, statusFilter, query]);

  const resetForm = () => {
    setForm({
      title: "",
      company: DEMO_COMPANIES[0],
      province: CA_LOCATIONS[0].province,
      city: CA_LOCATIONS[0].city,
      street: "",
      description: "",
      salaryMin: "",
      salaryMax: "",
      status: "open",
      remote: false,
    });
    setSelectedId(null);
  };

  const handleOpenCreate = (mode: "empty" | "copy") => {
    setCreateMode(mode);
    if (mode === "empty") resetForm();
    setShowCreate(true);
  };

  const handlePrefillFromCopy = (id: number) => {
    setSelectedId(id);
    const src = jobs.find((j) => j.id === id);
    if (src) {
      const [cityPart = CA_LOCATIONS[0].city, provincePart = CA_LOCATIONS[0].province] = (src.location || "").split(",").map((s) => s.trim());
      setForm({
        title: `${src.title}`,
        company: src.company || DEMO_COMPANIES[0],
        province: provincePart || CA_LOCATIONS[0].province,
        city: cityPart || CA_LOCATIONS[0].city,
        street: "",
        description: src.description || "",
        salaryMin: src.salary_min || "",
        salaryMax: src.salary_max || "",
        status: "open",
        remote: src.location?.toLowerCase().includes("remote") || false,
      });
    }
  };

  const buildLocation = () => {
    if (form.remote) return "Remote";
    const cityProv = `${form.city}, ${form.province}`;
    return form.street.trim() ? `${cityProv} · ${form.street.trim()}` : cityProv;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let created;
      const payload = {
        title: form.title.trim(),
        company: form.company,
        location: buildLocation(),
        description: form.description.trim(),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        status: form.status,
      };
      if (createMode === "copy" && selectedId) {
        created = await jobsClient.copy({ sourceId: selectedId, ...payload });
      } else {
        created = await jobsClient.create(payload);
      }
      setJobs((prev) => [created.job, ...prev]);
      toast.push({ tone: "success", title: "Job order created", description: "The job order has been saved." });
      setShowCreate(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to create job order";
      setError(msg);
      toast.push({ tone: "error", title: "Create failed", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "open") return "bg-emerald-100 text-emerald-700";
    if (status === "closed") return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3 text-slate-800">
            <span className="text-base font-semibold">Job Orders</span>
            <span className="text-sm text-slate-500">Home</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700" onClick={() => handleOpenCreate("empty")}>
              <Plus className="mr-2 h-4 w-4" /> Add Job Order
            </Button>
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700" onClick={() => handleOpenCreate("copy")}>
              <Copy className="mr-2 h-4 w-4" /> Copy Existing
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Quick search..."
              className="h-9 rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <select
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-[13px] font-medium text-slate-600">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" /></th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3 whitespace-nowrap">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id} className="border-t border-slate-200">
                  <td className="px-4 py-3"><input type="checkbox" /></td>
                  <td className="px-4 py-3">
                    <Link href={`/recruiter/job-orders/${j.id}`} className="font-semibold text-slate-900 hover:underline">
                      {j.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{j.company || "–"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize", statusColor(j.status))}>{j.status}</span>
                  </td>
                  <td className="px-4 py-3">{j.location || "–"}</td>
                  <td className="px-4 py-3">
                    {j.salary_min || j.salary_max ? `${j.salary_min || "?"} - ${j.salary_max || "?"}` : "–"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(j.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <p className="px-5 py-3 text-sm text-slate-500">Loading job orders...</p>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Add job order</p>
                <h3 className="text-lg font-semibold text-slate-900">Choose how you want to start</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 px-5 py-5 md:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition hover:border-primary/30">
                  <input
                    type="radio"
                    name="create-mode"
                    checked={createMode === "empty"}
                    onChange={() => handleOpenCreate("empty")}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Empty job order</p>
                    <p className="text-xs text-slate-600">Start fresh with a blank form.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition hover:border-primary/30">
                  <input
                    type="radio"
                    name="create-mode"
                    checked={createMode === "copy"}
                    onChange={() => handleOpenCreate("copy")}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="w-full">
                    <p className="text-sm font-semibold text-slate-900">Copy existing</p>
                    <p className="text-xs text-slate-600">Clone details from a previous job order.</p>
                    {createMode === "copy" && (
                      <select
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-primary/20"
                        value={selectedId ?? ""}
                        onChange={(e) => handlePrefillFromCopy(Number(e.target.value))}
                      >
                        <option value="" disabled>
                          Select a job order to copy
                        </option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              </div>

              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">Title</label>
                    <input
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Backend Engineer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">Company</label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    >
                      {DEMO_COMPANIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">Status</label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="draft">Draft</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">Province</label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm"
                      value={form.province}
                      onChange={(e) => {
                        const province = e.target.value;
                        const firstCity = CA_LOCATIONS.find((p) => p.province === province)?.city || "";
                        setForm({ ...form, province, city: firstCity });
                      }}
                      disabled={form.remote}
                    >
                      {Array.from(new Set(CA_LOCATIONS.map((p) => p.province))).map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">City</label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      disabled={form.remote}
                    >
                      {CA_LOCATIONS.filter((p) => p.province === form.province).map((p) => (
                        <option key={`${p.province}-${p.city}`} value={p.city}>
                          {p.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">Street / detail</label>
                    <input
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      placeholder="Suite, street"
                      disabled={form.remote}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">Location preview</label>
                    <input
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm bg-slate-50"
                      value={buildLocation()}
                      readOnly
                    />
                    <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={form.remote}
                        onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                      />
                      Remote role (no address required)
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">Salary range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                        value={form.salaryMin}
                        onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                        placeholder="Min"
                        type="number"
                        min={0}
                      />
                      <input
                        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                        value={form.salaryMax}
                        onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                        placeholder="Max"
                        type="number"
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">Description</label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Role overview, requirements, notes..."
                  />
                </div>

                {error && <p className="text-sm text-rose-500">{error}</p>}

                <div className="flex items-center justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || (createMode === "copy" && !selectedId)} className={cn(saving && "cursor-wait opacity-80")}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Create job order
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
