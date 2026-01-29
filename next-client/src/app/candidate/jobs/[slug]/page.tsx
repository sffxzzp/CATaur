import { Button } from "@/components/ui/button";
import { JOBS } from "@/data/jobs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Wallet } from "lucide-react";
import ApplyPanel from "./apply-panel";

export function generateStaticParams() {
  return JOBS.map((job) => ({ slug: job.slug }));
}

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = JOBS.find((item) => item.slug === slug);

  if (!job) {
    notFound();
  }

  return (
    <div className="px-6 pb-24 pt-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-6 rounded-[36px] border border-border bg-white/95 px-8 py-10 shadow-[0_42px_120px_-70px_rgba(12,24,55,0.75)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Button variant="ghost" size="sm" asChild className="w-fit border border-border px-4">
                <Link href="/candidate/jobs" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to openings
                </Link>
              </Button>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                {job.title}
              </h1>
              <p className="text-sm font-medium text-primary">{job.company}</p>
              <p className="text-sm text-muted">
                {job.summary}
              </p>
            </div>
            <div className="space-y-3 rounded-[28px] border border-border/80 bg-white/90 p-5 text-sm text-muted">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-primary" />
                <span>{job.salaryRange}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary">
                Work style: {job.workType}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="space-y-6 rounded-[30px] border border-border bg-white/95 p-6 shadow-[0_32px_100px_-70px_rgba(12,24,55,0.7)]">
            <h2 className="text-lg font-semibold text-foreground">Responsibilities</h2>
            <ul className="space-y-3 text-sm text-muted">
              {job.responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <h2 className="text-lg font-semibold text-foreground">Requirements</h2>
            <ul className="space-y-3 text-sm text-muted">
              {job.requirements.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <aside className="space-y-6">
            <div className="rounded-[30px] border border-border bg-white/95 p-6 shadow-[0_32px_100px_-70px_rgba(12,24,55,0.7)]">
              <ApplyPanel slug={job.slug} />
            </div>

            <div className="rounded-[30px] border border-border bg-white/95 p-6 shadow-[0_32px_100px_-70px_rgba(12,24,55,0.7)]">
              <h3 className="text-lg font-semibold text-foreground">About the company</h3>
              <p className="mt-3 text-sm text-muted">{job.about}</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
