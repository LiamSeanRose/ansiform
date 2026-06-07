/**
 * Client-side merge helper: diff generated vars against an existing file (#82).
 *
 * Most enterprise/government inventories are not greenfield — operators already
 * have a `group_vars/`/`host_vars/` file and the real fear is "will this tool
 * clobber it?". This turns that fear into a reviewable, additive merge: paste the
 * existing file, see — per top-level key — what the generated set would **add**,
 * what it would **change**, and what is already **unchanged**, plus a paste-able
 * block of only the added + changed keys to drop into the file by hand.
 *
 * Spine (council §4/§5):
 *  - **Pure, never throws.** Every failure (too large, unparseable, not a mapping)
 *    is reported through `error`, never as an exception.
 *  - **Additive only.** We never rewrite the user's file or echo their other keys
 *    back — we only classify the generated keys and emit a block to add. Keys the
 *    file has that we don't touch are left entirely alone (not even listed).
 *  - **Always-correct output.** The paste block is built by the same byte-correct
 *    `toYaml` path as the YAML sink — it is real file content, not an approximation.
 *  - **Secrets first-class.** A credential-named key's *echoed current value* is
 *    masked here, by construction, so no caller can leak it in the diff view. The
 *    paste block itself carries real values — it is the file you save (the same
 *    intended path as the main YAML output panel), never a shareable link.
 *  - **Ephemeral + bounded.** `load` is js-yaml's safe loader (no code execution);
 *    a 64 KB ceiling and an anchor-count guard bound hostile input (an alias bomb)
 *    before expansion. Nothing pasted is persisted, logged, or transmitted.
 */
import { dump, load } from 'js-yaml';
import { toYaml } from './yaml';
import { VAULT_SCHEMA } from '../yaml/vault-tag';

/** Largest existing file the diff will parse — a hard ceiling against hostile input. */
export const MAX_VARS_LENGTH = 64 * 1024;

/** The mask shown in place of a credential-named key's echoed current value. */
export const SECRET_MASK = '********';

/** Why parsing the pasted file produced no diff (each maps to a distinct message). */
export type VarsDiffError = 'tooLarge' | 'parse' | 'shape';

/** How a generated top-level key relates to the pasted existing file. */
export type DiffStatus = 'added' | 'changed' | 'unchanged';

/** One generated top-level key, classified against the existing file. */
export interface VarsDiffEntry {
  key: string;
  status: DiffStatus;
  /**
   * The key's current value in the pasted file, rendered as a compact YAML
   * snippet — present only for `changed`/`unchanged` (the key exists there).
   * Masked when the key name looks like a credential.
   */
  existing?: string;
  /**
   * The generated value, rendered as a compact YAML snippet. Masked when the key
   * name looks like a credential (the real value still lands in `block`).
   */
  generated: string;
}

export interface VarsDiffResult {
  ok: boolean;
  /** Set when `!ok` — drives a visible, specific error message. */
  error?: VarsDiffError;
  /** One entry per generated top-level key, in generated (schema/form) order. */
  entries: VarsDiffEntry[];
  /** Generated keys absent from the existing file. */
  added: string[];
  /** Generated keys present but with a different value. */
  changed: string[];
  /** Generated keys present with an identical value. */
  unchanged: string[];
  /**
   * Paste-able YAML for the added + changed keys only, in generated order, by the
   * same byte-correct path as the YAML sink. Empty string when there is nothing
   * to add (the file already matches).
   */
  block: string;
}

/** Result of parsing a pasted vars file (or our own generated content). */
export interface VarsParse {
  ok: boolean;
  error?: VarsDiffError;
  /** The top-level mapping; `{}` when empty or not ok. */
  vars: Record<string, unknown>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * A key whose name suggests a credential — its echoed current value is masked and
 * never displayed (council §5). Heuristic, deliberately broad; mirrors the
 * reader's `looksLikeSecretName` so the two stay aligned in spirit.
 */
const SECRET_NAME = /(password|passwd|secret|community|key|token|psk|credential)/i;
function looksLikeSecret(name: string): boolean {
  return SECRET_NAME.test(name);
}

/** Cheap pre-load guard: a YAML alias bomb needs many anchors. Reject early. */
function hasTooManyAnchors(src: string): boolean {
  const anchors = src.match(/(?:^|[\s,[{])&[A-Za-z0-9_]/g);
  return !!anchors && anchors.length > 64;
}

/**
 * Order-insensitive (for mapping keys) canonical form used only for equality:
 * two values are "unchanged" iff their canonical forms match. Arrays stay
 * order-sensitive (sequence order is meaningful); mapping keys are sorted so a
 * differently-ordered but equal mapping is not falsely flagged as changed.
 */
function canonical(value: unknown): string {
  return JSON.stringify(normalize(value));
}
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) out[k] = normalize(value[k]);
    return out;
  }
  return value;
}

/** Render one value as a compact YAML snippet for display (no trailing newline). */
function renderSnippet(value: unknown): string {
  return dump(value, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: "'",
    forceQuotes: false,
    // A pasted file may hold `!vault` values; render them under their tag rather
    // than leaking the wrapper object (#84). Still never decrypted.
    schema: VAULT_SCHEMA,
  }).trimEnd();
}

/**
 * Parse a pasted vars file safely. Pure, never throws. An empty or comments-only
 * file is a valid empty mapping (everything will read as "added"), not an error.
 * Reused to parse our own generated content into a vars object.
 */
export function parseVarsYaml(src: string): VarsParse {
  if (src.length > MAX_VARS_LENGTH || hasTooManyAnchors(src)) {
    return { ok: false, error: 'tooLarge', vars: {} };
  }
  if (src.trim().length === 0) return { ok: true, vars: {} };

  let doc: unknown;
  try {
    // VAULT_SCHEMA so a file holding `!vault` values parses (passthrough, never
    // decrypted) instead of throwing on the unknown tag (#84).
    doc = load(src, { schema: VAULT_SCHEMA });
  } catch {
    return { ok: false, error: 'parse', vars: {} };
  }
  // A file of only comments/blank lines parses to null/undefined — treat as empty.
  if (doc === null || doc === undefined) return { ok: true, vars: {} };
  if (!isRecord(doc)) return { ok: false, error: 'shape', vars: {} };
  return { ok: true, vars: doc };
}

/**
 * Diff a set of generated top-level vars against a pasted existing file. Pure,
 * never throws: a bad paste returns `ok: false` with an `error`, never an empty
 * silent result. Only the generated keys are classified — keys the existing file
 * has that the generated set does not touch are left entirely alone.
 */
export function diffVars(pasted: string, generated: Record<string, unknown>): VarsDiffResult {
  const parse = parseVarsYaml(pasted);
  if (!parse.ok) {
    return { ok: false, error: parse.error, entries: [], added: [], changed: [], unchanged: [], block: '' };
  }
  const existing = parse.vars;

  const entries: VarsDiffEntry[] = [];
  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];
  const blockVars: Record<string, unknown> = {};

  for (const key of Object.keys(generated)) {
    const inExisting = Object.prototype.hasOwnProperty.call(existing, key);
    const secret = looksLikeSecret(key);

    let status: DiffStatus;
    if (!inExisting) status = 'added';
    else status = canonical(existing[key]) === canonical(generated[key]) ? 'unchanged' : 'changed';

    const entry: VarsDiffEntry = {
      key,
      status,
      generated: secret ? SECRET_MASK : renderSnippet(generated[key]),
    };
    if (inExisting) entry.existing = secret ? SECRET_MASK : renderSnippet(existing[key]);
    entries.push(entry);

    if (status === 'added') added.push(key);
    else if (status === 'changed') changed.push(key);
    else unchanged.push(key);

    if (status === 'added' || status === 'changed') blockVars[key] = generated[key];
  }

  const block = Object.keys(blockVars).length > 0 ? toYaml(blockVars) : '';
  return { ok: true, entries, added, changed, unchanged, block };
}
