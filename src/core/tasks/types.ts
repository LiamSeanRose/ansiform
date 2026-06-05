/**
 * Task-definition contract.
 *
 * A task is a curated, correct-by-construction form-schema + preview-template
 * pair (council §3). Each task is also an SEO atom: its own route, H1, and meta
 * (§8). The curated library (#7–#11) and the integration reference task (#6)
 * produce values of this shape.
 */
import type { FormSchema } from '../types';

/** Output scope hint — drives the suggested `group_vars`/`host_vars` path. */
export interface TaskScope {
  kind: 'group' | 'host';
  /** Inventory group or host name (e.g. `all`, `core-switches`). */
  name: string;
}

/** Routing + SEO metadata common to a task summary and full definition (§8). */
export interface TaskMeta {
  /** Route segment, e.g. `bgp-neighbor` → `/tasks/bgp-neighbor`. */
  slug: string;
  /** H1 and document `<title>`. */
  title: string;
  /** `<meta name="description">` — the SEO hook. */
  description: string;
}

/** Lightweight listing entry (no schema/template loaded). */
export type TaskSummary = TaskMeta;

/** A fully-loaded curated task. */
export interface TaskDefinition extends TaskMeta {
  /** Drives the accessible form (#4). */
  schema: FormSchema;
  /**
   * Jinja2-compatible template rendered to device CLI for the live preview (#5).
   *
   * Important (§4): the YAML vars output is derived from the field values
   * directly and is ALWAYS correct; this template only drives the preview,
   * which may be approximate where a filter is not `exact`.
   */
  template: string;
  /** Default output scope (e.g. group `all`). */
  defaultScope?: TaskScope;
}
