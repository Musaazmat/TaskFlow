import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, FolderKanban, ListTodo } from "lucide-react";
import { LoadingState, Panel, Pill, ProgressBar, EmptyState } from "@/components/pm/ui";
import { LABELS, TASK_STATUSES, formatDate, isOverdue, projectProgress, todayIso } from "@/lib/pm";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const barTone: Record<string, string> = {
  todo: "bg-muted-foreground/40",
  "in-progress": "bg-status-active",
  review: "bg-status-planning",
  done: "bg-status-done",
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function Dashboard() {
  const { state, ready } = useStore();
  if (!ready) return <LoadingState label="Loading dashboard" />;
  const { projects, tasks, activity } = state;
  const today = todayIso();
  const stats = [
    { label: "Total projects", value: projects.length, icon: FolderKanban, tone: "text-primary" },
    {
      label: "Active tasks",
      value: tasks.filter((t) => t.status !== "done").length,
      icon: ListTodo,
      tone: "text-status-active",
    },
    {
      label: "Completed tasks",
      value: tasks.filter((t) => t.status === "done").length,
      icon: CheckCircle2,
      tone: "text-status-done",
    },
    {
      label: "Overdue tasks",
      value: tasks.filter((t) => isOverdue(t, today)).length,
      icon: AlertTriangle,
      tone: "text-destructive",
    },
  ];
  const counts = TASK_STATUSES.map((s) => ({ s, n: tasks.filter((t) => t.status === s).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  return (
    <>
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">
          Welcome back{state.settings.name ? `, ${state.settings.name.split(" ")[0]}` : ""}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={cn("h-5 w-5", tone)} aria-hidden />
            </div>
            <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Project progress"
          className="lg:col-span-2"
          action={
            <Link to="/projects" className="text-sm text-primary hover:underline">
              View all
            </Link>
          }
        >
          {projects.length === 0 ? (
            <EmptyState title="No projects yet" />
          ) : (
            <ul className="space-y-4">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center sm:gap-6"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="truncate font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <Pill value={p.status} />
                  </div>
                  <ProgressBar value={projectProgress(p.id, tasks)} label={`${p.name} progress`} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Task status">
          <ul className="space-y-3" aria-label="Tasks by status">
            {counts.map(({ s, n }) => (
              <li key={s}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{LABELS[s]}</span>
                  <span className="tabular-nums text-muted-foreground">{n}</span>
                </div>
                <div className="h-3 rounded-full bg-muted">
                  <div
                    className={cn("h-3 rounded-full", barTone[s])}
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Upcoming deadlines" className="lg:col-span-2">
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nothing due soon"
              hint="Open tasks with future due dates appear here."
            />
          ) : (
            <ul className="divide-y">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {projects.find((p) => p.id === t.projectId)?.name ?? "Unknown project"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Pill value={t.priority} />
                    <span className="text-sm tabular-nums">{formatDate(t.dueDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity">
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ol className="space-y-3">
              {activity.slice(0, 7).map((a) => (
                <li key={a.id} className="border-l-2 border-primary/40 pl-3 text-sm">
                  <p>{a.message}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(a.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
