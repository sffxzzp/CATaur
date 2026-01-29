import { notFound } from "next/navigation";
import Link from "next/link";
import { CLIENTS, JOB_ORDERS } from "@/data/recruiter";
import { Button } from "@/components/ui/button";

const CITIES: Array<[string, string]> = [
  ["Madison", "AL"],
  ["Calgary", "Alberta"],
  ["Austin", "TX"],
  ["Berlin", "BE"],
  ["London", "UK"],
  ["Toronto", "ON"],
  ["Dublin", "IE"],
  ["Paris", "FR"],
];

function buildInfo(name: string) {
  const idx = Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % CITIES.length;
  const [city, state] = CITIES[idx];
  const phone = `256-${String(300 + idx).padStart(3, "0")}-${String(7000 + idx).slice(-4)}`;
  const website = `https://${name.toLowerCase().replace(/[^a-z]/g, "")}.com`;
  const created = `05-${String(12 + (idx % 10)).padStart(2, "0")}-25`;
  return { city, state, phone, website, created, modified: created };
}

export default async function ClientDetails({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const company = decodeURIComponent(name);
  const record = CLIENTS.find((c) => c.company === company);
  if (!record) return notFound();

  const info = buildInfo(company);
  const jobs = JOB_ORDERS.filter((j) => j.client === company);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="mb-4 text-sm text-slate-600">
        <Link href="/recruiter/clients" className="hover:underline">Companies</Link> / <span className="text-slate-800">{company}</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{company}</h1>
            <p className="text-sm text-slate-600">{record.industry}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">Add Contact</Button>
            <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">New Job Order</Button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">Company Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-700 md:grid-cols-3 lg:grid-cols-4">
              <div><span className="text-slate-500">Owner</span><div>Allan Jones</div></div>
              <div><span className="text-slate-500">Jobs</span><div>{jobs.length || record.openRoles}</div></div>
              <div><span className="text-slate-500">City</span><div>{info.city}</div></div>
              <div><span className="text-slate-500">State</span><div>{info.state}</div></div>
              <div><span className="text-slate-500">Phone</span><div>{info.phone}</div></div>
              <div className="break-words"><span className="text-slate-500">Website</span><div className="break-all text-primary-600 hover:underline"><a href={info.website} target="_blank" rel="noreferrer">{info.website}</a></div></div>
              <div><span className="text-slate-500">Created</span><div>{info.created}</div></div>
              <div><span className="text-slate-500">Modified</span><div>{info.modified}</div></div>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-slate-800">Notes</h3>
              <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700">Key stakeholders: {record.contact}. Satisfaction: {record.satisfaction}. Last review: {record.lastReview}.</div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Open Job Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-[13px] font-medium text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.slice(0, 6).map((j) => (
                      <tr key={j.id} className="border-t border-slate-200">
                        <td className="px-3 py-2"><Link href={`/recruiter/job-orders/${encodeURIComponent(j.id)}`} className="font-semibold text-slate-900 hover:underline">{j.title}</Link></td>
                        <td className="px-3 py-2 capitalize">{j.status}</td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr className="border-t border-slate-200"><td className="px-3 py-2" colSpan={2}>No open orders</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Contacts</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>{record.contact} — Primary</li>
              </ul>
              <div className="mt-3"><Button size="sm" variant="outline" className="border-slate-300 text-slate-700">Add Contact</Button></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

