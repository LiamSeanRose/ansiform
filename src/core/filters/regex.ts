/**
 * `regex_replace` filter (issue #3, council §3).
 *
 * `value | regex_replace(pattern, replacement)` mirrors Ansible's wrapper around
 * Python `re.sub`: it replaces *all* matches. Fidelity is `approximate` because
 * Python's `re` and JavaScript's `RegExp` agree on common patterns but diverge
 * at the edges (`\A`/`\Z`, inline flags, some Unicode classes, POSIX classes).
 *
 * Replacement syntax is normalised from Python to JS:
 *   - literal `$` is escaped (`$` is special in JS replacements, literal in `re`)
 *   - `\g<name>` → `$<name>`, `\g<1>` → `$1`, `\1` → `$1`
 *
 * `ignorecase` / `multiline` are accepted as a trailing options object so the
 * preview can honour `regex_replace(p, r, ignorecase=true)` once #5 parses
 * kwargs; the global flag is always on to match `re.sub`'s replace-all default.
 */
import type { FilterDefinition } from './registry';

interface RegexOptions {
  ignorecase?: boolean;
  multiline?: boolean;
}

function isOptions(value: unknown): value is RegexOptions {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('ignorecase' in value || 'multiline' in value)
  );
}

/**
 * Translate a Python `re.sub` replacement string into a JS one.
 *
 * Parsed character-by-character (rather than chained `.replace`s) so the `$`
 * that is special in JS replacement strings can't collide with the `$N` refs we
 * emit. Mappings: literal `$` → `$$`; `\g<0>`/`\0` → `$&` (whole match);
 * `\g<n>`/`\n` → `$n`; `\g<name>` → `$<name>`; `\x` → literal `x`.
 */
function toJsReplacement(replacement: string): string {
  const numericRef = (ref: string): string => (ref === '0' ? '$&' : `$${ref}`);
  let out = '';
  for (let i = 0; i < replacement.length; i++) {
    const ch = replacement[i];
    if (ch === '$') {
      out += '$$'; // literal $ (in the final .replace, $$ collapses back to $)
      continue;
    }
    if (ch === '\\') {
      const rest = replacement.slice(i + 1);
      const named = /^g<([^>]+)>/.exec(rest);
      if (named) {
        const ref = named[1];
        out += /^\d+$/.test(ref) ? numericRef(ref) : `$<${ref}>`;
        i += named[0].length;
        continue;
      }
      const num = /^\d+/.exec(rest);
      if (num) {
        out += numericRef(num[0]);
        i += num[0].length;
        continue;
      }
      const next = replacement[i + 1];
      if (next !== undefined) {
        out += next; // \x → literal x (e.g. \\ → \)
        i += 1;
      } else {
        out += '\\';
      }
      continue;
    }
    out += ch;
  }
  return out;
}

/** `value | regex_replace(pattern, replacement, [options])`. */
export function regexReplace(
  value: unknown,
  pattern: unknown,
  replacement: unknown = '',
  options?: unknown,
): string {
  const subject = value === undefined || value === null ? '' : String(value);
  const opts = isOptions(options) ? options : undefined;

  let flags = 'g';
  if (opts?.ignorecase) flags += 'i';
  if (opts?.multiline) flags += 'm';

  const re = new RegExp(String(pattern), flags);
  return subject.replace(re, toJsReplacement(String(replacement)));
}

export const regexReplaceFilter: FilterDefinition = {
  name: 'regex_replace',
  fidelity: 'approximate',
  apply: regexReplace,
};
