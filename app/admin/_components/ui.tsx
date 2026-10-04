import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft } from "lucide-react";

// Presentational building blocks for the admin panel. Server-safe (no hooks),
// so both Server and Client Components can use them.

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("adm-page flex flex-col gap-6", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--adm-ink-3)] hover:text-[var(--adm-ink)] mb-2 transition"
          >
            <ChevronLeft size={15} />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="adm-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[28px] leading-tight font-semibold text-[var(--adm-ink)]">{title}</h1>
        {description && <p className="text-[14.5px] text-[var(--adm-ink-2)] mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** No body padding (tables, lists that run edge to edge). */
  flush?: boolean;
}) {
  return (
    <section className={cx("adm-card overflow-hidden", className)}>
      {(title || actions) && (
        <div className="adm-card-head">
          <div className="min-w-0">
            {title && <h2 className="adm-card-title">{title}</h2>}
            {description && <p className="adm-card-desc">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cx(!flush && "adm-card-body", bodyClassName)}>{children}</div>
    </section>
  );
}

export type Tone = "neutral" | "ok" | "warn" | "danger" | "info" | "violet";

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-[var(--adm-ink)]",
  ok: "text-[var(--adm-ok)]",
  warn: "text-[var(--adm-warn)]",
  danger: "text-[var(--adm-danger)]",
  info: "text-[var(--adm-brand)]",
  violet: "text-[var(--adm-violet)]",
};

const TONE_ICON_BG: Record<Tone, string> = {
  neutral: "bg-[#f0ede6] text-[var(--adm-ink-2)]",
  ok: "bg-[var(--adm-ok-soft)] text-[var(--adm-ok)]",
  warn: "bg-[var(--adm-warn-soft)] text-[var(--adm-warn)]",
  danger: "bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]",
  info: "bg-[var(--adm-brand-soft)] text-[var(--adm-brand)]",
  violet: "bg-[var(--adm-violet-soft)] text-[var(--adm-violet)]",
};

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
  valueTone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
  /** Color the value itself (default: ink). */
  valueTone?: Tone;
}) {
  const body = (
    <div className="adm-card p-5 h-full flex flex-col gap-3 transition group-hover:border-[var(--adm-line-strong)] group-hover:shadow-md">
      <div className="flex items-center justify-between gap-3 min-h-8">
        <p className="text-[13px] font-medium text-[var(--adm-ink-2)]">{label}</p>
        {Icon && (
          <span className={cx("w-8 h-8 rounded-lg grid place-items-center", TONE_ICON_BG[tone])}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className={cx("num text-[26px] font-semibold leading-none", TONE_TEXT[valueTone ?? "neutral"])}>{value}</p>
      {hint && <p className="text-[12.5px] text-[var(--adm-ink-3)] -mt-0.5">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="group block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Badge({
  tone = "neutral",
  plain,
  children,
  className,
}: {
  tone?: Tone;
  plain?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const toneClass = tone === "neutral" ? "" : `adm-badge-${tone}`;
  return <span className={cx("adm-badge", toneClass, plain && "adm-badge-plain", className)}>{children}</span>;
}

const STATUS: Record<string, Record<string, [string, Tone]>> = {
  purchase: {
    pendiente: ["Pendiente", "warn"],
    en_viaje: ["En viaje", "info"],
    recibido: ["Recibido", "ok"],
    cancelado: ["Cancelado", "neutral"],
  },
  sales: {
    pendiente: ["Pendiente", "warn"],
    confirmado: ["Confirmado", "info"],
    entregado: ["Entregado", "ok"],
    cancelado: ["Cancelado", "neutral"],
  },
  settlement: {
    pendiente: ["Pendiente", "warn"],
    liquidada: ["Liquidada", "ok"],
  },
  loss: {
    perdida: ["Pérdida", "warn"],
    dano: ["Daño", "violet"],
    robo: ["Robo", "danger"],
  },
};

export function StatusBadge({ kind, status }: { kind: keyof typeof STATUS; status: string }) {
  const [label, tone] = STATUS[kind][status] ?? [status, "neutral"];
  return <Badge tone={tone}>{label}</Badge>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-14">
      {Icon && (
        <span className="w-12 h-12 rounded-2xl grid place-items-center bg-[#f0ede6] text-[var(--adm-ink-3)] mb-4">
          <Icon size={22} />
        </span>
      )}
      <p className="font-semibold text-[var(--adm-ink)]">{title}</p>
      {description && <p className="text-[13.5px] text-[var(--adm-ink-3)] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "default",
  size,
  icon: Icon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "brand" | "ghost";
  size?: "sm" | "lg";
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx("adm-btn", variant !== "default" && `adm-btn-${variant}`, size && `adm-btn-${size}`, className)}
    >
      {Icon && <Icon />}
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label className="adm-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

export function ErrorAlert({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="adm-alert adm-alert-danger">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

/** A thin key/value list for detail screens. */
export function DefinitionList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="adm-eyebrow">{it.label}</dt>
          <dd className="mt-1 text-[14.5px] text-[var(--adm-ink)] break-words">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Server-side filter tabs driven by a query param (e.g. ?status=pendiente). */
export function FilterTabs({
  basePath,
  param,
  current,
  options,
  keep,
}: {
  basePath: string;
  param: string;
  current: string;
  options: { value: string; label: string; count?: number }[];
  /** Other query params to preserve on every tab. */
  keep?: Record<string, string>;
}) {
  const href = (value: string) => {
    const qs = new URLSearchParams(Object.entries(keep ?? {}).filter(([, v]) => v));
    if (value) qs.set(param, value);
    const q = qs.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  return (
    <div className="adm-seg">
      {options.map((o) => (
        <Link
          key={o.value}
          href={href(o.value)}
          data-active={current === o.value}
          scroll={false}
        >
          {o.label}
          {o.count !== undefined && <span className="num text-[11px] text-[var(--adm-ink-3)]">{o.count}</span>}
        </Link>
      ))}
    </div>
  );
}

/** Horizontal progress of an order through its states. A cancelled order shows as such. */
export function StatusTimeline({ steps, current }: { steps: { value: string; label: string }[]; current: string }) {
  if (current === "cancelado") {
    return (
      <div className="adm-alert adm-alert-danger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
        <span>Este pedido fue cancelado.</span>
      </div>
    );
  }
  const idx = steps.findIndex((s) => s.value === current);
  return (
    <ol className="flex items-center">
      {steps.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s.value} className={cx("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-2.5">
              <span
                className={cx(
                  "w-7 h-7 rounded-full grid place-items-center text-[12px] font-semibold shrink-0 transition",
                  done ? "bg-[var(--adm-ink)] text-white" : "bg-[#ebe8e1] text-[var(--adm-ink-3)]",
                  i === idx && "ring-4 ring-[rgba(22,23,27,.1)]",
                )}
              >
                {i < idx ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={cx("text-[13px] whitespace-nowrap", done ? "font-semibold text-[var(--adm-ink)]" : "text-[var(--adm-ink-3)]")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cx("flex-1 h-[2px] mx-3 rounded-full", i < idx ? "bg-[var(--adm-ink)]" : "bg-[#ebe8e1]")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
