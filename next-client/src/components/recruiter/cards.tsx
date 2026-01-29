import { cn } from "@/lib/utils";

export function Section({ title, subtitle, action, icon, children }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_40px_100px_-70px_rgba(15,23,42,0.25)]">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          {icon && <div className="rounded-md bg-slate-100 p-2 text-slate-600">{icon}</div>}
          <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function GradientCard({ title, subtitle, accent }: {
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br px-4 py-5 text-white shadow-[0_25px_60px_-40px_rgba(15,23,42,0.9)]",
        accent,
      )}
    >
      <p className="text-xs font-medium text-white/90">{subtitle}</p>
      <p className="mt-3 text-2xl font-semibold">{title}</p>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: Array<Record<string, React.ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-100 text-[13px] font-medium text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn("px-5 py-3", column.className)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-slate-200">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-5 py-3 text-slate-600", column.className)}>
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
