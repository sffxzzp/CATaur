"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { companiesClient } from "@/lib/api/companies";
import { usersClient } from "@/lib/api/users";
import type { User } from "@/lib/api/types";
import { formatLocation } from "@/components/location-selector";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";

/* ─── Data ────────────────────────────────────────────────────────────────── */
type Row = {
  id: string;
  name: string;
  email: string;
  contact: string;
  location: string;
  owner: string;
  created: string;
};

function initials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function RecruiterClientsPage() {
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [clientUsers, setClientUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /* Modal State */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Row | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    website: "",
    country: "",
    state: "",
    city: "",
    keyTechnologies: "",
    clientAccount: "",
  });

  const LOCATION_DATA: Record<string, Record<string, { abbr: string; cities: string[] }>> = {
    "United States": {
      "California": { abbr: "CA", cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose"] },
      "New York": { abbr: "NY", cities: ["New York City", "Buffalo", "Rochester", "Albany"] },
      "Texas": { abbr: "TX", cities: ["Houston", "Austin", "Dallas", "San Antonio"] },
      "Washington": { abbr: "WA", cities: ["Seattle", "Spokane", "Tacoma"] },
    },
    "Canada": {
      "Ontario": { abbr: "ON", cities: ["Toronto", "Ottawa", "Waterloo", "Mississauga"] },
      "British Columbia": { abbr: "BC", cities: ["Vancouver", "Victoria", "Burnaby", "Kelowna"] },
      "Quebec": { abbr: "QC", cities: ["Montreal", "Quebec City", "Laval"] },
      "Alberta": { abbr: "AB", cities: ["Calgary", "Edmonton", "Banff"] },
    }
  };

  const countries = Object.keys(LOCATION_DATA);
  const states = formData.country ? Object.keys(LOCATION_DATA[formData.country] || {}) : [];
  const cities = formData.state ? (LOCATION_DATA[formData.country]?.[formData.state]?.cities || []) : [];

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await companiesClient.list({ page: 1, limit: 1000 });
      const rows: Row[] = response.data.map((company) => ({
        id: company.id,
        name: company.name,
        email: company.email,
        contact: company.contact || "-",
        location: formatLocation(company.locationCity, company.locationState),
        owner: company.owner || "-",
        created: new Date(company.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));
      setAllRows(rows);
    } catch (error) {
      console.error("Failed to load companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientUsers = async () => {
    try {
      const response = await usersClient.listByRole("Client", { page: 1, limit: 100 });
      setClientUsers(response.data);
    } catch (error) {
      console.error("Failed to load client users:", error);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadClientUsers();
  }, []);

  const handleOpenModal = async (client?: Row) => {
    if (client) {
      setEditingClient(client);
      setIsModalOpen(true);
      try {
        const company = await companiesClient.getById(client.id);
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
      } catch {
        // fallback to row data already set
      }
    } else {
      setEditingClient(null);
      setFormData({
        name: "", contact: "", email: "", phone: "", website: "",
        country: "", state: "", city: "", keyTechnologies: "", clientAccount: ""
      });
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    const stateAbbr = formData.state && formData.country
      ? LOCATION_DATA[formData.country]?.[formData.state]?.abbr || formData.state
      : formData.state;

    setSubmitting(true);
    try {
      if (editingClient) {
        await companiesClient.update(editingClient.id, {
          name: formData.name,
          email: formData.email,
          contact: formData.contact || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          locationCountry: formData.country || undefined,
          locationState: stateAbbr || undefined,
          locationCity: formData.city || undefined,
          keyTechnologies: formData.keyTechnologies || undefined,
          clientAccountId: formData.clientAccount || undefined,
        });
      } else {
        await companiesClient.create({
          name: formData.name,
          email: formData.email,
          contact: formData.contact || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          locationCountry: formData.country || undefined,
          locationState: stateAbbr || undefined,
          locationCity: formData.city || undefined,
          keyTechnologies: formData.keyTechnologies || undefined,
          clientAccountId: formData.clientAccount || undefined,
        });
      }

      setIsModalOpen(false);
      await loadCompanies();
      toast.success(editingClient ? "Company updated successfully" : "Company created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await companiesClient.delete(id);
      await loadCompanies();
      toast.success("Company deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete company");
    }
  };

  const filtered = useMemo(() => {
    let rows = [...allRows];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.contact.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    return rows;
  }, [allRows, query]);

  // Reset page when search changes
  useMemo(() => { setCurrentPage(1); }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, filtered.length);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Top action bar: Add Company */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--gray-900)]">Companies</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">Manage client accounts and relationships</p>
        </div>
        <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors">
          <Plus className="h-4 w-4" /> Add Company
        </button>
      </div>

      {/* List View */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left min-w-[200px]">Name</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left">Email</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden sm:table-cell">Contact</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden lg:table-cell">Location</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden md:table-cell">Owner</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-left hidden lg:table-cell">Created</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)] px-5 py-2.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--gray-300)] border-t-[var(--accent)]"></div>
                    <p className="text-sm text-[var(--gray-500)]">Loading companies...</p>
                  </div>
                </td></tr>
              ) : paginatedRows.length === 0 ? (
                <tr><td colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2"><Building2 className="h-7 w-7 text-[var(--gray-300)]" /><p className="text-sm text-[var(--gray-500)]">No companies match your search.</p></div>
                </td></tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr key={r.id} className="group border-b border-[var(--border-light)] hover:bg-[var(--gray-50)] transition-colors last:border-0 cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--gray-100)] text-[11px] font-semibold text-[var(--gray-600)]">
                          {initials(r.name)}
                        </div>
                        <div>
                          <Link href={`/recruiter/clients/${r.id}`} className="text-sm font-medium text-[var(--gray-900)] cursor-pointer hover:text-[var(--accent)] transition-colors">{r.name}</Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--gray-600)] truncate max-w-[150px]">{r.email}</td>
                    <td className="px-5 py-3 text-sm text-[var(--gray-700)] hidden sm:table-cell truncate max-w-[150px]">{r.contact}</td>
                    <td className="px-5 py-3 text-sm text-[var(--gray-600)] hidden lg:table-cell truncate max-w-[150px]">{r.location}</td>
                    <td className="px-5 py-3 text-sm text-[var(--gray-600)] hidden md:table-cell truncate max-w-[120px]">{r.owner}</td>
                    <td className="px-5 py-3 text-sm text-[var(--gray-500)] hidden lg:table-cell">{r.created}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(r); }} className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-500)] cursor-pointer hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.name); }} className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--gray-500)] cursor-pointer hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Matches Candidates Page */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--border)] px-5 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--gray-500)]">
              <span>Rows</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="h-7 w-[4.5rem] bg-[var(--surface)] appearance-none rounded-md border border-[var(--border)] px-2 pr-6 text-xs font-medium text-[var(--gray-600)] cursor-pointer focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] relative"
                style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="m6 9 6 6 6-6"/%3E%3C/svg%3E')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '12px 12px' }}>
                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span><span className="font-medium text-[var(--gray-700)]">{startIdx}–{endIdx}</span> of <span className="font-medium text-[var(--gray-700)]">{filtered.length}</span></span>
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
                  <button key={p} onClick={() => setCurrentPage(p as number)}
                    className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-md text-xs font-medium transition ${p === safePage
                      ? "bg-[var(--accent)] text-white" : "text-[var(--gray-500)] cursor-pointer hover:bg-[var(--gray-100)]"
                      }`}>{p}</button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-2xl rounded-xl bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--gray-900)]">
                {editingClient ? "Edit Company" : "Add Company"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-md text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] p-1.5 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--gray-700)]">
                    Email <span className="text-red-500">*</span>
                  </label>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] cursor-pointer" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value, state: "", city: "" })}>
                    <option value="">Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select disabled={!formData.country} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] disabled:bg-[var(--gray-50)] disabled:cursor-not-allowed cursor-pointer" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value, city: "" })}>
                    <option value="">State / Province</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select disabled={!formData.state} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] disabled:bg-[var(--gray-50)] disabled:cursor-not-allowed cursor-pointer" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}>
                    <option value="">City</option>
                    {cities.map(cty => <option key={cty} value={cty}>{cty}</option>)}
                  </select>
                </div>
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

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-50)] px-6 py-4">
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-[var(--shadow-sm)] hover:bg-[var(--gray-50)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}