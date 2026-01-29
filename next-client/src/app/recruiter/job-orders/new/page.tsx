"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CLIENTS } from "@/data/recruiter";

type JobOrderInput = {
  title?: string;
  client?: string;
  status?: "sourcing" | "interview" | "offer" | "filled" | "paused";
  openings?: number;
  priority?: "high" | "medium" | "low";
  location?: string;
  tags?: string;
  description?: string;
  notes?: string;
};

const STORAGE_KEY = "ADDED_JOB_ORDERS";

export default function NewJobOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<JobOrderInput>({});
  

  const companyOptions = useMemo(() => CLIENTS.map((c) => c.company), []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const now = new Date();
    const id = `JO-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;

    const record = {
      id,
      title: form.title?.trim() || "New Role",
      client: form.client?.trim() || companyOptions[0] || "New Client",
      status: form.status || "sourcing",
      openings: form.openings ?? 1,
      priority: form.priority || "medium",
      location: form.location?.trim() || "Remote · Anywhere",
      updatedAt: "Just now",
      tags: (form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      applicants: 0,
      description: form.description?.trim() || "This role contributes to growth initiatives and cross-functional delivery.",
      notes: form.notes?.trim() || "Add internal notes here.",
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? (JSON.parse(raw) as any[]) : [];
      list.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setShowModal(true);
    } catch {
      // swallow for demo
      setShowModal(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-10">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Add Job Order</h1>
            <p className="text-sm text-slate-600">Create a new job order. All fields are optional for the demo.</p>
          </div>
          <Button variant="outline" size="sm" className="border-slate-300 text-slate-700" asChild>
            <Link href="/recruiter/job-orders">Back to list</Link>
          </Button>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Title</label>
            <input className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Backend Engineer" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Company</label>
            <select
              className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm"
              value={form.client || companyOptions[0] || ""}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            >
              {companyOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="__other">Other (type below)</option>
            </select>
            {form.client === "__other" && (
              <input className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Enter company name" onChange={(e) => setForm({ ...form, client: e.target.value })} />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Status</label>
            <select className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm" value={form.status || "sourcing"} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="sourcing">sourcing</option>
              <option value="interview">interview</option>
              <option value="offer">offer</option>
              <option value="filled">filled</option>
              <option value="paused">paused</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Openings</label>
            <input type="number" min={1} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" value={form.openings ?? ""} onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })} placeholder="1" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Priority</label>
            <select className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm" value={form.priority || "medium"} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Location</label>
            <input className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Remote · Anywhere" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-800">Tags (comma separated)</label>
            <input className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" value={form.tags || ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Go, PostgreSQL, Kubernetes" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-800">Description</label>
            <textarea className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Role overview, responsibilities, requirements..." />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-800">Internal Notes</label>
            <textarea className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Stakeholders, compensation band, interview panel..." />
          </div>

          <div className="md:col-span-2 mt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" className="border-slate-300 text-slate-700" asChild>
              <Link href="/recruiter/job-orders">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>Add job order</Button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h4 className="text-base font-semibold text-slate-900">Job order created</h4>
            <p className="mt-1 text-sm text-slate-600">Your job order has been added to the list.</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button size="sm" asChild>
                <Link href="/recruiter/job-orders">Go to job orders</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
