import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Navigate,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { AppShell } from "@/components/pm/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";
import { reportTaskFlowError } from "./lib/taskflow-error-reporting";

import { Dashboard } from "@/pages/Dashboard";
import { ProjectDetail } from "@/pages/ProjectDetails";
import { ProjectsPage } from "@/pages/Projects";
import { SettingsPage } from "@/pages/Settings";
import { TasksPage } from "@/pages/Tasks";

// Sets the browser tab title for a page
function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return <>{children}</>;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportTaskFlowError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster richColors position="bottom-left" />
      </StoreProvider>
    </QueryClientProvider>
  );
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <PageTitle title="Dashboard — TaskFlow Projects">
      <Dashboard />
    </PageTitle>
  ),
});

// const dashboardAliasRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: "/dashboard",
//   component: () => (
//     <PageTitle title="Dashboard — TaskFlow Projects">
//       <Dashboard />
//     </PageTitle>
//   ),
// });
const dashboardAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => <Navigate to="/" replace />,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: () => (
    <PageTitle title="Projects — TaskFlow Projects">
      <ProjectsPage />
    </PageTitle>
  ),
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  component: () => (
    <PageTitle title="Project details — TaskFlow Projects">
      <ProjectDetail />
    </PageTitle>
  ),
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tasks",
  component: () => (
    <PageTitle title="Tasks — TaskFlow Projects">
      <TasksPage />
    </PageTitle>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <PageTitle title="Settings — TaskFlow Projects">
      <SettingsPage />
    </PageTitle>
  ),
});

export const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dashboardAliasRoute,
  projectsRoute,
  projectDetailRoute,
  tasksRoute,
  settingsRoute,
]);

export const getRouter = () =>
  createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

// Keep navigation and URL parameters
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
