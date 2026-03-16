"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Code, Eye, Briefcase, MapPin, Building2, CircleDollarSign, Loader2 } from "lucide-react";
import { companiesClient } from "@/lib/api/companies";
import { jobOrdersClient } from "@/lib/api/jobOrders";
import type { Company } from "@/lib/api/types";
import { LocationSelector } from "@/components/location-selector";
import { toast } from "sonner";

const DRAFT_KEY = "DRAFT_JOB_ORDER";

type JobOrderInput = {
  title: string;
  companyId: string;
  country: string;
  state: string;
  city: string;
  department: string;
  salary: string;
  openings: number | "";
  employmentType: string;
  workArrangement: string;
  description: string;
  priority: string;
};

const defaultForm: JobOrderInput = {
  title: "",
  companyId: "",
  country: "",
  state: "",
  city: "",
  department: "",
  salary: "",
  openings: 1,
  employmentType: "Full-time",
  workArrangement: "Remote",
  description: "## Job Description\n\n- Responsibilities\n- Requirements\n\n",
  priority: "medium",
};

export default function NewJobOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [form, setForm] = useState<JobOrderInput>(defaultForm);
  const [mounted, setMounted] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Ref to prevent aggressive auto-saving while typing rapidly
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load companies
    loadCompanies();

    // Load draft on mount
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setForm({ ...defaultForm, ...parsedDraft });
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    setMounted(true);
  }, []);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companiesClient.list({ page: 1, limit: 100 });
      setCompanies(response.data);
    } catch (error) {
      console.error("Failed to load companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!mounted) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }, 1000); // 1-second debounce
  }, [form, mounted]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !form.title.trim() || !form.companyId) return;
    setSaving(true);

    try {
      await jobOrdersClient.create({
        title: form.title.trim(),
        companyId: form.companyId,
        locationCountry: form.country || undefined,
        locationState: form.state || undefined,
        locationCity: form.city || undefined,
        salary: form.salary.trim() || undefined,
        openings: Number(form.openings) || 1,
        priority: form.priority,
        description: form.description.trim() || undefined,
        employmentType: form.employmentType || undefined,
        workArrangement: form.workArrangement || undefined,
        tags: form.department ? [form.department] : undefined,
      });

      // Clear draft after successful creation
      localStorage.removeItem(DRAFT_KEY);

      // Redirect to list
      router.push("/recruiter/job-orders");
      toast.success("Job order created successfully.");
    } catch (error) {
      console.error("Failed to create job order:", error);
      toast.error("Failed to create job order. Please try again.");
      setSaving(false);
    }
  };

  if (!mounted) return null; // Wait to hydrate

  const inpClass = "h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] transition";
  const labelClass = "text-sm font-semibold text-[var(--gray-800)] block mb-1.5 flex items-center gap-2";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--gray-900)] tracking-tight">Create Job Order</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Fill out the details for the new requisition. Title is required.
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--accent-light)] text-[var(--accent)]">
              Auto-saving draft
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-[var(--shadow-sm)]">
        <form className="grid gap-6 md:grid-cols-2" onSubmit={onSubmit}>

          {/* Title - Required */}
          <div className="md:col-span-2">
            <label className={labelClass}>
              <Briefcase className="w-4 h-4 text-[var(--gray-400)]" />
              Job Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              required
              className={inpClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Senior Full-stack Engineer"
            />
          </div>

          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className={labelClass}>
                <Building2 className="w-4 h-4 text-[var(--gray-400)]" />
                Company <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                required
                className={inpClass}
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                disabled={loadingCompanies}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              {loadingCompanies && (
                <p className="text-xs text-[var(--gray-400)] mt-1">Loading companies...</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                <MapPin className="w-4 h-4 text-[var(--gray-400)]" />
                Location
              </label>
              <LocationSelector
                country={form.country}
                state={form.state}
                city={form.city}
                onCountryChange={(c) => setForm({ ...form, country: c, state: "", city: "" })}
                onStateChange={(s) => setForm({ ...form, state: s, city: "" })}
                onCityChange={(c) => setForm({ ...form, city: c })}
              />
            </div>

            <div>
              <label className={labelClass}>Department</label>
              <input
                className={inpClass}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g., Engineering"
              />
            </div>

            <div>
              <label className={labelClass}>
                <CircleDollarSign className="w-4 h-4 text-[var(--gray-400)]" />
                Salary
              </label>
              <input
                className={inpClass}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="e.g., $120k - $150k"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Priority</label>
              <select
                className={inpClass}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Openings</label>
              <input
                type="number"
                min={1}
                className={inpClass}
                value={form.openings}
                onChange={(e) => setForm({ ...form, openings: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="Number of headcount"
              />
            </div>

            <div>
              <label className={labelClass}>Type</label>
              <select
                className={inpClass}
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
                <option value="Internship">Internship</option>
                <option value="Permanent">Permanent</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Work Arrangement</label>
              <select
                className={inpClass}
                value={form.workArrangement}
                onChange={(e) => setForm({ ...form, workArrangement: e.target.value })}
              >
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Markdown Editor Section */}
          <div className="md:col-span-2 mt-4 space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2 mb-2">
              <label className="text-sm font-semibold text-[var(--gray-800)] flex items-center gap-2">
                Description
              </label>
              <div className="flex gap-1 bg-[var(--gray-50)] p-1 rounded-md border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${activeTab === "edit" ? "bg-[var(--surface)] shadow-sm text-[var(--gray-900)] border border-[var(--border-light)]" : "text-[var(--gray-500)] hover:text-[var(--gray-900)]"
                    }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  Edit Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${activeTab === "preview" ? "bg-[var(--surface)] shadow-sm text-[var(--gray-900)] border border-[var(--border-light)]" : "text-[var(--gray-500)] hover:text-[var(--gray-900)]"
                    }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            </div>

            <div className="rounded-md border border-[var(--border)] overflow-hidden bg-[var(--surface)] transition-all">
              {activeTab === "edit" ? (
                <textarea
                  className="w-full min-h-[400px] resize-y bg-transparent px-4 py-4 text-sm font-mono text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="# Write the full job description here..."
                />
              ) : (
                <div className="w-full min-h-[400px] prose prose-sm prose-blue dark:prose-invert max-w-none px-6 py-4">
                  <ReactMarkdown>{form.description || "*No description provided yet.*"}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="md:col-span-2 mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <Link
              href="/recruiter/job-orders"
              className="px-4 py-2 border border-[var(--border)] rounded-md text-sm font-semibold text-[var(--gray-700)] bg-[var(--surface)] hover:bg-[var(--gray-50)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !form.title.trim() || !form.companyId}
              className="flex items-center gap-2 px-5 py-2 rounded-md font-semibold text-sm bg-[var(--accent)] text-white hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Confirm & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

