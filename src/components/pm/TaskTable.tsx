import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, EmptyState, Pill } from "./ui";
import { TaskDialog } from "./forms";
import { formatDate, isOverdue, type Task } from "@/lib/pm";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TaskTable({
  tasks,
  showProject = true,
  empty,
}: {
  tasks: Task[];
  showProject?: boolean | undefined;
  empty?: { title: string; hint?: string | undefined };
}) {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const compact = state.settings.compactTables;

  if (tasks.length === 0)
    return <EmptyState title={empty?.title ?? "No tasks"} hint={empty?.hint} />;

  const member = (id: string | null) => state.members.find((m) => m.id === id);
  const project = (id: string) => state.projects.find((p) => p.id === id);
  const cell = compact ? "px-3 py-1.5" : "px-3 py-3";

  return (
    <>
      <div className="relative w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Tasks</caption>
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium cursor-pointer">
                Title
              </th>
              {/* {showProject && (
                <th scope="col" className="px-3 py-2 font-medium cursor-pointer">
                  Project
                </th>
              )} */}
              <th scope="col" className="px-3 py-2 font-medium cursor-pointer">
                Priority
              </th>
              <th scope="col" className="px-3 py-2 font-medium cursor-pointer">
                Assignee
              </th>
              <th scope="col" className="px-3 py-2 font-medium cursor-pointer">
                Due
              </th>
              <th scope="col" className="px-3 py-2 font-medium cursor-pointer">
                Status
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium cursor-pointer">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => {
              const p = project(t.projectId);
              const a = member(t.assigneeId);
              const overdue = isOverdue(t);
              return (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className={cn(cell, "font-medium")}>{t.title}</td>
                  {/* {showProject && (
                    <td className={cell}>
                      {p ? (
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: p.id }}
                          className="rounded text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {p.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </td>
                  )} */}
                  <td className={cell}>
                    <Pill value={t.priority} />
                  </td>
                  <td className={cell}>
                    <span className="flex items-center gap-2">
                      <Avatar name={a?.name ?? "—"} />
                      {a?.name ?? <span className="text-muted-foreground">Unassigned</span>}
                    </span>
                  </td>
                  <td
                    className={cn(
                      cell,
                      "whitespace-nowrap",
                      overdue && "font-medium text-destructive",
                    )}
                  >
                    {formatDate(t.dueDate)}
                    {overdue && <span className="ml-1 text-xs">(overdue)</span>}
                  </td>
                  <td className={cell}>
                    <Pill value={t.status} />
                  </td>
                  <td className={cn(cell, "text-right")}>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${t.title}`}
                        onClick={() => setEditing(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${t.title}`}
                        onClick={() => setDeleting(t)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TaskDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} task={editing} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  dispatch({ type: "task/delete", id: deleting.id });
                  toast.success("Task deleted");
                }
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
