// Domain types, seed data, validation and the pure reducer for the PM app.
// Kept framework-free so it can be unit tested in isolation.

export type ProjectStatus = "planning" | "active" | "on-hold" | "completed";
export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Member {
  id: string;
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  dueDate: string; // yyyy-mm-dd
  memberIds: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  assigneeId: string | null;
  dueDate: string;
  status: TaskStatus;
}

export interface Activity {
  id: string;
  message: string;
  at: string;
}

export interface Settings {
  name: string;
  email: string;
  jobTitle: string;
  emailNotifications: boolean;
  weeklyDigest: boolean;
  compactTables: boolean;
  weekStartsOn: "monday" | "sunday";
}

export interface AppState {
  members: Member[];
  projects: Project[];
  tasks: Task[];
  activity: Activity[];
  settings: Settings;
}

export const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on-hold", "completed"];
export const TASK_STATUSES: TaskStatus[] = ["todo", "in-progress", "review", "done"];
export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export const LABELS: Record<ProjectStatus | TaskStatus | Priority, string> = {
  planning: "Planning",
  active: "Active",
  "on-hold": "On hold",
  completed: "Completed",
  todo: "To do",
  "in-progress": "In progress",
  review: "In review",
  done: "Done",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const isoDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const daysFromToday = (n: number, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return isoDay(d);
};

export const todayIso = () => isoDay(new Date());

export function isOverdue(t: Pick<Task, "dueDate" | "status">, today = todayIso()) {
  return t.status !== "done" && !!t.dueDate && t.dueDate < today;
}

export function projectProgress(projectId: string, tasks: Task[]) {
  const own = tasks.filter((t) => t.projectId === projectId);
  if (own.length === 0) return 0;
  return Math.round((own.filter((t) => t.status === "done").length / own.length) * 100);
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ---------------- validation ---------------- */

export type Errors<T> = Partial<Record<keyof T, string>>;
export type ProjectInput = Omit<Project, "id" | "createdAt">;
export type TaskInput = Omit<Task, "id">;

export function validateProject(p: ProjectInput): Errors<ProjectInput> {
  const e: Errors<ProjectInput> = {};
  if (!p.name.trim()) e.name = "Project name is required.";
  else if (p.name.trim().length > 80) e.name = "Keep the name under 80 characters.";
  if (!p.ownerId) e.ownerId = "Choose an owner.";
  if (!p.dueDate) e.dueDate = "Due date is required.";
  if (!PROJECT_STATUSES.includes(p.status)) e.status = "Choose a valid status.";
  return e;
}

export function validateTask(t: TaskInput): Errors<TaskInput> {
  const e: Errors<TaskInput> = {};
  if (!t.title.trim()) e.title = "Task title is required.";
  else if (t.title.trim().length > 120) e.title = "Keep the title under 120 characters.";
  if (!t.projectId) e.projectId = "Choose a project.";
  if (!t.dueDate) e.dueDate = "Due date is required.";
  if (!PRIORITIES.includes(t.priority)) e.priority = "Choose a priority.";
  if (!TASK_STATUSES.includes(t.status)) e.status = "Choose a status.";
  return e;
}

export function validateSettings(s: Settings): Errors<Settings> {
  const e: Errors<Settings> = {};
  if (!s.name.trim()) e.name = "Name is required.";
  if (!s.email.trim()) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim()))
    e.email = "Enter a valid email address.";
  return e;
}

export const hasErrors = (e: object) => Object.keys(e).length > 0;

/* ---------------- reducer ---------------- */

export type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "project/create"; input: ProjectInput; id?: string }
  | { type: "project/update"; id: string; input: ProjectInput }
  | { type: "task/create"; input: TaskInput; id?: string }
  | { type: "task/update"; id: string; input: TaskInput }
  | { type: "task/delete"; id: string }
  | { type: "settings/update"; settings: Settings }
  | { type: "reset"; state: AppState };

const log = (state: AppState, message: string): Activity[] =>
  [{ id: uid("a"), message, at: new Date().toISOString() }, ...state.activity].slice(0, 30);

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
    case "reset":
      return action.state;
    case "project/create": {
      const project: Project = {
        ...action.input,
        name: action.input.name.trim(),
        id: action.id ?? uid("p"),
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        projects: [project, ...state.projects],
        activity: log(state, `Project “${project.name}” created`),
      };
    }
    case "project/update": {
      if (!state.projects.some((p) => p.id === action.id)) return state;
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, ...action.input, name: action.input.name.trim() } : p,
        ),
        activity: log(state, `Project “${action.input.name.trim()}” updated`),
      };
    }
    case "task/create": {
      const task: Task = {
        ...action.input,
        title: action.input.title.trim(),
        id: action.id ?? uid("t"),
      };
      return {
        ...state,
        tasks: [task, ...state.tasks],
        activity: log(state, `Task “${task.title}” added`),
      };
    }
    case "task/update": {
      const prev = state.tasks.find((t) => t.id === action.id);
      if (!prev) return state;
      const msg =
        prev.status !== action.input.status
          ? `Task “${action.input.title.trim()}” moved to ${LABELS[action.input.status]}`
          : `Task “${action.input.title.trim()}” updated`;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.input, title: action.input.title.trim() } : t,
        ),
        activity: log(state, msg),
      };
    }
    case "task/delete": {
      const t = state.tasks.find((x) => x.id === action.id);
      if (!t) return state;
      return {
        ...state,
        tasks: state.tasks.filter((x) => x.id !== action.id),
        activity: log(state, `Task “${t.title}” deleted`),
      };
    }
    case "settings/update":
      return {
        ...state,
        settings: action.settings,
        activity: log(state, "Profile settings updated"),
      };
    default:
      return state;
  }
}

/* ---------------- safe parsing of persisted data ---------------- */

type Key =
  | "members"
  | "projects"
  | "tasks"
  | "activity"
  | "settings"
  | "id"
  | "name"
  | "role"
  | "description"
  | "status"
  | "ownerId"
  | "dueDate"
  | "memberIds"
  | "createdAt"
  | "projectId"
  | "title"
  | "priority"
  | "assigneeId"
  | "message"
  | "at"
  | "email"
  | "jobTitle"
  | "emailNotifications"
  | "weeklyDigest"
  | "compactTables"
  | "weekStartsOn";
type Rec = Partial<Record<Key, unknown>>;
const isObj = (v: unknown): v is Rec => typeof v === "object" && v !== null;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

export function sanitizeState(raw: unknown, fallback: AppState): AppState {
  if (!isObj(raw)) return fallback;
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : null);
  const members = arr(raw.members);
  const projects = arr(raw.projects);
  const tasks = arr(raw.tasks);
  if (!members || !projects || !tasks) return fallback;
  const s: Rec = isObj(raw.settings) ? raw.settings : {};
  return {
    members: members.map((m) => ({
      id: str(m.id, uid("m")),
      name: str(m.name, "Unknown"),
      role: str(m.role),
    })),
    projects: projects.map((p) => ({
      id: str(p.id, uid("p")),
      name: str(p.name, "Untitled project"),
      description: str(p.description),
      status: PROJECT_STATUSES.includes(p.status as ProjectStatus)
        ? (p.status as ProjectStatus)
        : "planning",
      ownerId: str(p.ownerId),
      dueDate: str(p.dueDate),
      memberIds: Array.isArray(p.memberIds)
        ? p.memberIds.filter((x): x is string => typeof x === "string")
        : [],
      createdAt: str(p.createdAt, new Date().toISOString()),
    })),
    tasks: tasks.map((t) => ({
      id: str(t.id, uid("t")),
      projectId: str(t.projectId),
      title: str(t.title, "Untitled task"),
      description: str(t.description),
      priority: PRIORITIES.includes(t.priority as Priority) ? (t.priority as Priority) : "medium",
      assigneeId: typeof t.assigneeId === "string" ? t.assigneeId : null,
      dueDate: str(t.dueDate),
      status: TASK_STATUSES.includes(t.status as TaskStatus) ? (t.status as TaskStatus) : "todo",
    })),
    activity: (arr(raw.activity) ?? []).map((a) => ({
      id: str(a.id, uid("a")),
      message: str(a.message),
      at: str(a.at),
    })),
    settings: {
      ...fallback.settings,
      name: str(s.name, fallback.settings.name),
      email: str(s.email, fallback.settings.email),
      jobTitle: str(s.jobTitle, fallback.settings.jobTitle),
      emailNotifications:
        typeof s.emailNotifications === "boolean"
          ? s.emailNotifications
          : fallback.settings.emailNotifications,
      weeklyDigest:
        typeof s.weeklyDigest === "boolean" ? s.weeklyDigest : fallback.settings.weeklyDigest,
      compactTables:
        typeof s.compactTables === "boolean" ? s.compactTables : fallback.settings.compactTables,
      weekStartsOn: s.weekStartsOn === "sunday" ? "sunday" : "monday",
    },
  };
}

/* ---------------- seed ---------------- */

export function createSeed(base = new Date()): AppState {
  const d = (n: number) => daysFromToday(n, base);
  const members: Member[] = [
    { id: "m1", name: "Aisha Khan", role: "Product Lead" },
    { id: "m2", name: "Marco Rossi", role: "Frontend Engineer" },
    { id: "m3", name: "Lena Fischer", role: "Product Designer" },
    { id: "m4", name: "David Okafor", role: "Backend Engineer" },
    { id: "m5", name: "Priya Nair", role: "QA Engineer" },
  ];
  const projects: Project[] = [
    {
      id: "p1",
      name: "Mobile App Redesign",
      description: "Refresh the iOS and Android experience with the new design language.",
      status: "active",
      ownerId: "m3",
      dueDate: d(21),
      memberIds: ["m2", "m3", "m5"],
      createdAt: d(-40),
    },
    {
      id: "p2",
      name: "Billing Platform v2",
      description: "Migrate invoicing to usage-based billing with proration support.",
      status: "active",
      ownerId: "m4",
      dueDate: d(9),
      memberIds: ["m1", "m4"],
      createdAt: d(-60),
    },
    {
      id: "p3",
      name: "Customer Onboarding",
      description: "Guided setup flow and in-app checklist for new workspaces.",
      status: "planning",
      ownerId: "m1",
      dueDate: d(45),
      memberIds: ["m1", "m2", "m3"],
      createdAt: d(-10),
    },
    {
      id: "p4",
      name: "Analytics Dashboard",
      description: "Self-serve reporting for team admins.",
      status: "on-hold",
      ownerId: "m2",
      dueDate: d(-3),
      memberIds: ["m2", "m4"],
      createdAt: d(-75),
    },
    {
      id: "p5",
      name: "Security Audit 2026",
      description: "SOC 2 readiness review and remediation.",
      status: "completed",
      ownerId: "m5",
      dueDate: d(-12),
      memberIds: ["m4", "m5"],
      createdAt: d(-90),
    },
  ];
  const t = (
    id: string,
    projectId: string,
    title: string,
    priority: Priority,
    assigneeId: string | null,
    due: number,
    status: TaskStatus,
  ): Task => ({
    id,
    projectId,
    title,
    description: "",
    priority,
    assigneeId,
    dueDate: d(due),
    status,
  });
  const tasks: Task[] = [
    t("t1", "p1", "Audit current navigation patterns", "medium", "m3", -8, "done"),
    t("t2", "p1", "Design new tab bar", "high", "m3", 2, "review"),
    t("t3", "p1", "Implement theming tokens", "high", "m2", 5, "in-progress"),
    t("t4", "p1", "Regression test checkout flow", "medium", "m5", 14, "todo"),
    t("t5", "p2", "Usage metering service", "urgent", "m4", -2, "in-progress"),
    t("t6", "p2", "Proration edge cases", "high", "m4", 4, "todo"),
    t("t7", "p2", "Invoice PDF template", "low", "m1", -5, "done"),
    t("t8", "p3", "Write onboarding copy", "medium", "m1", 12, "todo"),
    t("t9", "p3", "Checklist component", "medium", "m2", 18, "todo"),
    t("t10", "p4", "Define KPI catalogue", "medium", "m2", -6, "review"),
    t("t11", "p4", "Query performance spike", "high", "m4", -1, "todo"),
    t("t12", "p5", "Access review", "high", "m5", -20, "done"),
    t("t13", "p5", "Pen test remediation", "urgent", "m4", -14, "done"),
    t("t14", "p1", "Accessibility pass", "medium", null, 7, "todo"),
  ];
  const now = base.getTime();
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
  return {
    members,
    projects,
    tasks,
    activity: [
      { id: "a1", message: "Lena moved “Design new tab bar” to In review", at: ago(2) },
      { id: "a2", message: "David started “Usage metering service”", at: ago(6) },
      { id: "a3", message: "Aisha created project “Customer Onboarding”", at: ago(30) },
      { id: "a4", message: "Priya completed “Access review”", at: ago(72) },
    ],
    settings: {
      name: "Musaazmat Musani",
      email: "musaniazmat@gmail.com",
      jobTitle: "Product Lead",
      emailNotifications: true,
      weeklyDigest: false,
      compactTables: false,
      weekStartsOn: "monday",
    },
  };
}
