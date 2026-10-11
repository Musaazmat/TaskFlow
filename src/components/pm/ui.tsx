import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { LABELS, type Priority, type ProjectStatus, type TaskStatus } from "@/lib/pm";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 grid grid-cols-1 gap-4 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

export function Panel({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn("rounded-xl border bg-card p-5 shadow-panel", className)}
      aria-label={title}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const tone: Record<string, string> = {
  planning: "bg-status-planning/15 text-status-planning",
  active: "bg-status-active/15 text-status-active",
  "on-hold": "bg-status-hold/15 text-status-hold",
  completed: "bg-status-done/15 text-status-done",
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-status-active/15 text-status-active",
  review: "bg-status-planning/15 text-status-planning",
  done: "bg-status-done/15 text-status-done",
  low: "bg-status-done/15 text-status-done",
  medium: "bg-status-hold/15 text-status-hold",
  high: "bg-destructive/15 text-destructive",
  urgent: "bg-destructive/15 text-destructive border border-destructive/30",
};

export function Pill({
  value,
}: {
  value: ProjectStatus | TaskStatus | Priority;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone[value],
      )}
    >
      {LABELS[value] ?? value}
    </span>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {progress}%
      </span>
    </div>
  );
}

export function Avatar({
  name,
}: {
  name?: string | null;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      aria-hidden
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground"
    >
      {initials}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center" role="status">
      <p className="font-medium">{title}</p>

      {hint && (
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>

      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-xl bg-muted"
        />
      ))}
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      {children}

      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          className="text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function NativeSelect({
  className,
  invalid,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
}) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive",
        className,
      )}
    />
  );
}