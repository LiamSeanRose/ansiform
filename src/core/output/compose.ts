/**
 * Composition: assemble many task instances into a multi-file var tree (#26).
 *
 * The composition session lets a user fill several tasks at once and emit a real
 * `group_vars/`+`host_vars/` **file set** — NOT a merged or runnable playbook.
 * Each instance routes to a scope (→ a file path); instances that target the
 * same file are merged into one document.
 *
 * Correctness spine (council §4): merging never silently overwrites. When two
 * instances define the **same top-level key** for the same file, that key is
 * reported as a **collision** (by name only — never the value) so the UI can show
 * it; the user resolves it. A silent last-write-wins merge would be as dangerous
 * as a silently-wrong preview. Each instance's vars are built by the same
 * always-correct path as the single-file YAML sink (`buildVars`).
 */
import type { FormSchema, FormValues } from '../types';
import type { TaskScope } from '../tasks/types';
import { buildVars, suggestFilename, toYaml } from './yaml';

/** One filled task in the session, with the scope its vars route to. */
export interface CompositionInstance {
  schema: FormSchema;
  values: FormValues;
  scope: TaskScope;
}

/** One resolved var-file in the composed tree. */
export interface ComposedFile {
  /** Suggested path, e.g. `group_vars/all.yml` or `host_vars/router1.yml`. */
  path: string;
  /** Byte-correct YAML for the merged vars at this path. */
  content: string;
  /** Top-level keys defined by more than one instance at this path (names only). */
  collisions: string[];
}

/** The composed multi-file result. */
export interface ComposedTree {
  files: ComposedFile[];
  /** True if any file has a key collision the user must resolve. */
  hasCollisions: boolean;
}

/**
 * Compose instances into a per-path file tree. Files appear in first-seen path
 * order; within a file, keys appear in instance-then-field order. Collisions are
 * detected but still merged (last value kept) so output is never empty — the UI
 * must surface `collisions` visibly so the result is never silently wrong.
 */
export function composeTree(instances: readonly CompositionInstance[]): ComposedTree {
  const order: string[] = [];
  const byPath = new Map<string, { vars: Record<string, unknown>; seen: Set<string>; collisions: Set<string> }>();

  for (const instance of instances) {
    const path = suggestFilename(instance.scope);
    const vars = buildVars(instance.schema, instance.values);
    let entry = byPath.get(path);
    if (!entry) {
      entry = { vars: {}, seen: new Set(), collisions: new Set() };
      byPath.set(path, entry);
      order.push(path);
    }
    for (const [key, value] of Object.entries(vars)) {
      if (entry.seen.has(key)) entry.collisions.add(key);
      entry.seen.add(key);
      entry.vars[key] = value;
    }
  }

  const files: ComposedFile[] = order.map((path) => {
    const entry = byPath.get(path)!;
    return {
      path,
      content: toYaml(entry.vars),
      collisions: [...entry.collisions],
    };
  });

  return { files, hasCollisions: files.some((file) => file.collisions.length > 0) };
}
