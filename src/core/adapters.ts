/**
 * Core + adapters seam (council §4).
 *
 * Browser-only implementations attach now; enterprise features (a future
 * backend sidecar, BYO template parsing) attach later as additional adapters —
 * never a core rewrite. Anything that would require network/egress must be
 * tagged `breaks-air-gap` and gated on a named customer.
 */
import type { FormSchema, FormValues } from './types';
import type { TaskDefinition, TaskScope, TaskSummary } from './tasks/types';

/** A copyable/downloadable result produced by an OutputSink. */
export interface OutputArtifact {
  /** Suggested filename or path, e.g. `group_vars/all.yml`. */
  filename: string;
  /** MIME type for download (e.g. `text/yaml`, `application/json`). */
  contentType: string;
  /** The rendered file content. */
  content: string;
}

/** Inputs an OutputSink renders from. */
export interface OutputContext {
  schema: FormSchema;
  values: FormValues;
  /** Optional scope hint for suggested var-file paths. */
  scope?: TaskScope;
}

/**
 * Turns filled form values into a downloadable artifact.
 *
 * Implementations (disjoint, parallel):
 *  - group_vars/host_vars YAML (#12)
 *  - AWX/AAP survey-spec JSON (#13)
 */
export interface OutputSink {
  /** Stable id, e.g. `group-vars-yaml`, `awx-survey-spec`. */
  readonly id: string;
  /** Human label (or i18n key) for the output choice. */
  readonly label: string;
  render(context: OutputContext): OutputArtifact;
}

/**
 * Where task definitions come from.
 *
 * v1 implementation is the bundled curated library (client-side, zero egress).
 * Future adapters — e.g. `argument_specs` BYO (beta) — attach here without
 * touching the core (§3/§4).
 */
export interface TemplateSource {
  /** Stable id, e.g. `curated`. */
  readonly id: string;
  /** All available tasks (metadata only). */
  list(): Promise<TaskSummary[]>;
  /** Load a full task by slug, or `null` if unknown. */
  get(slug: string): Promise<TaskDefinition | null>;
}
