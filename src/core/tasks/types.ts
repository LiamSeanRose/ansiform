/**
 * Task-definition contract.
 *
 * A task is a curated, correct-by-construction form-schema + preview-template
 * pair (council §3). Each task is also an SEO atom: its own route, H1, and meta
 * (§8). The curated library (#7–#11) and the integration reference task (#6)
 * produce values of this shape.
 */
import type { FormSchema } from '../types';
import type { Vendor, VendorTemplateEntry } from './vendor';

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
  /**
   * Target network OS. Optional and additive (issue #21): when omitted, a task
   * is treated as the default vendor (`cisco-ios`). Resolve with `vendorOf()`
   * (`../tasks/vendor`) rather than reading this field directly, so the default
   * is applied consistently. The `Vendor` union grows when multi-vendor content
   * lands (#27); until then every curated task is Cisco IOS.
   */
  vendor?: Vendor;
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
  /**
   * Per-vendor preview overrides (issue #27). Additive: the same `schema` and the
   * same always-correct YAML vars serve every vendor; only the rendered CLI
   * differs. The base `template` above is the default vendor's preview
   * (`vendorOf(this)`, usually `cisco-ios`); each key here adds or overrides
   * another vendor's preview. A value may be a bare template string (asserted
   * `exact`) or a `VendorTemplate` carrying a fidelity flag for un-reviewed CLI.
   * Resolve with `taskVendors`/`templateForVendor` (`./vendor`) — never read this
   * map directly, so the base-template fallback stays consistent.
   */
  templates?: Partial<Record<Vendor, VendorTemplateEntry>>;
  /** Default output scope (e.g. group `all`). */
  defaultScope?: TaskScope;
}
