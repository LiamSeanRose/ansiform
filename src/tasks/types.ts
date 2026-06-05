/**
 * Tasks-layer contracts (issue #6).
 *
 * The core task shape (`TaskDefinition`) is frozen in `../core` (#1). This module
 * adds only what the integration layer needs to make the curated library
 * *conflict-free to extend*: a `TaskModule` bundles the definition with its own
 * co-located UI copy, so adding a task is adding one folder under
 * `src/tasks/<slug>/` — never an edit to a shared index, catalogue, or router
 * (see `registry.ts` and `src/tasks/README.md`).
 */
import type { TaskDefinition } from '../core';
import type { Locale } from '../i18n';

/**
 * A self-contained task: the definition plus its task-local message bundles.
 *
 * Field labels/help, group legends, and select-option labels in the schema are
 * i18n *keys*; their text lives here, co-located with the task, so wave-3 tasks
 * (#7–#11) never touch the global catalogue. `en` is the source locale and must
 * cover every key the schema references (enforced by `registry.test.ts`);
 * additional locales (e.g. the FR pass, #16) can be added later, still without
 * editing any shared file.
 */
export interface TaskModule {
  task: TaskDefinition;
  messages: Partial<Record<Locale, Record<string, string>>>;
}
