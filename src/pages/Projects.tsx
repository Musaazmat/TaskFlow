import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectDialog } from "@/components/pm/forms";
import {
  Avatar,
  EmptyState,
  LoadingState,
  NativeSelect,
  PageHeader,
  Pill,
  ProgressBar,
} from "@/components/pm/ui";
import {
  LABELS,
  PROJECT_STATUSES,
  formatDate,
  projectProgress,
  type Project,
  type ProjectStatus,
} from "@/lib/pm";
import { useStore } from "@/lib/store";

type SortKey = "name" | "status" | "progress" | "owner" | "dueDate";

export function ProjectsPage() {
  const { state, ready } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "dueDate", dir: 1 });
  const [dialog, setDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null,
  });

  const rows = useMemo(() => {
    const owner = (id: string) => state.members.find((m) => m.id === id)?.name ?? "";
    const enriched = state.projects.map((p) => ({
      p,
      progress: projectProgress(p.id, state.tasks),
      owner: owner(p.ownerId),
    }));
    const term = q.trim().toLowerCase();
    return enriched
      .filter(
        (r) =>
          (status === "all" || r.p.status === status) &&
          (!term || r.p.name.toLowerCase().includes(term) || r.owner.toLowerCase().includes(term)),
      )
      .sort((a, b) => {
        const v = (r: typeof a) =>
          sort.key === "progress" ? r.progress : sort.key === "owner" ? r.owner : r.p[sort.key];
        const x = v(a),
          y = v(b);
        return (
          (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y))) * sort.dir
        );
      });
  }, [state, q, status, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));
  const th = (key: SortKey, label: string) => (
    <th
      scope="col"
      className="px-3 py-2 font-medium"
      aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => toggle(key)}
        className="inline-flex items-center gap-1 rounded uppercase hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        {label}
        {sort.key === key &&
          (sort.dir === 1 ? (
            <ArrowUp className="h-3 w-3" aria-hidden />
          ) : (
            <ArrowDown className="h-3 w-3" aria-hidden />
          ))}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${state.projects.length} projects in your workspace`}
        actions={
          <Button onClick={() => setDialog({ open: true, project: null })}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div>
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <Input
            id="project-search"
            type="search"
            placeholder="Search by name or owner…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="project-status" className="sr-only">
            Filter by status
          </label>
          <NativeSelect
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus | "all")}
          >
            <option value="all">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {!ready ? (
        <LoadingState label="Loading projects" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No projects match"
          hint="Try a different search or status filter."
          action={
            (q || status !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setQ("");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="relative w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Projects</caption>
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {th("name", "Name")}
                {th("status", "Status")}
                {th("progress", "Progress")}
                {th("owner", "Owner")}
                {th("dueDate", "Due")}
                <th className="px-3 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(({ p, progress, owner }) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3 font-medium">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <Pill value={p.status} />
                  </td>
                  <td className="w-48 px-3 py-3">
                    <ProgressBar value={progress} label={`${p.name} progress`} />
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar name={owner || "?"} />
                      {owner || <span className="text-muted-foreground">Unassigned</span>}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{formatDate(p.dueDate)}</td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => setDialog({ open: true, project: p })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ProjectDialog
        open={dialog.open}
        project={dialog.project}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}
