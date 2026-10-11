import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { FolderKanban, LayoutDashboard, ListChecks, Menu, Settings, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "./ui";
import taskFlowLogo from "@/assets/TaskFlow.png";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/projects", label: "Projects", icon: FolderKanban, exact: false },
  { to: "/tasks", label: "Tasks", icon: ListChecks, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {nav.map(({ to, label, icon: Icon, exact }) => (
        <li key={to}>
          <Link
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            activeProps={{
              className:
                "relative bg-sidebar-accent !text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
              "aria-current": "page",
            }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-display text-lg font-semibold text-sidebar-foreground no-underline"
    >
      <img
        src={taskFlowLogo}
        alt="TaskFlow"
        className="h-7 w-7 rounded-lg object-contain"
      />
      TaskFlow
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { state } = useStore();
  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-background lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <aside className="hidden h-screen flex-col gap-8 border-r border-sidebar-border bg-sidebar p-5 lg:sticky lg:top-0 lg:flex">
        <Brand />
        <nav aria-label="Main">
          <p className="mb-2 px-3 font-sidebar-subtitle text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <NavLinks />
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-lg border border-sidebar-border bg-card p-3 text-sm text-sidebar-foreground">
          <Avatar name={state.settings.name} />
          <div className="min-w-0">
            <p className="truncate font-medium">{state.settings.name || "Your profile"}</p>
            <p className="truncate text-xs text-muted-foreground">{state.settings.jobTitle}</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          className="rounded-md p-2 text-sidebar-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      <nav
        id="mobile-nav"
        aria-label="Main"
        className={cn(
          "sticky top-[57px] z-20 border-b border-sidebar-border bg-sidebar px-4 py-3 shadow-panel lg:hidden",
          !open && "hidden",
        )}
      >
        <NavLinks onNavigate={() => setOpen(false)} />
      </nav>

      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
