import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Bot,
  FileText,
  Lamp,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Stars,
  TimerReset,
} from "lucide-react";

const CHAT_LOG = [
  {
    author: "AI Coach",
    message:
      "Here’s a summary of your upcoming system design round with Maple Fintech (Toronto). Expect deep dives on event‑driven microservices, Go concurrency, and PostgreSQL scaling.",
    accent: true,
  },
  {
    author: "You",
    message:
      "Can you suggest two metrics from my backend work that would resonate with their engineering leads?",
    accent: false,
  },
  {
    author: "AI Coach",
    message:
      "Call out the 42% reduction in P95 latency after query path optimization and the 99.95% uptime maintained across EKS during peak events. I’ll turn these into concise talking points.",
    accent: true,
  },
];

const INSIGHTS = [
  {
    title: "System design prep",
    description:
      "Practice deck aligned to Maple Fintech’s architecture patterns: event bus, idempotency, and back‑pressure in Go.",
    icon: Lightbulb,
  },
  {
    title: "Resume refinement",
    description:
      "Executive summary tuned for Go/Kubernetes roles in Canada. Added measurable outcomes and ATS‑friendly keywords.",
    icon: FileText,
  },
  {
    title: "Market intel (Canada)",
    description:
      "Toronto/Vancouver salary bands for Senior/Staff ICs, plus local tech news relevant to payments and health tech.",
    icon: Lamp,
  },
];

export default function AssistantPage() {
  return (
    <div className="px-6 pb-24 pt-14">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="rounded-[36px] border border-border bg-white/85 px-8 py-10 shadow-[0_42px_100px_-70px_rgba(12,24,55,0.75)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-start">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-medium text-white bg-ai-gradient shadow-sm">
                <Bot className="h-4 w-4" />
                Intelligence suite
              </span>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                AI assistant for candidate workflows.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted">
                CATaur combines structured recruiter workflows with responsible AI to deliver personalised coaching, insights, and story crafting alongside every application.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[36px] border border-border bg-white/90 p-7 shadow-[0_42px_120px_-70px_rgba(12,24,55,0.75)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Conversation feed
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  Collaborate in real-time with the built-in AI co-pilot.
                </h2>
              </div>
              <Button size="sm" className="px-4">
                Start new thread
              </Button>
            </div>
            <div className="mt-6 space-y-4">
              {CHAT_LOG.map((entry, index) => {
                const isYou = entry.author === "You";
                return (
                  <div key={index} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                    <div className={`relative max-w-[680px] rounded-3xl border px-5 py-4 text-sm leading-relaxed ${
                      isYou ? "border-border bg-white text-muted" : "border-border bg-white text-muted"
                    }`}>
                      {!isYou && (
                        <span className="absolute left-0 top-0 h-full w-1 rounded-l-3xl bg-ai-gradient" />
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`${!isYou ? "text-gradient-ai" : "text-muted-foreground"}`}>{entry.author}</span>
                        <Stars className={`h-4 w-4 ${!isYou ? "text-gradient-ai" : "text-muted-foreground"}`} />
                      </div>
                      <p className="mt-3 text-base text-foreground/90">{entry.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-[28px] border border-border bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Draft your message
                </p>
              </div>
              <textarea
                rows={3}
                placeholder="Ask for system design prep, resume tuning, or market intel (Canada)"
                className="mt-3 w-full resize-none rounded-3xl border border-border/70 bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border px-3 py-1">System design</span>
                  <span className="rounded-full border border-border px-3 py-1">Take‑home plan</span>
                  <span className="rounded-full border border-border px-3 py-1">Salary ranges (CA$)</span>
                </div>
                <Button size="sm" className="px-4">
                  Send request
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[36px] border border-border bg-white/90 p-7 shadow-[0_36px_100px_-70px_rgba(12,24,55,0.7)]">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">
                      AI workflow kits
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">Preview automation steps</h3>
                </div>
                  <TimerReset className="h-5 w-5 text-primary" />
              </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  CATaur orchestrates research, drafting, and reminders in the background. Tap into the modules below for deeper control.
                </p>
                <div className="mt-5 space-y-3">
                  <WorkflowRow
                    title="System design rehearsal"
                    description="Roleplay architecture trade‑offs (Go, PostgreSQL, Kafka) with rubric‑based scoring."
                  />
                  <WorkflowRow
                    title="Resume keyword tuning (ATS)"
                    description="Optimize skills/impact for Go/K8s/React roles in Canada."
                  />
                  <WorkflowRow
                    title="Offer strategy (Canada)"
                    description="Scenario analysis across salary (CA$), equity, and relocation."
                  />
                </div>
                <Button className="mt-6 w-full justify-center bg-ai-gradient text-white hover:opacity-90">
                  View workflow timelines
                </Button>
            </div>

            <div className="rounded-[36px] border border-border bg-white/90 p-7 shadow-[0_36px_100px_-70px_rgba(12,24,55,0.7)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Insight digest
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    This week’s recommendations
                  </h3>
                </div>
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-5 space-y-4">
                {INSIGHTS.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-3xl border border-border/70 bg-white px-5 py-4 text-sm text-muted"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                      </div>
                    </div>
                    <p className="mt-3 leading-relaxed">{description}</p>
                    <button className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary transition hover:text-primary/80">
                      View detail
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkflowRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white px-5 py-4 text-sm text-muted">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">{title}</p>
        <Stars className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 leading-relaxed">{description}</p>
    </div>
  );
}
