"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { companiesClient } from "@/lib/api/companies";
import { jobOrdersClient } from "@/lib/api/jobOrders";
import { usersClient } from "@/lib/api/users";
import type { Company, JobOrder, User } from "@/lib/api/types";
import { ArrowLeft, Phone, Mail, MapPin, Globe, Users, Code2, Briefcase, ChevronRight, X } from "lucide-react";
import { LocationSelector, formatLocation } from "@/components/location-selector";
import { toast } from "sonner";

export default function ClientDetails({ params }: { params: Promise<{ id: string }> }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [clientUser, setClientUser] = useState<User | null>(null);
  const [clientUsers, setClientUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "", contact: "", email: "", phone: "", website: "",
    country: "", state: "", city: "", keyTechnologies: "", clientAccount: "",
  });

  useEffect(() => {
    params.then(p => setCompanyId(p.id));
  }, [params]);

  useEffect(() => {
    if (!companyId) return;

    const loadData = async () => {
      try {
        const companyData = await companiesClient.getById(companyId);
        setCompany(companyData);

        const usersRes = await usersClient.listByRole("Client", { page: 1, limit: 100 });
        setClientUsers(usersRes.data);

        if (companyData.clientId) {
          const user = usersRes.data.find(u => u.id === companyData.clientId);
          if (user) setClientUser(user);
        }

        const jobsRes = await jobOrdersClient.list({ companyId: companyId, limit: 100 });
        setJobs(jobsRes.data);
      } catch (error) {
        console.error("Failed to load company details:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId]);

  const handleOpenEdit = () => {
    if (!company) return;
    setFormData({
      name: company.name,
      contact: company.contact || "",
      email: company.email,
      phone: company.phone || "",
      website: company.website || "",
      country: company.locationCountry || "",
      state: company.locationState || "",
      city: company.locationCity || "",
      keyTechnologies: company.keyTechnologies || "",
      clientAccount: company.clientId || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!company || !formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }
    setSubmitting(true);
    try {
      await companiesClient.update(company.id, {
        name: formData.name,
        email: formData.email,
        contact: formData.contact || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        locationCountry: formData.country || undefined,
        locationState: formData.state || undefined,
        locationCity: formData.city || undefined,
        keyTechnologies: formData.keyTechnologies || undefined,
        clientAccountId: formData.clientAccount || undefined,
      });

      // Reload company data
      const updated = await companiesClient.getById(company.id);
      setCompany(updated);
      if (updated.clientId) {
        const user = clientUsers.find(u => u.id === updated.clientId);
        setClientUser(user || null);
      } else {
        setClientUser(null);
      }
      setIsModalOpen(false);
      toast.success("Company updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--gray-300)] border-t-[var(--accent)]"></div>
      </div>
    );
  }

  if (!company) {
    return notFound();
  }

  const labelStyle = "text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)]";

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb / Top actions */}
      <div className="flex items-center justify-between">
        <Link href="/recruiter/clients" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gray-500)] hover:text-[var(--gray-900)] transition-colors cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOpenEdit}
            className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer"
          >
            Edit Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Column (Main Info) */}
        <div className="space-y-6">
          {/* Header Card */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--gray-100)] text-xl font-bold text-[var(--gray-700)] shadow-sm">
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--gray-900)]">{company.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--gray-600)]">
                  {formatLocation(company.locationCity, company.locationState) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--gray-400)]" /> {formatLocation(company.locationCity, company.locationState)}
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[var(--gray-400)]" />
                      <a href={company.website} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[var(--border-light)]">
              <div>
                <span className={labelStyle}>Primary Contact</span>
                <div className="mt-1 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--gray-400)]" />
                  <span className="text-sm font-medium text-[var(--gray-900)]">{company.contact || "-"}</span>
                </div>
              </div>
              <div>
                <span className={labelStyle}>Email</span>
                <div className="mt-1 flex items-center gap-2 truncate">
                  <Mail className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                  <span className="text-sm font-medium text-[var(--gray-900)] truncate pr-2">{company.email}</span>
                </div>
              </div>
              <div>
                <span className={labelStyle}>Phone</span>
                <div className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--gray-400)]" />
                  <span className="text-sm font-medium text-[var(--gray-900)]">{company.phone || "-"}</span>
                </div>
              </div>
              <div>
                <span className={labelStyle}>Owner</span>
                <div className="mt-1 text-sm font-medium text-[var(--gray-900)]">{company.owner || "-"}</div>
              </div>
            </div>
          </section>

          {/* Details Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="text-base font-bold text-[var(--gray-900)] tracking-tight">Company Overview</h2>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <span className={labelStyle}>Key Technologies</span>
                <div className="mt-2 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                  <span className="text-sm font-medium text-[var(--gray-900)]">{company.keyTechnologies || "-"}</span>
                </div>
              </div>

              <div>
                <span className={labelStyle}>Client Account</span>
                <div className="mt-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                  <span className="text-sm font-medium text-[var(--gray-900)]">
                    {clientUser ? (clientUser.nickname || clientUser.email) : "-"}
                  </span>
                </div>
              </div>

              <div>
                <span className={labelStyle}>Created Time</span>
                <div className="mt-2 text-sm text-[var(--gray-600)]">
                  {new Date(company.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--gray-900)]">Open Job Orders</h3>
              <Link href="/recruiter/job-orders/new" className="text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer">
                + Add New
              </Link>
            </div>

            <ul className="space-y-3">
              {jobs.length === 0 ? (
                <li className="text-sm text-[var(--gray-500)] text-center py-4">No open job orders</li>
              ) : (
                jobs.map(j => (
                  <li key={j.id} className="group flex items-center justify-between rounded-lg border border-[var(--border-light)] p-3 hover:border-[var(--border)] hover:bg-[var(--gray-50)] transition-all cursor-pointer">
                    <div className="flex-1 min-w-0 pr-3">
                      <Link href={`/recruiter/job-orders/${j.id}`} className="truncate text-sm font-semibold text-[var(--gray-900)] group-hover:text-[var(--accent)] transition-colors block">
                        {j.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--gray-500)]">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-medium text-xs
                          ${["sourcing", "interview", "offer"].includes(j.status) ? "bg-[var(--status-green-bg)] text-[var(--status-green-text)]" :
                            j.status === "paused" ? "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]" :
                              "bg-[var(--gray-100)] text-[var(--gray-600)]"}`}>
                          {j.status === "sourcing" ? "Active" :
                            j.status === "interview" ? "Interview" :
                              j.status === "offer" ? "Offer" :
                                j.status === "paused" ? "Paused" : "Filled"}
                        </span>
                        <span className="truncate">{j.workArrangement || "-"}</span>
                        {j.locationCity && j.locationState && (
                          <span className="truncate">• {j.locationCity}, {j.locationState}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--gray-300)] group-hover:text-[var(--accent)] shrink-0 transition-colors" />
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--gray-900)]">Edit Company</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Name <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Email <span className="text-red-500">*</span></label>
                  <input type="email" className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Contact</label>
                  <input type="text" className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">Phone</label>
                  <input type="text" className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--gray-700)]">Web Site</label>
                <input type="text" className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--gray-700)]">Location (Country / State / City)</label>
                <LocationSelector
                  country={formData.country}
                  state={formData.state}
                  city={formData.city}
                  onCountryChange={(c) => setFormData({ ...formData, country: c, state: "", city: "" })}
                  onStateChange={(s) => setFormData({ ...formData, state: s, city: "" })}
                  onCityChange={(c) => setFormData({ ...formData, city: c })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--gray-700)]">Key Technologies</label>
                <input type="text" placeholder="e.g. React, Node.js, AWS..." className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]" value={formData.keyTechnologies} onChange={e => setFormData({ ...formData, keyTechnologies: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--gray-700)]">ClientAccount <span className="text-xs text-[var(--gray-400)] ml-1 font-normal">(Optional)</span></label>
                <select className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer" value={formData.clientAccount} onChange={e => setFormData({ ...formData, clientAccount: e.target.value })}>
                  <option value="">Select a Client Account</option>
                  {clientUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.nickname || user.email}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
