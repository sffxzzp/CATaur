"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { JOB_ORDERS, CANDIDATE_RECORDS, CLIENTS, type JobOrder } from "@/data/recruiter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function toCreatedAndAgeFromId(id: string) {
  const digits = parseInt(id.replace(/\D/g, "")) || 1;
  const ageDays = (digits % 180) + 1; // 1..180 days
  const created = new Date(Date.now() - ageDays * 86400000);
  const mm = String(created.getMonth() + 1).padStart(2, "0");
  const dd = String(created.getDate()).padStart(2, "0");
  const yy = String(created.getFullYear()).slice(-2);
  return { created: `${mm}-${dd}-${yy}`, ageDays };
}

type JobOrderExtra = JobOrder & { description?: string; notes?: string };

export default function JobOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const [localJob, setLocalJob] = useState<JobOrderExtra | null>(null);
  const job = useMemo<JobOrderExtra | null>(() => {
    return JOB_ORDERS.find((j) => j.id === id) || localJob || null;
  }, [id, localJob]);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("ADDED_JOB_ORDERS");
      if (raw) {
        const arr = JSON.parse(raw) as JobOrderExtra[];
        const found = arr.find((j) => j.id === id);
        if (found) setLocalJob(found);
      }
    } catch {}
  }, [id]);

  if (!job) return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">Job order not found.</div>
    </div>
  );

  const { created, ageDays } = toCreatedAndAgeFromId(job.id);
  const candidates = CANDIDATE_RECORDS.slice(0, 12);
  const company = CLIENTS.find((c) => c.company === job.client);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="mb-4 text-sm text-slate-600">
        <Link href="/recruiter/job-orders" className="hover:underline">Job Orders</Link> / <span className="text-slate-800">{job.title}</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{job.title}</h1>
            <p className="text-sm text-slate-600">{job.client}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">Edit</Button>
            <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">Generate Report</Button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">Job Order Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <span className="text-slate-500">Company</span>
                <div>
                  <Link href={`/recruiter/clients/${encodeURIComponent(job.client)}`} className="text-primary hover:underline">{job.client}</Link>
                </div>
              </div>
              <div><span className="text-slate-500">CATS Job ID</span><div>{job.id.replace(/^JO-/, "")}</div></div>
              <div><span className="text-slate-500">Type</span><div>{job.status === "offer" || job.status === "filled" ? "Hire" : "Contract"}</div></div>
              <div><span className="text-slate-500">Status</span><div className="capitalize">{job.status}</div></div>
              <div><span className="text-slate-500">Openings</span><div>{job.openings}</div></div>
              <div><span className="text-slate-500">Location</span><div>{job.location}</div></div>
              <div><span className="text-slate-500">Created</span><div>{created}</div></div>
              <div><span className="text-slate-500">Days Old</span><div>{ageDays}</div></div>
              <div><span className="text-slate-500">Recruiter</span><div>Allan Jones</div></div>
              <div><span className="text-slate-500">Owner</span><div>Allan Jones</div></div>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-slate-800">Description</h3>
              <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                {job.description || "This role contributes to growth initiatives and cross-functional delivery. Experience in similar scale-ups is preferred."}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-800">Internal Notes</h3>
              <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                {job.notes || "Key stakeholders aligned. Offer band confirmed."}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Company</h3>
              <div className="text-sm text-slate-700">
                <div className="mb-1 font-semibold text-slate-900">
                  <Link href={`/recruiter/clients/${encodeURIComponent(job.client)}`} className="hover:underline">{job.client}</Link>
                </div>
                <ul className="space-y-1">
                  <li><span className="text-slate-500">Industry: </span>{company?.industry ?? "—"}</li>
                  <li><span className="text-slate-500">Open roles: </span>{company?.openRoles ?? 0}</li>
                  <li><span className="text-slate-500">Primary contact: </span>{company?.contact ?? "—"}</li>
                  <li><span className="text-slate-500">Satisfaction: </span>{company?.satisfaction ?? "—"}</li>
                  <li><span className="text-slate-500">Last review: </span>{company?.lastReview ?? "—"}</li>
                </ul>
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="border-slate-300 text-slate-700" asChild>
                    <Link href={`/recruiter/clients/${encodeURIComponent(job.client)}`}>View company</Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Status of Candidates</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between"><span>Applicants</span><span>{job.applicants}</span></div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#ec4899]" style={{ width: "75%" }} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Attachments</h3>
              <p className="text-sm text-slate-600">No attachments. Add during migration.</p>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">Add Attachment</Button>
              </div>
            </div>
          </aside>
        </div>
        <div className="border-t border-slate-200 px-5 py-4 text-base font-semibold text-slate-900">Candidates in Job Order</div>
        <div className="overflow-x-auto px-5 pb-6">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-[13px] font-medium text-slate-600">
              <tr>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">Loc</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const [first, ...rest] = c.name.split(" ");
                const last = rest.join(" ") || "—";
                return (
                  <tr key={c.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{first}</td>
                    <td className="px-4 py-3">{last}</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">{c.lastContact}</td>
                    <td className="px-4 py-3">{c.status}</td>
                    <td className="px-4 py-3">Auto-imported · demo</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
