import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog, TaskDialog } from "@/components/pm/forms";
import { TaskTable } from "@/components/pm/TaskTable";
import {
  Avatar,
  EmptyState,
  LoadingState,
  PageHeader,
  Panel,
  Pill,
  ProgressBar,
} from "@/components/pm/ui";
import { formatDate, isOverdue, projectProgress } from "@/lib/pm";
import { useStore } from "@/lib/store";

export function ProjectDetail() {
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const { state, ready } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  if (!ready) return <LoadingState label="Loading project" />;
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        hint="It may have been removed or the link is incorrect."
        action={
          <Button asChild variant="outline">
            <Link to="/projects">Back to projects</Link>
          </Button>
        }
      />
    );
  }
  const tasks = state.tasks.filter((t) => t.projectId === project.id);
  const owner = state.members.find((m) => m.id === project.ownerId);
  const team = state.members.filter(
    (m) => project.memberIds.includes(m.id) || m.id === project.ownerId,
  );
  const progress = projectProgress(project.id, state.tasks);
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => isOverdue(t)).length;

  return (
    <>
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>
      <PageHeader
        title={project.name}
        description={project.description || "No description yet."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit project
            </Button>
            <Button onClick={() => setTaskOpen(true)}>
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Overview" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Pill value={project.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Owner</dt>
              <dd className="mt-1 text-sm font-medium">{owner?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Due date</dt>
              <dd className="mt-1 text-sm font-medium">{formatDate(project.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tasks</dt>
              <dd className="mt-1 text-sm font-medium">
                {done}/{tasks.length} done
                {overdue > 0 && <span className="ml-1 text-destructive">· {overdue} overdue</span>}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Progress</p>
            <ProgressBar value={progress} label="Project progress" />
          </div>
        </Panel>
        <Panel title="Team">
          {team.length === 0 ? (
            <EmptyState title="No team members" hint="Edit the project to add people." />
          ) : (
            <ul className="space-y-3">
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.name}
                      {m.id === project.ownerId && (
                        <span className="ml-1 text-xs text-primary">· Owner</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section className="mt-6" aria-labelledby="project-tasks">
        <h2 id="project-tasks" className="mb-3 font-display text-lg font-semibold">
          Tasks
        </h2>
        <TaskTable
          tasks={tasks}
          showProject={false}
          empty={{
            title: "No tasks in this project",
            hint: "Use “Add task” to create the first one.",
          }}
        />
      </section>

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} defaultProjectId={project.id} />
    </>
  );
}
