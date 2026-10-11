type TaskFlowErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type TaskFlowEvents = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: TaskFlowErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __TaskFlowEvents?: TaskFlowEvents;
    __TaskFlowReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

const MAX_SERIALIZED_LENGTH = 2000;

export function reportTaskFlowError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  window.__TaskFlowEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );

  const stack = error instanceof Error ? error.stack : undefined;

  window.__TaskFlowReportRuntimeError?.({
    message: describeThrown(error),
    ...(stack !== undefined ? { stack } : {}),
    filename: window.location.pathname,
  });
}

function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    const location = error.url ? ` at ${error.url}` : "";
    return `Response ${error.status}${location}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  const message = (error as { message?: unknown } | null)?.message;

  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  try {
    const serialized = JSON.stringify(error);

    if (serialized !== undefined) {
      return serialized.slice(0, MAX_SERIALIZED_LENGTH);
    }
  } catch {
    return String(error);
  }

  return String(error);
}