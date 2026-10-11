import { describe, expect, it } from "vitest";
import {
  createSeed,
  isOverdue,
  projectProgress,
  reducer,
  sanitizeState,
  validateSettings,
  validateTask,
  type TaskInput,
} from "@/lib/pm";

const base = new Date("2026-05-01T12:00:00");
const seed = () => createSeed(base);
const taskInput = (o: Partial<TaskInput> = {}): TaskInput => ({
  projectId: "p1",
  title: "Write spec",
  description: "",
  priority: "high",
  assigneeId: "m1",
  dueDate: "2026-05-10",
  status: "todo",
  ...o,
});

describe("task CRUD via reducer", () => {
  it("creates, updates and deletes a task and logs activity", () => {
    let s = reducer(seed(), {
      type: "task/create",
      input: taskInput({ title: "  Write spec  " }),
      id: "tx",
    });
    expect(s.tasks[0]).toMatchObject({ id: "tx", title: "Write spec" });
    expect(s.activity[0]?.message).toContain("Write spec");

    s = reducer(s, { type: "task/update", id: "tx", input: taskInput({ status: "done" }) });
    expect(s.tasks.find((t) => t.id === "tx")?.status).toBe("done");
    expect(s.activity[0]?.message).toContain("Done");

    s = reducer(s, { type: "task/delete", id: "tx" });
    expect(s.tasks.some((t) => t.id === "tx")).toBe(false);
  });

  it("ignores updates for unknown ids", () => {
    const s = seed();
    expect(reducer(s, { type: "task/update", id: "nope", input: taskInput() })).toBe(s);
  });
});

describe("validation", () => {
  it("requires title, project and due date", () => {
    const e = validateTask(taskInput({ title: " ", projectId: "", dueDate: "" }));
    expect(Object.keys(e).sort()).toEqual(["dueDate", "projectId", "title"]);
    expect(validateTask(taskInput())).toEqual({});
  });
  it("rejects invalid emails", () => {
    expect(validateSettings({ ...seed().settings, email: "bad" }).email).toBeDefined();
  });
});

describe("derived data", () => {
  it("computes progress and overdue status", () => {
    const s = seed();
    expect(projectProgress("p5", s.tasks)).toBe(100);
    expect(projectProgress("missing", s.tasks)).toBe(0);
    expect(isOverdue({ dueDate: "2026-04-01", status: "todo" }, "2026-05-01")).toBe(true);
    expect(isOverdue({ dueDate: "2026-04-01", status: "done" }, "2026-05-01")).toBe(false);
  });
  it("falls back safely on malformed persisted data", () => {
    const fb = seed();
    expect(sanitizeState("garbage", fb)).toBe(fb);
    const s = sanitizeState({ ...fb, tasks: [{ id: "x", status: "weird", priority: 5 }] }, fb);
    expect(s.tasks[0]).toMatchObject({ status: "todo", priority: "medium", assigneeId: null });
  });
});
