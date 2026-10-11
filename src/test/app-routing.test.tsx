import { describe, expect, it } from "vitest";

import { getRouter } from "@/router";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it.each(["/", "/projects", "/projects/$projectId", "/tasks", "/settings"])(
    "matches the existing page for %s",
    (routeId) => {
      const router = getRouter();
      const path = routeId.replace("$projectId", "p5");
      const matches = router.matchRoutes(path);

      expect(matches.at(-1)?.routeId).toBe(routeId);
    },
  );

  it("preserves the project details URL parameter", () => {
    const matches = getRouter().matchRoutes("/projects/p5");
    expect(matches.at(-1)?.params).toEqual({ projectId: "p5" });
  });
});
