import { Button } from "@/components/ui/button";
import { FileText, MapPin, PenSquare, Sparkles, Target } from "lucide-react";

const EXPERIENCES = [
  {
    role: "Senior Backend Engineer (Go)",
    company: "Maple Fintech",
    duration: "2021 – Present · Toronto, Canada",
    highlights: [
      "Designed event-driven microservices on Kubernetes (EKS), 99.95% uptime",
      "Optimized PostgreSQL query paths, cutting P95 latency by 42%",
    ],
  },
  {
    role: "Full‑stack Engineer (Next.js)",
    company: "Aurora Health",
    duration: "2018 – 2021 · Vancouver, Canada",
    highlights: [
      "Shipped clinician portal (Next.js/Node) used by 2k+ MAUs",
      "Built CI/CD with GitHub Actions & Terraform, lead times −35%",
    ],
  },
];

const EDUCATION = [
  { school: "University of Toronto", degree: "B.Sc. Computer Science", year: "2016" },
  { school: "University of British Columbia", degree: "M.Eng. Software Engineering", year: "2018" },
];

const SKILLS = [
  { name: "Go / gRPC", level: "Expert" },
  { name: "PostgreSQL", level: "Advanced" },
  { name: "Kubernetes / Terraform", level: "Advanced" },
  { name: "TypeScript / React", level: "Advanced" },
  { name: "AWS (EKS, SQS, RDS)", level: "Advanced" },
  { name: "Observability (Prometheus/Grafana)", level: "Intermediate" },
];

export default function ProfilePage() {
  return (
    <div className="px-6 pb-24 pt-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Upload resume - full width */}
        <div className="rounded-[30px] border border-dashed border-border/70 bg-white/90 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Upload resume</h2>
              <p className="text-sm text-muted">PDF, DOC, DOCX, or RTF · Max 10MB</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-border/70 bg-white p-5">
            <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 text-sm text-muted">
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.rtf" />
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Choose file</span>
              <span>or drag & drop here</span>
            </label>
          </div>
        </div>

        {/* Two-column desktop layout */}
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          {/* Left: main content */}
          <section className="space-y-6">
            <div className="rounded-[30px] border border-border/80 bg-white/90 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Work experience</h2>
                <Button variant="ghost" size="sm" className="border border-border px-4">
                  Add role
                </Button>
              </div>
              <div className="mt-6 space-y-5">
                {EXPERIENCES.map((experience) => (
                  <div
                    key={experience.role}
                    className="rounded-2xl border border-border/60 bg-white px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                          {experience.duration}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">
                          {experience.role}
                        </h3>
                        <p className="text-sm text-muted">{experience.company}</p>
                      </div>
                      <button className="rounded-full border border-border p-2 text-muted transition hover:text-primary">
                        <PenSquare className="h-4 w-4" />
                      </button>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      {experience.highlights.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[30px] border border-border/80 bg-white/90 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Education</h2>
                <Button variant="ghost" size="sm" className="border border-border px-4">
                  Add education
                </Button>
              </div>
              <div className="mt-5 space-y-4">
                {EDUCATION.map((item) => (
                  <div
                    key={item.school}
                    className="rounded-2xl border border-border/60 bg-white px-5 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {item.school}
                        </h3>
                        <p className="text-sm text-muted">{item.degree}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.year}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-border/80 bg-white/90 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Skills & expertise</h2>
                <Button variant="ghost" size="sm" className="border border-border px-4">
                  Manage skills
                </Button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {SKILLS.map((skill) => (
                  <div
                    key={skill.name}
                    className="rounded-2xl border border-border/60 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {skill.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {skill.level}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[30px] border border-border/70 bg-white/90 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Profile strength</p>
                  <h2 className="mt-2 text-2xl font-semibold">95% complete</h2>
                </div>
                <div className="rounded-full bg-ai-gradient px-4 py-1 text-xs font-medium text-white shadow-sm">AI enhanced</div>
              </div>
              <div className="mt-6 h-2 rounded-full bg-border/70">
                <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <ul className="mt-5 grid gap-3 text-sm text-muted">
                <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Resume synced 2 days ago</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Prefers hybrid · Toronto / Remote Canada</li>
                <li className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Target compensation CA$170k – CA$190k</li>
              </ul>
            </div>

            <div className="rounded-[30px] border border-border bg-white/90 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Resume intelligence</p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">AI parsing summary</h2>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Latest resume processed 2 days ago. 14 key accomplishments identified; profile summary refreshed for engineering roles.
              </p>
              <div className="mt-5 grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
                <span className="rounded-full border border-border px-4 py-2">Story impact suggestions: 6</span>
                <span className="rounded-full border border-border px-4 py-2">Skills enriched: 12</span>
                <span className="rounded-full border border-border px-4 py-2">Recruiter notes merged</span>
                <span className="rounded-full border border-border px-4 py-2">Version history saved</span>
              </div>
              <Button className="mt-6 w-full justify-center bg-ai-gradient text-white hover:opacity-90">Review suggestions</Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
