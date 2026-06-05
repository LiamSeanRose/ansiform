# Curated task library

Each task is a single self-contained folder under `src/tasks/<slug>/`. The
registry (`registry.ts`) discovers tasks with `import.meta.glob`, and the router
serves them all through one dynamic `/tasks/:task` route — so **adding a task is
adding a folder. You never edit a shared index, the router, the home page, or the
global i18n catalogue.** That is what keeps the wave-3 fan-out (#7–#11)
conflict-free.

## How auto-registration works

1. `registry.ts` runs `import.meta.glob('./*/task.ts', { eager: true })`, which
   Vite (and Vitest) resolve at build time into a map of every task module.
2. Each module's `default` export is a `TaskModule`; the registry keys it by
   `task.slug`.
3. `HomePage` lists `listTasks()`; `TaskPage` resolves the `:task` slug with
   `getTask(slug)` and renders the `TaskWorkbench`. No per-task routes exist.

## Add a task (clone this checklist)

1. Create `src/tasks/<slug>/task.ts`.
2. `export default` a `TaskModule` (`./types.ts`):
   - `task`: a `TaskDefinition` (`../core`) — `slug`, `title`, `description`
     (the SEO atom: H1, document title, meta), `schema`, `template`, and an
     optional `defaultScope` for the suggested `group_vars`/`host_vars` path.
   - `messages.en`: the task-local copy. Field labels/help, group legends, and
     select-option labels in the schema are **i18n keys**; their English text
     lives here, co-located with the task. (Other locales — e.g. the FR pass,
     #16 — can be added under the same `messages` map later.)
3. Use only filters the registry marks `exact` (`../core/filters`) if you want a
   byte-faithful preview with no degradation notice. Any unknown or
   `approximate`/`unsupported` filter makes the preview advertise "may differ" —
   the YAML output stays correct regardless.
4. Add tests next to the task (`task.test.ts`): assert the template renders the
   expected device CLI at `exact` fidelity and that the YAML output is correct
   (including `omitWhenBlank` behaviour). `registry.test.ts` already enforces
   that every schema key has matching `en` copy.

See `interface-ip/` for the reference implementation.
