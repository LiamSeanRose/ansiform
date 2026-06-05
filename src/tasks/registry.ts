/**
 * Curated task registry + auto-registration (issue #6).
 *
 * This is the mechanism that makes the wave-3 fan-out (#7–#11) conflict-free: a
 * task is discovered purely by *existing on disk*. `import.meta.glob` collects
 * every `src/tasks/<slug>/task.ts` at build time, so adding a task is adding a
 * folder — no edit to this file, to the router, or to the home page. The router
 * already serves every task through one dynamic `/tasks/:task` route that looks
 * the slug up here (see `App.tsx` / `pages/TaskPage.tsx`).
 *
 * The pattern is documented for task authors in `src/tasks/README.md`.
 */
import type { TaskSummary } from '../core';
import type { TaskModule } from './types';

// Eager so the registry is ready synchronously at module load — the router needs
// the listing without awaiting. Vite (and Vitest) resolve this glob at build.
const modules = import.meta.glob<{ default: TaskModule }>('./*/task.ts', { eager: true });

const registry: Map<string, TaskModule> = buildRegistry();

function buildRegistry(): Map<string, TaskModule> {
  const map = new Map<string, TaskModule>();
  for (const path of Object.keys(modules)) {
    const mod = modules[path]?.default;
    if (!mod) continue;
    const slug = mod.task.slug;
    if (map.has(slug)) {
      // Two folders claiming one slug is a packaging bug — fail loudly rather
      // than silently shadowing one task with another.
      throw new Error(`Duplicate task slug "${slug}" (from ${path})`);
    }
    map.set(slug, mod);
  }
  return map;
}

/** All tasks as lightweight summaries, sorted by title for a stable listing. */
export function listTasks(): TaskSummary[] {
  return [...registry.values()]
    .map(({ task }) => ({ slug: task.slug, title: task.title, description: task.description }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Look up a full task module by slug, or `undefined` if no folder claims it. */
export function getTask(slug: string): TaskModule | undefined {
  return registry.get(slug);
}
