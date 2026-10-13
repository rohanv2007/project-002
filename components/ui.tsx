import type { BloodGroup } from "@/lib/types";
import { isRare } from "@/lib/blood";

/* ---------- Kicker: small uppercase section label with signal square ---------- */
export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-faint ${className}`}>
      <span className="inline-block h-[7px] w-[7px] bg-signal" aria-hidden="true" />
      {children}
    </p>
  );
}

/* ---------- Buttons: sharp, uppercase, editorial ---------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  children: React.ReactNode;
};

export function Btn({ variant = "primary", className = "", children, ...rest }: BtnProps) {
  const base =
    "lift inline-flex min-h-[44px] items-center justify-center rounded-[3px] px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.12em]";
  const styles = {
    primary: "bg-signal text-cream",
    outline: "border border-ink text-ink",
    ghost: "text-soot hover:text-ink",
  } as const;
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Page header: kicker + Fraunces display heading ---------- */
export function PageHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-10">
      {kicker && <Kicker>{kicker}</Kicker>}
      <h1 className="mt-4 font-display text-[36px] font-semibold leading-[1.06] tracking-tight md:text-[52px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-soot md:text-[16px]">{subtitle}</p>
      )}
    </div>
  );
}

/* ---------- Blood group badge: sharp, signal for rare ---------- */
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
      className={`inline-flex items-center gap-1.5 rounded-[3px] font-display font-bold tnum ${cls} ${
        rare ? "bg-signal text-cream" : "bg-cream text-ink ring-1 ring-inset ring-line"
      }`}
      title={rare ? `${group} — rare blood group, priority` : `Blood group ${group}`}
    >
      {group}
      {rare && (
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em]" aria-hidden="true">
          rare
        </span>
      )}
    </span>
  );
}

/* ---------- Urgency badge ---------- */
export function UrgencyBadge({ urgency }: { urgency: "critical" | "urgent" | "scheduled" }) {
  const map = {
    critical: "bg-signal text-cream",
    urgent: "bg-cream text-ember ring-1 ring-inset ring-signal",
    scheduled: "bg-cream text-soot ring-1 ring-inset ring-line",
  } as const;
  const label = { critical: "Critical", urgent: "Urgent", scheduled: "Scheduled" } as const;
  return (
    <span className={`inline-flex rounded-[3px] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] ${map[urgency]}`}>
      {label[urgency]}
    </span>
  );
}

/* ---------- Editorial stat: big Fraunces number, uppercase label ---------- */
export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <p className="tnum font-display text-[44px] font-semibold leading-none tracking-tight text-ink md:text-[52px]">
        {value}
      </p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">{label}</p>
      {hint && <p className="mt-1 text-xs text-soot">{hint}</p>}
    </div>
  );
}

/* ---------- Empty state: sharp, dashed, editorial ---------- */
export type EmptyKind = "drop" | "people" | "bank" | "search" | "calendar" | "flag";

function EmptyIllustration({ kind }: { kind: EmptyKind }) {
  const common = {
    className: "mx-auto h-14 w-14",
    viewBox: "0 0 56 56",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
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
        <rect x="10" y="14" width="36" height="30" rx="1" />
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
    <div className="mb-4 text-faint">
      <svg {...common}>{paths[kind]}</svg>
    </div>
  );
}

export function EmptyState({ title, body, action, kind = "drop" }: { title: string; body: string; action?: React.ReactNode; kind?: EmptyKind }) {
  return (
    <div className="rounded-[4px] border border-dashed border-line bg-cream px-6 py-12 text-center">
      <EmptyIllustration kind={kind} />
      <h3 className="font-display text-[22px] font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-soot">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ---------- Form field ---------- */
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
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-soot">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-[3px] border border-line bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal min-h-[44px]";

export const cardCls =
  "lift rounded-[4px] border border-line bg-cream p-5 sm:p-6";
