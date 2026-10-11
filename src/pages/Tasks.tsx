import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskDialog } from "@/components/pm/forms";
import { TaskTable } from "@/components/pm/TaskTable";
import { LoadingState, NativeSelect, PageHeader } from "@/components/pm/ui";
import {
  LABELS,
  PRIORITIES,
  TASK_STATUSES,
  isOverdue,
  type Priority,
  type TaskStatus,
} from "@/lib/pm";
import { useStore } from "@/lib/store";

export function TasksPage() {
  const { state, ready } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all" | "overdue">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [project, setProject] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.tasks
      .filter(
        (t) =>
          (status === "all" || (status === "overdue" ? isOverdue(t) : t.status === status)) &&
          (priority === "all" || t.priority === priority) &&
          (project === "all" || t.projectId === project) &&
          (assignee === "all" ||
            (assignee === "none" ? !t.assigneeId : t.assigneeId === assignee)) &&
          (!term || t.title.toLowerCase().includes(term)),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [state.tasks, q, status, priority, project, assignee]);

  const active =
    q || status !== "all" || priority !== "all" || project !== "all" || assignee !== "all";
  const clear = () => {
    setQ("");
    setStatus("all");
    setPriority("all");
    setProject("all");
    setAssignee("all");
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description={`${filtered.length} of ${state.tasks.length} tasks shown`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        }
      />
      <div
        className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        role="search"
        aria-label="Filter tasks"
      >
        <div className="lg:col-span-1">
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <Input
            id="task-search"
            type="search"
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="f-status" className="sr-only">
            Status
          </label>
          <NativeSelect
            id="f-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">All statuses</option>
            <option value="overdue">Overdue</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-priority" className="sr-only">
            Priority
          </label>
          <NativeSelect
            id="f-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
          >
            <option value="all">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {LABELS[p]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-project" className="sr-only">
            Project
          </label>
          <NativeSelect id="f-project" value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="all">All projects</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-assignee" className="sr-only">
            Assignee
          </label>
          <NativeSelect
            id="f-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="all">Anyone</option>
            <option value="none">Unassigned</option>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      {active && (
        <Button variant="link" className="mb-2 px-0" onClick={clear}>
          Clear filters
        </Button>
      )}
      {!ready ? (
        <LoadingState label="Loading tasks" />
      ) : (
        <TaskTable
          tasks={filtered}
          empty={
            active
              ? { title: "No tasks match these filters", hint: "Adjust or clear the filters." }
              : { title: "No tasks yet", hint: "Create your first task to get started." }
          }
        />
      )}
      <TaskDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
