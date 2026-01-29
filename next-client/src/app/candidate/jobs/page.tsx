"use client";

import { Button } from "@/components/ui/button";
import { JOBS, type Job } from "@/data/jobs";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Filter,
  MapPin,
  Search,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

type SalaryFilter = "all" | "120" | "150";

const salaryFilters: { label: string; value: SalaryFilter; threshold?: number }[] = [
  { label: "Any compensation", value: "all" },
  { label: "120k+", value: "120", threshold: 120000 },
  { label: "150k+", value: "150", threshold: 150000 },
];

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [workTypeFilter, setWorkTypeFilter] = useState<Set<Job["workType"]>>(new Set());
  const [salaryFilter, setSalaryFilter] = useState<SalaryFilter>("all");

  const totalOpenings = JOBS.length;
  const locations = useMemo(
    () => ["all", ...new Set(JOBS.map((job) => job.location))],
    [],
  );
  const allTags = useMemo(
    () => Array.from(new Set(JOBS.flatMap((job) => job.tags))).sort(),
    [],
  );

  const filteredJobs = useMemo(() => {
    return JOBS.filter((job) => {
      const matchesSearch = searchTerm.trim().length
        ? [job.title, job.company, job.location, job.tags.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true;

      const matchesRole =
        selectedRoles.size === 0 || selectedRoles.has(job.slug);

      const matchesTags =
        selectedTags.size === 0 || job.tags.some((tag) => selectedTags.has(tag));

      const matchesLocation =
        locationFilter === "all" || job.location === locationFilter;

      const matchesWorkType =
        workTypeFilter.size === 0 || workTypeFilter.has(job.workType);

      const salaryOption = salaryFilters.find((option) => option.value === salaryFilter);
      const matchesSalary =
        !salaryOption?.threshold || job.salaryMin >= salaryOption.threshold;

      return (
        matchesSearch &&
        matchesRole &&
        matchesTags &&
        matchesLocation &&
        matchesWorkType &&
        matchesSalary
      );
    });
  }, [
    searchTerm,
    selectedRoles,
    selectedTags,
    locationFilter,
    workTypeFilter,
    salaryFilter,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRoles(new Set());
    setSelectedTags(new Set());
    setLocationFilter("all");
    setWorkTypeFilter(new Set());
    setSalaryFilter("all");
  };

  return (
    <div className="px-6 pb-24 pt-14">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="space-y-6 rounded-[36px] border border-border bg-white/90 px-8 py-10 shadow-[0_40px_90px_-70px_rgba(12,24,55,0.75)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
                <Filter className="h-4 w-4" />
                Internal job board
              </span>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                {filteredJobs.length} of {totalOpenings} openings match your filters.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted">
                Multi-select the openings you want to evaluate, then refine by work style, location, and compensation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="border border-border px-5"
                onClick={clearFilters}
              >
                Reset filters
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex items-center gap-3 rounded-full border border-border bg-white px-5 py-3">
              <Search className="h-5 w-5 text-primary" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted border-0 focus:ring-0"
                placeholder="Search role, company, or keyword"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-2">
                Selected roles: {selectedRoles.size || "All"}
              </span>
              <span className="rounded-full border border-border px-3 py-2">
                Tags: {selectedTags.size || "Any"}
              </span>
              <span className="rounded-full border border-border px-3 py-2">
                Work style: {workTypeFilter.size ? Array.from(workTypeFilter).join(", ") : "All"}
              </span>
              {/* Removed salary chip since Compensation filter is hidden */}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-6">
            <FilterSection title="Select roles" icon={<Target className="h-4 w-4" />}>
              <div className="space-y-2">
                {JOBS.map((job) => {
                  const isChecked = selectedRoles.has(job.slug);
                  return (
                    <label
                      key={job.slug}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                        isChecked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 bg-white text-muted hover:border-primary/50",
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="font-medium text-foreground">{job.title}</span>
                        <span className="text-xs text-muted-foreground">{job.company}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedRoles((prev) => {
                            const next = new Set(prev);
                            if (next.has(job.slug)) {
                              next.delete(job.slug);
                            } else {
                              next.add(job.slug);
                            }
                            return next;
                          });
                        }}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection title="Tags" icon={<Users className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isActive = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedTags((prev) => {
                          const next = new Set(prev);
                          if (next.has(tag)) {
                            next.delete(tag);
                          } else {
                            next.add(tag);
                          }
                          return next;
                        })
                      }
                      className={cn(
                        "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection title="Location" icon={<MapPin className="h-4 w-4" />}>
              <div className="space-y-2">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocationFilter(loc)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-2 text-left text-sm transition",
                      locationFilter === loc
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-white text-muted hover:border-primary/40",
                    )}
                  >
                    {loc === "all" ? "Any location" : loc}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Work style" icon={<Users className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {["remote", "hybrid", "onsite"].map((type) => {
                  const typed = type as Job["workType"];
                  const isActive = workTypeFilter.has(typed);
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        setWorkTypeFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has(typed)) {
                            next.delete(typed);
                          } else {
                            next.add(typed);
                          }
                          return next;
                        })
                      }
                    className={cn(
                        "rounded-full border px-4 py-2 text-xs font-medium transition",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      {typed}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            {/* Compensation filter removed as requested */}
          </aside>

          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <article
                key={job.slug}
                className="rounded-[30px] border border-border bg-white/95 p-6 shadow-[0_30px_90px_-70px_rgba(12,24,55,0.7)] transition hover:-translate-y-1"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground">{job.title}</h2>
                    <p className="text-sm font-medium text-primary">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                        <Wallet className="h-4 w-4 text-primary" />
                        {job.salaryRange}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 capitalize">
                        {job.workType}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{job.summary}</p>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 md:w-40 md:items-end">
                    <Button size="sm" className="px-5 w-full whitespace-nowrap" asChild>
                      <Link href={`/candidate/jobs/${job.slug}`}>View details</Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  {job.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-4 py-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}

            {filteredJobs.length === 0 && (
              <div className="rounded-[30px] border border-dashed border-border bg-white/90 p-10 text-center text-sm text-muted-foreground">
                No roles match the current filters. Adjust selections or reset to view all openings.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-white/90 p-6">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
