import { notFound } from "next/navigation";
import Link from "next/link";
import { CANDIDATE_RECORDS, JOB_ORDERS } from "@/data/recruiter";
import { Button } from "@/components/ui/button";

function fakeEmail(name: string) {
  const handle = name.toLowerCase().replace(/[^a-z]/g, ".");
  return `${handle}@example.com`;
}

const CITIES: Array<[string, string]> = [
  ["Toronto", "ON"],
  ["Vancouver", "BC"],
  ["Montreal", "QC"],
  ["Calgary", "AB"],
  ["Ottawa", "ON"],
  ["Edmonton", "AB"],
  ["Waterloo", "ON"],
  ["Victoria", "BC"],
  ["Halifax", "NS"],
  ["Quebec City", "QC"],
  ["Mississauga", "ON"],
  ["Brampton", "ON"],
  ["Markham", "ON"],
  ["Burnaby", "BC"],
  ["Richmond", "BC"],
];

function derivedContact(id: string, name: string) {
  const n = (parseInt(id.replace(/\D/g, "")) || 1000);
  const phone = `${Math.floor(200 + (n % 700))}-${String(200 + (n % 700)).padStart(3, "0")}-${String(1000 + (n % 9000)).slice(-4)}`;
  const [city, prov] = CITIES[n % CITIES.length];
  const handle = name.toLowerCase().replace(/[^a-z]/g, "-");
  const linkedin = `https://www.linkedin.com/in/${handle}`;
  const portfolio = `https://portfolio.example/${handle}`;
  const address = `${city}, ${prov}, Canada`;
  const sources = ["Inbound", "Sourced", "Referral"] as const;
  const source = sources[n % sources.length];
  const preferred = ["Toronto, ON", "Vancouver, BC", "Montreal, QC", "Calgary, AB", "Remote · Canada"][n % 5];
  const salary = [`CA$150k – CA$170k`, `CA$140k – CA$160k`, `CA$120k – CA$140k`][n % 3];
  return { phone, linkedin, portfolio, address, source, preferred, salary };
}

export default async function CandidateDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cand = CANDIDATE_RECORDS.find((c) => c.id === id);
  if (!cand) return notFound();

  const [first, ...rest] = cand.name.split(" ");
  const last = rest.join(" ") || "—";
  const email = fakeEmail(cand.name);
  const contact = derivedContact(cand.id, cand.name);
  const job = JOB_ORDERS[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="mb-4 text-sm text-slate-600">
        <Link href="/recruiter/candidates" className="hover:underline">Candidates</Link> / <span className="text-slate-800">{cand.name}</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{cand.name}</h1>
            <p className="text-sm text-slate-600">{cand.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700" asChild>
              <Link href={`/recruiter/candidates/${encodeURIComponent(cand.id)}/edit`}>Edit</Link>
            </Button>
            <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">Schedule Event</Button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">Candidate Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-700 md:grid-cols-3 lg:grid-cols-4">
              <div><span className="text-slate-500">First Name</span><div>{first}</div></div>
              <div><span className="text-slate-500">Last Name</span><div>{last}</div></div>
              <div className="break-words"><span className="text-slate-500">E-Mail</span><div className="break-all text-primary-600 hover:underline">{email}</div></div>
              <div><span className="text-slate-500">Phone</span><div>{contact.phone}</div></div>
              <div className="break-words"><span className="text-slate-500">LinkedIn</span><div className="break-all text-primary-600 hover:underline"><a href={contact.linkedin} target="_blank" rel="noreferrer">{contact.linkedin}</a></div></div>
              <div className="break-words"><span className="text-slate-500">Portfolio</span><div className="break-all text-primary-600 hover:underline"><a href={contact.portfolio} target="_blank" rel="noreferrer">{contact.portfolio}</a></div></div>
              <div><span className="text-slate-500">Address</span><div>{contact.address}</div></div>
              <div><span className="text-slate-500">Status</span><div>{cand.status}</div></div>
              <div><span className="text-slate-500">Stage</span><div>{cand.stage}</div></div>
              <div><span className="text-slate-500">Availability</span><div>{cand.availability}</div></div>
              <div><span className="text-slate-500">Source</span><div>{contact.source}</div></div>
              <div><span className="text-slate-500">Preferred Location</span><div>{contact.preferred}</div></div>
              <div><span className="text-slate-500">Target Comp</span><div>{contact.salary}</div></div>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-slate-800">Misc. Notes</h3>
              <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700">Candidate submitted via portal. Engineering focus; prefers backend with Go/K8s. Add recruiter notes here.</div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-800">Attachments</h3>
              <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-700">No attachments. Use Edit to upload a resume.</div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Job Orders for Candidate</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-[13px] font-medium text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200">
                      <td className="px-3 py-2"><Link href={`/recruiter/job-orders/${encodeURIComponent(job.id)}`} className="font-semibold text-slate-900 hover:underline">{job.title}</Link></td>
                      <td className="px-3 py-2">{job.client}</td>
                      <td className="px-3 py-2 capitalize">{job.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">Add This Candidate to Job Order</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Activity</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>Today — Auto-imported from portal</li>
              </ul>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">Log an Activity</Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
