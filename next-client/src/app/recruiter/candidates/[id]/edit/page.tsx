"use client";

import { notFound, useRouter, useParams } from "next/navigation";
import { CANDIDATE_RECORDS } from "@/data/recruiter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMemo, useState } from "react";

const CITIES: Array<[string, string]> = [
  ["Pittsburgh", "PA"],
  ["Woodland Park", "MI"],
  ["Midland", "TX"],
  ["Hewlett", "NY"],
  ["Perkasie", "PA"],
  ["Dickinson", "TX"],
  ["Burlingame", "CA"],
  ["Tacoma", "WA"],
  ["Van Nuys", "CA"],
  ["Springfield", "IL"],
  ["Farmingdale", "NY"],
  ["Atlanta", "GA"],
  ["Newark", "CA"],
  ["Worcester", "MA"],
  ["Los Angeles", "CA"],
];

function derivedContact(id: string, name: string) {
  const n = (parseInt(id.replace(/\D/g, "")) || 1000);
  const phone = `${Math.floor(200 + (n % 700))}-${String(200 + (n % 700)).padStart(3, "0")}-${String(1000 + (n % 9000)).slice(-4)}`;
  const [city, state] = CITIES[n % CITIES.length];
  const handle = name.toLowerCase().replace(/[^a-z]/g, "-");
  const linkedin = `https://www.linkedin.com/in/${handle}`;
  const address = `${city}, ${state}, USA`;
  return { phone, linkedin, address };
}

export default function EditCandidate() {
  const params = useParams<{ id: string }>();
  const cand = useMemo(() => CANDIDATE_RECORDS.find((c) => c.id === params.id), [params.id]);
  const router = useRouter();
  if (!cand) return notFound();

  const [name, setName] = useState(cand.name);
  const [role, setRole] = useState(cand.role);
  const [stage, setStage] = useState(cand.stage);
  const [status, setStatus] = useState(cand.status);
  const contact = useMemo(() => derivedContact(cand.id, cand.name), [cand.id, cand.name]);
  const [email] = useState(cand.name.toLowerCase().replace(/[^a-z]/g, ".") + "@example.com");
  const [phone, setPhone] = useState(contact.phone);
  const [linkedin, setLinkedin] = useState(contact.linkedin);
  const [address, setAddress] = useState(contact.address);
  const [resumeName, setResumeName] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-10">
      <div className="mb-4 text-sm text-slate-600">
        <Link href={`/recruiter/candidates/${encodeURIComponent(cand.id)}`} className="hover:underline">Back to details</Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <h1 className="mb-4 text-xl font-semibold text-slate-900">Edit Candidate</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600">Name</label>
            <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder-slate-400" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-600">Role</label>
            <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder-slate-400" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-600">Stage</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder-slate-400" value={stage} onChange={(e) => setStage(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-600">Status</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder-slate-400" value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-600">E-Mail</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800" value={email} readOnly />
            </div>
            <div>
              <label className="block text-sm text-slate-600">Phone</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder-slate-400" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-600">LinkedIn URL</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder-slate-400" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-600">Address</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 placeholder-slate-400" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-600">Resume (PDF/DOC)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.rtf"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2"
              onChange={(e) => setResumeName(e.target.files?.[0]?.name ?? null)}
            />
            {resumeName && (
              <p className="mt-1 text-xs text-slate-500">Selected: {resumeName}</p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" className="border-slate-300 text-slate-700" onClick={() => router.back()}>Cancel</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">Save (demo)</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
