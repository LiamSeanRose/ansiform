/**
 * Inventory skeleton for the composed var-file set (#81).
 *
 * The composition session (#26) emits `group_vars/` and `host_vars/` files, but a
 * var file only takes effect once the group/host it is keyed to exists in an
 * inventory. This renders that inventory **structure** from the scopes the user
 * already chose — group names from `group_vars`, host names from `host_vars` — so
 * the generated files are not orphaned, and sits at `hosts.ini` alongside them.
 *
 * Honesty spine (council §4): this is a *scaffold*, not a runnable inventory. The
 * composition session records each instance's scope but NOT which hosts belong to
 * which group, so group membership is left for the user to fill in (marked with a
 * comment) rather than fabricated. We never invent host names or connection vars;
 * every name here is one the user typed. The implicit `all` group already covers
 * every host, so a group scope named `all` produces no section. This is inventory
 * structure only — explicitly NOT runnable-playbook output (which stays deferred).
 */
import type { TaskScope } from '../tasks/types';

/** Suggested path for the inventory file, adjacent to `group_vars/` + `host_vars/`. */
export const INVENTORY_FILENAME = 'hosts.ini';

function dedupePreservingOrder(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

/**
 * Render an INI inventory skeleton from the composed scopes. Hosts (from
 * `host_vars`) are listed ungrouped — group membership is not recorded, so we
 * cannot honestly place them under a group; each group (from `group_vars`, except
 * the implicit `all`) gets an empty section with a fill-in-membership comment.
 *
 * Returns `''` when there is nothing to place (no named hosts and no non-`all`
 * groups), so the caller can hide the action rather than offer an empty file.
 */
export function buildInventory(scopes: readonly TaskScope[]): string {
  const named = (kind: TaskScope['kind']) =>
    scopes.filter((s) => s.kind === kind).map((s) => s.name.trim()).filter((n) => n !== '');

  const hosts = dedupePreservingOrder(named('host'));
  const groups = dedupePreservingOrder(named('group')).filter((n) => n !== 'all');

  if (hosts.length === 0 && groups.length === 0) return '';

  const lines: string[] = [
    '# Inventory skeleton — matches the group_vars/ and host_vars/ files in this set.',
    '# Scaffold, not a runnable inventory: add host membership where marked below.',
    '# Hosts come from your host_vars/ files; groups from your group_vars/ files.',
    '# The implicit "all" group already covers every host (group_vars/all.yml needs no section).',
    '',
  ];

  // Known hosts (from host_vars), ungrouped — membership in groups is not recorded.
  for (const host of hosts) lines.push(host);
  if (hosts.length > 0) lines.push('');

  for (const group of groups) {
    lines.push(`[${group}]`);
    lines.push(`# add the hosts that belong to this group (group_vars/${group}.yml)`);
    lines.push('');
  }

  // Single trailing newline for a clean, diff-stable EOF.
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n') + '\n';
}
