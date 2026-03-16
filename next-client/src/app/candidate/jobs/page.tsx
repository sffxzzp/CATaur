"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { JOBS, type Job, type JobType, type WorkArrangement } from "@/data/jobs";
import { COUNTRIES, REGIONS, CITIES, type CountryCode } from "@/data/locations";
import { useCandidateAuth, LoginToApplyModal } from "@/components/candidate/guest-gate";
import { request } from "@/lib/request";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Users,
  ChevronDown,
  SlidersHorizontal,
  X,
  ArrowRight,
  DollarSign,
  Loader2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const WORK_ARRANGEMENT_OPTIONS: WorkArrangement[] = ["Remote", "Hybrid", "Onsite"];
const TYPE_OPTIONS: JobType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Permanent",
];
const SORT_OPTIONS = ["Most Recent", "Most Openings"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

/** Map a backend JobOrder object to the frontend Job shape */
function mapApiJob(item: any): Job {
  return {
    slug: item.id, // backend uses 'id', frontend uses 'slug' for routing
    title: item.title || "Untitled",
    company: item.company?.name || "Unknown Company",
    location: item.location || "Location TBD",
    locationMeta: { country: "CA" as const, state: "", city: "" },
    status: item.status === "sourcing" || item.status === "interview" ? "active" : "active",
    type: "Full-time" as JobType,
    workArrangement: "Remote" as WorkArrangement,
    department: "",
    salary: item.salary || undefined,
    openings: item.openings || 1,
    description: item.description || "",
    postedDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently",
  };
}

// ─── Work Arrangement badge style ─────────────────────────────────────────────

function arrangementStyle(arrangement: WorkArrangement): string {
  switch (arrangement) {
    case "Remote":
      return "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]";
    case "Hybrid":
      return "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]";
    case "Onsite":
      return "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]";
  }
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, isGuest, isApplied }: { job: (typeof JOBS)[0]; isGuest: boolean; isApplied: boolean }) {
  const badge = arrangementStyle(job.workArrangement);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F3F4F6] text-sm font-bold text-[#374151] select-none">
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#111827] truncate">{job.title}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Building2 className="h-3 w-3 shrink-0" />
            {job.company}
          </p>
        </div>
        <span
          className={`shrink-0 rounded border px-2.5 py-0.5 text-xs font-medium ${badge}`}
        >
          {job.workArrangement}
        </span>
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6B7280]">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {job.type}
        </span>
        {job.salary && (
          <span className="flex items-center gap-1 font-semibold text-[#1D4ED8]">
            <DollarSign className="h-3 w-3" />
            {job.salary}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {job.openings} {job.openings === 1 ? "opening" : "openings"}
        </span>
      </div>

      {/* Description preview */}
      <p className="mt-3 text-xs leading-relaxed text-[#6B7280] line-clamp-2">
        {job.description
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith("•"))[0]
          ?.replace(/\*\*/g, "") ?? ""}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-3">
        <span className="flex items-center gap-1 text-xs text-[#6B7280]">
          <Clock className="h-3 w-3" />
          Posted {job.postedDate}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/candidate/jobs/${job.slug}`}>
              View Details
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          {isApplied ? (
            <Button variant="outline" size="sm" disabled className="cursor-not-allowed bg-[#F9FAFB] text-[#9CA3AF]">
              Applied
            </Button>
          ) : isGuest ? (
            <Button variant="primary" size="sm" onClick={() => setShowLoginModal(true)}>
              Apply Now
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link href={`/candidate/jobs/${job.slug}`}>Apply Now</Link>
            </Button>
          )}
        </div>
      </div>

      {showLoginModal && (
        <LoginToApplyModal
          jobTitle={job.title}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded border px-3 py-1 text-xs font-medium transition-colors ${active
        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
        : "border-[var(--border)] bg-[var(--surface)] text-[var(--gray-600)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        }`}
    >
      {label}
    </button>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

function SelectField({
  icon: Icon,
  value,
  onChange,
  placeholder,
  children,
  disabled,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`h-9 w-full appearance-none rounded border border-[#D1D5DB] bg-white pr-8 text-sm text-[#111827] transition focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#6B7280] ${Icon ? "pl-9" : "pl-3"
          }`}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobSearchPage() {
  const loggedIn = useCandidateAuth();
  const isGuest = loggedIn !== true;
  const [keyword, setKeyword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | "">("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<JobType[]>([]);
  const [selectedArrangements, setSelectedArrangements] = useState<WorkArrangement[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("Most Recent");

  // API state
  const [apiJobs, setApiJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, applicationsRes] = await Promise.all([
          request("/candidate/jobs?page=1&limit=100"),
          isGuest ? Promise.resolve(null) : request("/candidate/applications?page=1&limit=1000").catch(() => null),
        ]);

        const jobsResult = jobsRes as any;
        if (jobsResult?.data && Array.isArray(jobsResult.data)) {
          setApiJobs(jobsResult.data.map(mapApiJob));
        }

        if (applicationsRes) {
          const appsResult = applicationsRes as any;
          if (appsResult?.data && Array.isArray(appsResult.data)) {
            const ids = new Set<string>(appsResult.data.map((app: any) => app.jobOrderId).filter(Boolean));
            setAppliedJobIds(ids);
          }
        }
      } catch (err: any) {
        console.error("Failed to load jobs", err);
        setError(err?.message || "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isGuest]);

  const handleCountryChange = (v: string) => {
    setSelectedCountry(v as CountryCode | "");
    setSelectedState("");
    setSelectedCity("");
  };
  const handleStateChange = (v: string) => {
    setSelectedState(v);
    setSelectedCity("");
  };

  const toggleType = (t: JobType) =>
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const toggleArrangement = (a: WorkArrangement) =>
    setSelectedArrangements((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const clearAll = () => {
    setKeyword("");
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity("");
    setSelectedTypes([]);
    setSelectedArrangements([]);
  };

  const hasActiveFilters =
    keyword ||
    selectedCountry ||
    selectedState ||
    selectedCity ||
    selectedTypes.length > 0 ||
    selectedArrangements.length > 0;

  const availableStates = selectedCountry ? REGIONS[selectedCountry] : [];
  const availableCities =
    selectedCountry && selectedState
      ? (CITIES[selectedCountry][selectedState] ?? [])
      : [];

  const filteredJobs = useMemo(() => {
    let result = apiJobs.filter((job) => job.status === "active").filter((job) => {
      const kw = keyword.toLowerCase();
      const matchesKeyword =
        !kw || job.title.toLowerCase().includes(kw) || job.company.toLowerCase().includes(kw);
      const matchesCountry = !selectedCountry || job.locationMeta.country === selectedCountry;
      const matchesState = !selectedState || job.locationMeta.state === selectedState;
      const matchesCity =
        !selectedCity || job.locationMeta.city.toLowerCase() === selectedCity.toLowerCase();
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.type);
      const matchesArrangement =
        selectedArrangements.length === 0 || selectedArrangements.includes(job.workArrangement);
      return matchesKeyword && matchesCountry && matchesState && matchesCity && matchesType && matchesArrangement;
    });

    if (sortBy === "Most Openings") {
      result = [...result].sort((a, b) => b.openings - a.openings);
    }
    return result;
  }, [apiJobs, keyword, selectedCountry, selectedState, selectedCity, selectedTypes, selectedArrangements, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1D4ED8]" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isLoading && !error && <>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#111827]">Job Search</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Browse open positions and apply directly.</p>
      </div>

      {/* Search + Location */}
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Job title or company..."
            className="h-9 w-full rounded border border-[#D1D5DB] bg-white pl-9 pr-4 text-sm text-[#111827] placeholder-[#6B7280] transition focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <SelectField icon={MapPin} value={selectedCountry} onChange={handleCountryChange} placeholder="Country">
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </SelectField>

        <SelectField
          value={selectedState}
          onChange={handleStateChange}
          placeholder={selectedCountry ? "Province / State" : "Select country first"}
          disabled={!selectedCountry}
        >
          {availableStates.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </SelectField>

        <SelectField
          value={selectedCity}
          onChange={setSelectedCity}
          placeholder={selectedState ? "City" : "Select province first"}
          disabled={!selectedState}
        >
          {availableCities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </SelectField>
      </div>

      {/* Filter pills */}
      <div className="mb-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs font-medium text-[#6B7280]">Arrangement</span>
          {WORK_ARRANGEMENT_OPTIONS.map((a) => (
            <FilterPill
              key={a}
              label={a}
              active={selectedArrangements.includes(a)}
              onClick={() => toggleArrangement(a)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs font-medium text-[#6B7280]">Job Type</span>
          {TYPE_OPTIONS.map((t) => (
            <FilterPill
              key={t}
              label={t}
              active={selectedTypes.includes(t)}
              onClick={() => toggleType(t)}
            />
          ))}
        </div>
      </div>

      {/* Results bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#374151]">
            <span className="font-semibold text-[#111827]">{filteredJobs.length}</span> of{" "}
            {apiJobs.filter((j) => j.status === "active").length} positions
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 rounded border border-[#E5E7EB] px-2.5 py-1 text-xs text-[#6B7280] transition hover:border-red-300 hover:text-red-500"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280]">Sort:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded border border-[#D1D5DB] bg-white py-1 pl-3 pr-7 text-xs text-[#374151] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#6B7280]" />
          </div>
        </div>
      </div>

      {/* Job list */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.slug} job={job} isGuest={isGuest} isApplied={appliedJobIds.has(job.slug)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] bg-white py-16 text-center">
          <Search className="mb-3 h-8 w-8 text-[#D1D5DB]" />
          <p className="text-sm font-semibold text-[#374151]">No jobs match your filters</p>
          <p className="mt-1 text-xs text-[#6B7280]">Try adjusting your search or clearing filters</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={clearAll}>
            Clear all filters
          </Button>
        </div>
      )}
      </>}
    </div>
  );
}
