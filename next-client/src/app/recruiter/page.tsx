import { Button } from "@/components/ui/button";
import { DataTable, GradientCard, Section } from "@/components/recruiter/cards";
import {
  CLIENT_REMINDERS,
  JOB_ORDERS,
  PIPELINE,
  REPORTS,
} from "@/data/recruiter";
import { ArrowUpRight, BellRing, BarChart2, BriefcaseBusiness, Sparkles } from "lucide-react";

type SeriesPoint = { label: string; value: number };

function LineChart({ data, color = "#2563eb" }: { data: SeriesPoint[]; color?: string }) {
  const W = 420, H = 140, P = 20;
  const max = Math.max(1, ...data.map((d) => d.value));
  const pts = data.map((d, i) => {
    const x = P + (i * (W - 2 * P)) / (data.length - 1);
    const y = H - P - (d.value / max) * (H - 2 * P);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts.join(" ")} />
      {data.map((d, i) => {
        const x = P + (i * (W - 2 * P)) / (data.length - 1);
        const y = H - P - (d.value / max) * (H - 2 * P);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function BarChart({ data, color = "#7c3aed" }: { data: SeriesPoint[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex-1">
          <div className="h-28 rounded-md bg-slate-100">
            <div className="mx-auto w-3 rounded-md" style={{ height: `${(d.value / max) * 100}%`, background: color }} />
          </div>
          <div className="mt-1 text-center text-[11px] text-slate-600">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function Donut({ values, colors, labels }: { values: number[]; colors: string[]; labels: string[] }) {
  const total = Math.max(1, values.reduce((a, b) => a + b, 0));
  let acc = 0;
  const stops = values.map((v, i) => {
    const start = (acc / total) * 360;
    acc += v;
    const end = (acc / total) * 360;
    return `${colors[i]} ${start}deg ${end}deg`;
  });
  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 rounded-full" style={{ background: `conic-gradient(${stops.join(',')})` }} />
      <div className="space-y-1 text-xs text-slate-600">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors[i] }} /> {l}: {Math.round((values[i]/total)*100)}%</div>
        ))}
      </div>
    </div>
  );
}

const KPI_GRADIENTS = [
  "from-[#4f46e5] via-[#4338ca] to-[#312e81]",
  "from-[#22d3ee] via-[#0ea5e9] to-[#2563eb]",
  "from-[#34d399] via-[#10b981] to-[#047857]",
];

export default function RecruiterDashboard() {
  const totalApplicants = JOB_ORDERS.reduce((acc, job) => acc + job.applicants, 0);
  const interviewCount = PIPELINE.filter((item) =>
    item.stage.toLowerCase().includes("interview"),
  ).length;
  const offerCount = PIPELINE.filter((item) =>
    item.stage.toLowerCase().includes("offer"),
  ).length;
  const hires = JOB_ORDERS.filter((job) => job.status === "filled").length;

  const activityStats = [
    { label: "Applications", value: totalApplicants },
    { label: "Interviews", value: interviewCount },
    { label: "Offers", value: offerCount },
    { label: "Hires", value: hires },
  ];
  const maxStatValue = Math.max(...activityStats.map((stat) => stat.value), 1);

  const weeklyCandidates: SeriesPoint[] = Array.from({ length: 8 }, (_, i) => ({ label: `W${i+1}`, value: 6 + i * 2 }));
  const monthlyOrders: SeriesPoint[] = Array.from({ length: 6 }, (_, i) => ({ label: `M${i+1}`, value: 2 + (i%3) }));
  const sourceMixValues = [56, 28, 16];
  const sourceMixColors = ["#2563eb", "#7c3aed", "#10b981"];
  const sourceMixLabels = ["Inbound", "Sourced", "Referral"];

  const notifications = [
    ...CLIENT_REMINDERS.slice(0, 3).map((item) => ({
      title: `${item.company} · ${item.status}`,
      detail: item.topic,
      timestamp: `Due ${item.due}`,
    })),
    ...PIPELINE.slice(0, 2).map((entry) => ({
      title: `${entry.name} · ${entry.stage}`,
      detail: entry.nextAction,
      timestamp: "Candidate update",
    })),
  ].slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-10">
      <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_-60px_rgba(15,23,42,0.2)]">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Recruiter dashboard
              </span>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                Welcome back, Allan 
              </h1>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {REPORTS.slice(0, 3).map((report, index) => (
              <GradientCard
                key={report.label}
                title={report.value}
                subtitle={report.label}
                accent={KPI_GRADIENTS[index % KPI_GRADIENTS.length]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trends row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">New candidates (8 weeks)</h3>
          </div>
          <LineChart data={weeklyCandidates} color="#2563eb" />
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Job orders (6 months)</h3>
          </div>
          <BarChart data={monthlyOrders} color="#7c3aed" />
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Source mix</h3>
          </div>
          <Donut values={sourceMixValues} colors={sourceMixColors} labels={sourceMixLabels} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Section
          title="Recent notifications"
          subtitle="Client decisions, follow-ups, system alerts"
          icon={<BellRing className="h-4 w-4" />}
        >
          <ul className="divide-y divide-slate-200 text-sm text-slate-600">
            {notifications.map((notification, index) => (
              <li key={index} className="flex items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="text-xs text-slate-500">{notification.detail}</p>
                </div>
                <span className="text-xs text-slate-500">{notification.timestamp}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Activity metrics"
          subtitle="Applications, interviews, offers"
          icon={<BarChart2 className="h-4 w-4" />}
        >
          <div className="grid gap-4 px-6 py-6">
            {activityStats.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{stat.label}</span>
                  <span className="font-semibold text-slate-900">{stat.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#ec4899]"
                    style={{ width: `${(stat.value / maxStatValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section
        title="Latest job postings"
        subtitle="Applications received in the last cycle"
        icon={<BriefcaseBusiness className="h-4 w-4" />}
        action={
          <Button variant="outline" size="sm" className="border-slate-300 text-slate-700">
            Manage postings
          </Button>
        }
      >
        <DataTable
          columns={[
            { key: "title", label: "Job order" },
            { key: "client", label: "Client", className: "px-3" },
            { key: "status", label: "Status", className: "px-3" },
            { key: "applicants", label: "Applicants", className: "px-3" },
            { key: "updated", label: "Updated", className: "px-3" },
            { key: "actions", label: "Actions", className: "px-3 text-right" },
          ]}
          rows={JOB_ORDERS.map((order) => ({
            title: (
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900">{order.title}</span>
                <span className="text-xs text-slate-500">{order.location}</span>
              </div>
            ),
            client: order.client,
            status: order.status,
            applicants: `${order.applicants} applicants`,
            updated: order.updatedAt,
            actions: (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 px-3 text-xs text-slate-700"
              >
                View details
              </Button>
            ),
          }))}
        />
      </Section>

      <Section
        title="Candidate follow-ups"
        subtitle="Next steps pulled from pipeline"
        action={
          <Button variant="outline" size="sm" className="border-slate-300 text-slate-700">
            Open candidate board
          </Button>
        }
      >
        <div className="grid gap-3 px-5 py-4 text-sm text-slate-600 md:grid-cols-2">
          {PIPELINE.slice(0, 4).map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-900">{entry.name}</p>
                <p className="text-xs text-slate-500">{entry.role}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{entry.stage}</p>
                <p>{entry.nextAction}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

       
    </div>
  );
}
