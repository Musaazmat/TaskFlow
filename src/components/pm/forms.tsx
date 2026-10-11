import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, NativeSelect } from "./ui";
import {
  LABELS,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  daysFromToday,
  hasErrors,
  validateProject,
  validateTask,
  type Errors,
  type Project,
  type ProjectInput,
  type Task,
  type TaskInput,
} from "@/lib/pm";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const emptyProject = (): ProjectInput => ({
  name: "",
  description: "",
  status: "planning",
  ownerId: "",
  dueDate: daysFromToday(30),
  memberIds: [],
});

export function ProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}) {
  const { state, dispatch } = useStore();
  const [form, setForm] = useState<ProjectInput>(emptyProject);
  const [errors, setErrors] = useState<Errors<ProjectInput>>({});

  useEffect(() => {
    if (!open) return;

    setErrors({});

    if (project) {
      const { id, createdAt, ...projectData } = project;
      setForm(projectData);
    } else {
      setForm(emptyProject());
    }
  }, [open, project]);

  const set = <K extends keyof ProjectInput>(
    key: K,
    value: ProjectInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateProject(form);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (project) {
      dispatch({
        type: "project/update",
        id: project.id,
        input: form,
      });
      toast.success("Project updated");
    } else {
      dispatch({
        type: "project/create",
        input: form,
      });
      toast.success("Project created");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit project" : "New project"}
          </DialogTitle>
          <DialogDescription>
            Fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <Field id="p-name" label="Name *" error={errors.name}>
            <Input
              id="p-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={
                errors.name ? "p-name-error" : undefined
              }
            />
          </Field>

          <Field id="p-desc" label="Description">
            <Textarea
              id="p-desc"
              rows={3}
              value={form.description}
              onChange={(event) =>
                set("description", event.target.value)
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="p-status"
              label="Status *"
              error={errors.status}
            >
              <NativeSelect
                id="p-status"
                value={form.status}
                onChange={(event) =>
                  set(
                    "status",
                    event.target.value as ProjectInput["status"],
                  )
                }
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LABELS[status]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              id="p-due"
              label="Due date *"
              error={errors.dueDate}
            >
              <Input
                id="p-due"
                type="date"
                value={form.dueDate}
                onChange={(event) => set("dueDate", event.target.value)}
                aria-invalid={!!errors.dueDate}
              />
            </Field>
          </div>

          <Field
            id="p-owner"
            label="Owner *"
            error={errors.ownerId}
          >
            <NativeSelect
              id="p-owner"
              value={form.ownerId}
              invalid={!!errors.ownerId}
              onChange={(event) => set("ownerId", event.target.value)}
            >
              <option value="">Select owner…</option>
              {state.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Team members
            </legend>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {state.members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={form.memberIds.includes(member.id)}
                    onChange={(event) => {
                      const memberIds = event.target.checked
                        ? [...form.memberIds, member.id]
                        : form.memberIds.filter(
                            (id) => id !== member.id,
                          );

                      set("memberIds", memberIds);
                    }}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
}) {
  const { state, dispatch } = useStore();

  const blank = (): TaskInput => ({
    projectId: defaultProjectId ?? "",
    title: "",
    description: "",
    priority: "medium",
    assigneeId: null,
    dueDate: daysFromToday(7),
    status: "todo",
  });

  const [form, setForm] = useState<TaskInput>(blank);
  const [errors, setErrors] = useState<Errors<TaskInput>>({});

  useEffect(() => {
    if (!open) return;

    setErrors({});

    if (task) {
      const { id, ...taskData } = task;
      setForm(taskData);
    } else {
      setForm(blank());
    }
  }, [open, task]);

  const set = <K extends keyof TaskInput>(
    key: K,
    value: TaskInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateTask(form);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (task) {
      dispatch({
        type: "task/update",
        id: task.id,
        input: form,
      });
      toast.success("Task updated");
    } else {
      dispatch({
        type: "task/create",
        input: form,
      });
      toast.success("Task created");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {task ? "Edit task" : "New task"}
          </DialogTitle>
          <DialogDescription>
            Fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <Field id="t-title" label="Title *" error={errors.title}>
            <Input
              id="t-title"
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? "t-title-error" : undefined
              }
            />
          </Field>

          {/* <Field
            id="t-project"
            label="Project *"
            error={errors.projectId}
          >
            <NativeSelect
              id="t-project"
              value={form.projectId}
              invalid={!!errors.projectId}
              onChange={(event) =>
                set("projectId", event.target.value)
              }
            >
              <option value="">Select project…</option>
              {state.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </NativeSelect>
          </Field> */}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="t-priority"
              label="Priority *"
              error={errors.priority}
            >
              <NativeSelect
                id="t-priority"
                value={form.priority}
                onChange={(event) =>
                  set(
                    "priority",
                    event.target.value as TaskInput["priority"],
                  )
                }
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {LABELS[priority]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              id="t-status"
              label="Status *"
              error={errors.status}
            >
              <NativeSelect
                id="t-status"
                value={form.status}
                onChange={(event) =>
                  set(
                    "status",
                    event.target.value as TaskInput["status"],
                  )
                }
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LABELS[status]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field id="t-assignee" label="Assignee">
              <NativeSelect
                id="t-assignee"
                value={form.assigneeId ?? ""}
                onChange={(event) =>
                  set("assigneeId", event.target.value || null)
                }
              >
                <option value="">Unassigned</option>
                {state.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              id="t-due"
              label="Due date *"
              error={errors.dueDate}
            >
              <Input
                id="t-due"
                type="date"
                value={form.dueDate}
                onChange={(event) => set("dueDate", event.target.value)}
                aria-invalid={!!errors.dueDate}
              />
            </Field>
          </div>

          <Field id="t-desc" label="Description">
            <Textarea
              id="t-desc"
              rows={3}
              value={form.description}
              onChange={(event) =>
                set("description", event.target.value)
              }
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}