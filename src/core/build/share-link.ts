/**
 * Structure-only deep links for the composition tray (#88).
 *
 * Lets a practitioner share a *form set to fill* — e.g. `/build?tasks=interface-ip,banners`
 * pre-selects those tasks so a coworker opens the page with the tray already
 * populated and just fills the values. It is a cheap distribution multiplier that
 * stays inside the product's hardest rule.
 *
 * Spine (council §5 — the #1 leak path): **task IDs only, never values.** Both
 * directions here operate on an explicit allowlist of known task slugs:
 *   - `parseSharedTasks` reads ONLY the `tasks` param and keeps ONLY slugs that
 *     are in the allowlist; every other query param and every unknown slug is
 *     ignored, never reflected.
 *   - `buildShareQuery` accepts slugs and emits only allowlisted ones. Its
 *     signature has no channel for a field value, so by construction no value can
 *     be encoded — the unit tests assert this.
 *
 * Pure functions: no DOM, no persistence, no network.
 */

/** The single query parameter we read/write. Nothing else is ever consulted. */
export const TASKS_PARAM = 'tasks';

function asSet(allowed: ReadonlySet<string> | readonly string[]): ReadonlySet<string> {
  return allowed instanceof Set ? allowed : new Set(allowed);
}

/**
 * Keep, in first-seen order, the allowlisted members of `slugs`, deduped. Shared
 * by both directions so reading and writing apply the identical filter.
 */
function filterAllowed(
  slugs: readonly string[],
  allowed: ReadonlySet<string> | readonly string[],
): string[] {
  const set = asSet(allowed);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of slugs) {
    const slug = raw.trim();
    if (slug !== '' && set.has(slug) && !seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}

/**
 * Parse the shared task selection from a URL query string. Accepts the string
 * with or without a leading `?`. Returns the allowlisted task slugs in order,
 * deduped; an absent/empty `tasks` param yields `[]`. Any other param (a stray
 * `hostname=…`, an injected value) is never read.
 */
export function parseSharedTasks(
  search: string,
  allowed: ReadonlySet<string> | readonly string[],
): string[] {
  const raw = new URLSearchParams(search).get(TASKS_PARAM);
  if (!raw) return [];
  return filterAllowed(raw.split(','), allowed);
}

/**
 * Build the query string (`?tasks=a,b`) for a task selection, including only
 * allowlisted slugs, deduped and in order. Returns `''` when nothing is
 * shareable, so the caller can omit the query entirely. Slugs are url-safe by
 * definition (the registry's slug grammar), so no escaping is needed — and there
 * is deliberately no parameter through which a field value could pass.
 */
export function buildShareQuery(
  slugs: readonly string[],
  allowed: ReadonlySet<string> | readonly string[],
): string {
  const kept = filterAllowed(slugs, allowed);
  return kept.length === 0 ? '' : `?${TASKS_PARAM}=${kept.join(',')}`;
}
