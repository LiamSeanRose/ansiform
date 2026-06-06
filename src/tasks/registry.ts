/**
 * Curated-task registry + auto-registration loader (issue #6).
 *
 * **The conflict-free fan-out mechanism (wave 3, #7–#11).** Tasks are discovered
 * with Vite's `import.meta.glob`, so adding a task is *only* adding a folder:
 *
 *   src/tasks/<slug>/index.ts   →   export const task: TaskModule = { … }
 *
 * No edit to this file, no shared index, no registration call. Because each task
 * owns a disjoint folder, five agents can add #7–#11 in parallel without ever
 * touching the same file. See `src/tasks/README.md` for the authoring guide.
 *
 * i18n note: a task carries its own copy in `messages` (label/help/legend keys
 * referenced by its schema), so task strings live in the task folder rather than
 * the global `en.ts` — that is what keeps the fan-out free of shared-file edits.
 * Global chrome copy (form/preview/workbench) still lives in `en.ts`.
 */
import type { Locale } from '../i18n';
import type { TaskDefinition, TaskSummary } from '../core';

/** Flat key → string map for one locale's task-scoped copy. */
export type TaskMessages = Record<string, string>;

/** What each `src/tasks/<slug>/index.ts` exports as `task`. */
export interface TaskModule {
  /** The correct-by-construction schema + preview template (council §3). */
  definition: TaskDefinition;
  /** Task-scoped copy by locale; `en` is required, others optional (FR is #16). */
  messages: Partial<Record<Locale, TaskMessages>> & { en: TaskMessages };
}

// Eagerly glob every task folder's entry point. Eager (not lazy) so routing and
// the home listing are synchronous — no loading state for a bundled library.
const loaded = import.meta.glob<{ task?: TaskModule }>('./*/index.ts', { eager: true });

const bySlug = new Map<string, TaskModule>();
for (const path of Object.keys(loaded).sort()) {
  const mod = loaded[path]?.task;
  if (mod) bySlug.set(mod.definition.slug, mod);
}

/** Look up a full task module by slug, or `undefined` if unknown. */
export function getTaskModule(slug: string): TaskModule | undefined {
  return bySlug.get(slug);
}

/** All tasks as lightweight summaries, sorted by title (for the home listing). */
export function listTaskSummaries(): TaskSummary[] {
  return [...bySlug.values()]
    .map(({ definition }) => ({
      slug: definition.slug,
      title: definition.title,
      description: definition.description,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Resolve a task's copy for a locale, falling back to English. */
export function taskMessages(mod: TaskModule, locale: Locale): TaskMessages {
  return mod.messages[locale] ?? mod.messages.en;
}
