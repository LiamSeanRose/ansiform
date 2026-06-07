/**
 * Presentation-only template segmenter for the read-only explainer (#30).
 *
 * This is NOT a second parser: the semantic understanding (variables, filters,
 * fidelity) comes from `extractTemplate`, which reuses the renderer's one parser.
 * This pass only finds the raw `{{ }}` / `{% %}` / `{# #}` delimiter ranges in the
 * *original* text so each can be highlighted as its own DOM text node — no
 * whitespace control, no expression parsing, no inference. Linear single-pass
 * scan (indexOf), so there is no catastrophic-backtracking surface.
 */

export type SegmentKind = 'text' | 'output' | 'tag' | 'comment';

export interface Segment {
  kind: SegmentKind;
  /** The raw substring, delimiters included, for verbatim text-node display. */
  text: string;
}

export function segmentTemplate(src: string): Segment[] {
  const segments: Segment[] = [];
  const n = src.length;
  let i = 0;
  let textStart = 0;

  const flushText = (end: number) => {
    if (end > textStart) segments.push({ kind: 'text', text: src.slice(textStart, end) });
  };

  while (i < n) {
    if (src[i] === '{' && (src[i + 1] === '{' || src[i + 1] === '%' || src[i + 1] === '#')) {
      const marker = src[i + 1];
      const close = marker === '{' ? '}}' : marker === '%' ? '%}' : '#}';
      const end = src.indexOf(close, i + 2);
      if (end === -1) break; // unterminated — the remainder is plain text
      flushText(i);
      const kind: SegmentKind = marker === '{' ? 'output' : marker === '%' ? 'tag' : 'comment';
      segments.push({ kind, text: src.slice(i, end + 2) });
      i = end + 2;
      textStart = i;
    } else {
      i++;
    }
  }
  flushText(n);
  return segments;
}

// A variable whose name suggests a credential — its sample input is masked and it
// is never echoed anywhere persistent (council §5). Heuristic, deliberately broad.
const SECRET_NAME = /(password|passwd|secret|community|key|token|psk|credential)/i;

export function looksLikeSecretName(name: string): boolean {
  return SECRET_NAME.test(name);
}

/** True if the pasted template carries an Ansible Vault block (never decoded). */
export function hasVaultBlock(src: string): boolean {
  return src.includes('!vault');
}

/**
 * Heuristic (#71): does the template look like the flat `set …` configuration
 * form used by Junos, VyOS, and Cradlepoint NCOS, rather than indented line CLI
 * (Cisco IOS)? Set-form commands sit at column 0 — `set system host-name …`,
 * `set lan/0/ip_address …` — so a leading `{% … %}` loop tag is stripped first,
 * then we look for `set ` at the start. This deliberately does NOT match an IOS
 * route-map's *indented* `set` clauses (` set local-preference …`), keeping the
 * two styles apart. Two or more column-0 `set` commands, and at least half the
 * command lines, is taken as set-form (conservative, to avoid false positives).
 */
export function looksLikeSetForm(src: string): boolean {
  let setLines = 0;
  let commandLines = 0;
  for (const raw of src.split('\n')) {
    if (raw.trim() === '') continue;
    // Strip leading {% … %} / {# … #} tags so `{% for %}set …` reads as column 0;
    // leading whitespace is preserved, so an indented line stays indented.
    let s = raw;
    let prev: string;
    do {
      prev = s;
      s = s.replace(/^\{%[^%]*%\}/, '').replace(/^\{#[^#]*#\}/, '');
    } while (s !== prev);
    if (s.trim() === '') continue; // line was only tags
    commandLines++;
    if (s.startsWith('set ')) setLines++;
  }
  return setLines >= 2 && setLines * 2 >= commandLines;
}
