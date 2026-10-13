import type { BloodGroup } from "@/lib/types";
import { isRare } from "@/lib/blood";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-ink-600 sm:text-base">{subtitle}</p>}
    </div>
  );
}

export function GroupBadge({ group, size = "md" }: { group: BloodGroup; size?: "sm" | "md" | "lg" }) {
  const rare = isRare(group);
  const cls =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "lg"
        ? "px-5 py-2.5 text-3xl"
        : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold tnum ${cls} ${
        rare ? "bg-crimson-600 text-white" : "bg-crimson-50 text-crimson-800 ring-1 ring-inset ring-crimson-200"
      }`}
      title={rare ? `${group} — rare blood group, priority` : `Blood group ${group}`}
    >
      {group}
      {rare && (
        <span className="text-[10px] font-semibold uppercase tracking-wide" aria-hidden="true">
          rare
        </span>
      )}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: "critical" | "urgent" | "scheduled" }) {
  const map = {
    critical: "bg-crimson-600 text-white",
    urgent: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300",
    scheduled: "bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200",
  } as const;
  const label = { critical: "Critical", urgent: "Urgent", scheduled: "Scheduled" } as const;
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${map[urgency]}`}>
      {label[urgency]}
    </span>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</p>
      <p className="tnum mt-1 text-3xl font-bold tracking-tight text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export type EmptyKind = "drop" | "people" | "bank" | "search" | "calendar" | "flag";

function EmptyIllustration({ kind }: { kind: EmptyKind }) {
  const common = {
    className: "mx-auto h-14 w-14",
    viewBox: "0 0 56 56",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<EmptyKind, React.ReactNode> = {
    drop: <path d="M28 8c0 0-12 14-12 23a12 12 0 0 0 24 0c0-9-12-23-12-23z" />,
    people: (
      <>
        <circle cx="21" cy="20" r="6" />
        <path d="M9 46c0-8 5-13 12-13s12 5 12 13" />
        <circle cx="38" cy="22" r="4.5" />
        <path d="M35 33.5c5.5 1 9.5 5 10.5 10.5" />
      </>
    ),
    bank: (
      <>
        <path d="M8 22l20-11 20 11" />
        <path d="M12 22v18M22 22v18M34 22v18M44 22v18" />
        <path d="M8 46h40" />
      </>
    ),
    search: (
      <>
        <circle cx="25" cy="25" r="12" />
        <path d="M34 34l11 11" />
      </>
    ),
    calendar: (
      <>
        <rect x="10" y="14" width="36" height="30" rx="3" />
        <path d="M10 24h36M20 8v8M36 8v8" />
        <circle cx="28" cy="34" r="3" />
      </>
    ),
    flag: (
      <>
        <path d="M14 50V8" />
        <path d="M14 10h26l-6 8 6 8H14" />
      </>
    ),
  };
  return (
    <div className="mb-4 text-ink-300">
      <svg {...common}>{paths[kind]}</svg>
    </div>
  );
}

export function EmptyState({ title, body, action, kind = "drop" }: { title: string; body: string; action?: React.ReactNode; kind?: EmptyKind }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white px-6 py-10 text-center">
      <EmptyIllustration kind={kind} />
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500 min-h-[44px]";
