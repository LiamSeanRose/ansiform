/**
 * Device-CLI live-preview renderer (issue #5, council §2/§11).
 *
 * Renders a Jinja2-compatible template to **device CLI text** — the product's
 * trust signal: the user recognises the config they already read, so they trust
 * the YAML they cannot. This module is pure (string in, value out); the React
 * `PreviewPane` puts the result on screen as DOM text nodes only.
 *
 * The cardinal rule (§11): the preview may be *approximate*, but it must NEVER
 * be silently wrong. Every way the render can diverge from real Ansible drives
 * the fidelity tier down to `unsupported`, so the pane shows a visible "preview
 * may differ — output is still valid" notice instead of a confident lie:
 *   - a filter the registry doesn't know (or marks `unsupported`),
 *   - a registered filter that throws at runtime (e.g. `ipaddr` on an IPv6 query),
 *   - a structural problem (unknown `{% tag %}`, missing `{% endif %}`, a
 *     malformed expression).
 * A template that uses only `exact` filters renders at `exact` fidelity.
 *
 * Supported Jinja2 subset (the slice real Cisco IOS var templates use):
 *   - `{{ expr }}` output, with filter chains `a | f | g('arg')`,
 *   - `{% if %}/{% elif %}/{% else %}/{% endif %}`,
 *   - `{% for x in expr %} … {% else %} … {% endfor %}`,
 *   - `{# comments #}`,
 *   - expressions: string/number/boolean/`none`/`omit` literals, variables,
 *     filters, `not`/`and`/`or`, and `== != < > <= >=` comparisons.
 * To match what actually runs, we replicate Ansible's Jinja environment:
 * `trim_blocks=True` (a newline right after a `%}` block tag is dropped) and the
 * explicit `{%- … -%}` / `{{- … -}}` whitespace-trim markers. `lstrip_blocks` is
 * off, exactly as in Ansible.
 *
 * Secrets (§5): this renderer is value-agnostic — it renders whatever scope it
 * is given. The preview is ephemeral in-memory text on the user's own screen
 * (never stored, logged, or encoded), so showing a secret in the rendered CLI is
 * acceptable; a caller that wants the preview masked can pass a redacted scope.
 */
import type { FidelityTier, FilterRegistry } from '../filters/registry';
import { OMIT } from '../filters/default';

/** The outcome of rendering a template against a value scope. */
export interface PreviewResult {
  /** Rendered device-CLI text. Safe to insert verbatim as a DOM text node. */
  text: string;
  /** Worst-case fidelity vs. real Ansible — drives the degradation notice. */
  fidelity: FidelityTier;
  /** Distinct filter names the template referenced, in first-seen order. */
  filters: string[];
}

/** A value scope: variable name → value. Loop variables are layered on top. */
export type Scope = Record<string, unknown>;

// ── Expression AST ──────────────────────────────────────────────────────────

type Expr =
  | { e: 'lit'; v: unknown }
  | { e: 'var'; name: string }
  | { e: 'not'; x: Expr }
  | { e: 'and' | 'or'; l: Expr; r: Expr }
  | { e: 'cmp'; op: string; l: Expr; r: Expr }
  | { e: 'member'; obj: Expr; name: string }
  | { e: 'filter'; src: Expr; name: string; args: Expr[] };

// ── Template AST ────────────────────────────────────────────────────────────

type Node =
  | { t: 'text'; v: string }
  | { t: 'out'; expr: Expr }
  | { t: 'if'; branches: { cond: Expr; body: Node[] }[]; alt: Node[] | null }
  | { t: 'for'; name: string; iter: Expr; body: Node[]; alt: Node[] | null };

/** Mutable degradation accumulator threaded through parse + evaluate. */
interface Diag {
  /** Unknown tag, unbalanced block, or unparseable expression. */
  structural: boolean;
  /** A registered filter threw while applying. */
  runtime: boolean;
}

// ── Tokenizer ───────────────────────────────────────────────────────────────

type Tok =
  | { kind: 'text'; value: string }
  | { kind: 'output'; expr: string }
  | { kind: 'tag'; value: string };

/**
 * Split a template into text / `{{ output }}` / `{% tag %}` tokens, dropping
 * `{# comments #}`, and apply whitespace control (explicit `-` markers and
 * Ansible's default `trim_blocks`). An unterminated `{{`/`{%`/`{#` degrades the
 * preview structurally and the remainder is treated as literal text.
 */
function tokenize(src: string, diag: Diag): Tok[] {
  interface Raw {
    kind: 'text' | 'output' | 'tag' | 'comment';
    value: string;
    leftTrim?: boolean;
    rightTrim?: boolean;
  }
  const raw: Raw[] = [];
  let i = 0;
  let textStart = 0;
  const n = src.length;

  const flushText = (end: number) => {
    if (end > textStart) raw.push({ kind: 'text', value: src.slice(textStart, end) });
  };

  while (i < n) {
    if (src[i] === '{' && (src[i + 1] === '{' || src[i + 1] === '%' || src[i + 1] === '#')) {
      const marker = src[i + 1];
      const close = marker === '{' ? '}}' : marker === '%' ? '%}' : '#}';
      const end = src.indexOf(close, i + 2);
      if (end === -1) {
        // Unterminated delimiter — bail out loudly, keep the rest as text.
        diag.structural = true;
        flushText(i);
        raw.push({ kind: 'text', value: src.slice(i) });
        textStart = n;
        break;
      }
      flushText(i);
      let inner = src.slice(i + 2, end);
      const leftTrim = inner.startsWith('-');
      if (leftTrim) inner = inner.slice(1);
      const rightTrim = inner.endsWith('-');
      if (rightTrim) inner = inner.slice(0, -1);
      inner = inner.trim();
      if (marker === '{') raw.push({ kind: 'output', value: inner, leftTrim, rightTrim });
      else if (marker === '%') raw.push({ kind: 'tag', value: inner, leftTrim, rightTrim });
      else raw.push({ kind: 'comment', value: '', leftTrim, rightTrim });
      i = end + 2;
      textStart = i;
    } else {
      i++;
    }
  }
  flushText(n);

  // Whitespace control: apply trim markers and trim_blocks to neighbouring text.
  for (let k = 0; k < raw.length; k++) {
    const cur = raw[k];
    if (cur.kind === 'text') continue;
    const prev = raw[k - 1];
    const next = raw[k + 1];
    if (cur.leftTrim && prev && prev.kind === 'text') {
      prev.value = prev.value.replace(/\s+$/, '');
    }
    if (cur.rightTrim) {
      if (next && next.kind === 'text') next.value = next.value.replace(/^\s+/, '');
    } else if ((cur.kind === 'tag' || cur.kind === 'comment') && next && next.kind === 'text') {
      // trim_blocks: a block tag swallows the single newline that follows it.
      next.value = next.value.replace(/^\r?\n/, '');
    }
  }

  return raw
    .filter((t): t is Raw & { kind: 'text' | 'output' | 'tag' } => t.kind !== 'comment')
    .map((t) =>
      t.kind === 'text'
        ? ({ kind: 'text', value: t.value } as Tok)
        : t.kind === 'output'
          ? ({ kind: 'output', expr: t.value } as Tok)
          : ({ kind: 'tag', value: t.value } as Tok),
    );
}

// ── Expression lexer + parser ───────────────────────────────────────────────

type ETok =
  | { k: 'str'; v: string }
  | { k: 'num'; v: number }
  | { k: 'name'; v: string }
  | { k: 'op'; v: string }
  | { k: 'pipe' }
  | { k: 'lp' }
  | { k: 'rp' }
  | { k: 'comma' }
  | { k: 'dot' };

function lexExpr(src: string): ETok[] {
  const toks: ETok[] = [];
  let i = 0;
  const n = src.length;
  const prevAllowsSign = () => {
    const p = toks[toks.length - 1];
    return !p || p.k === 'op' || p.k === 'pipe' || p.k === 'lp' || p.k === 'comma';
  };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      i++;
      let s = '';
      while (i < n && src[i] !== c) {
        if (src[i] === '\\' && i + 1 < n) {
          const esc = src[i + 1];
          s += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc;
          i += 2;
        } else {
          s += src[i++];
        }
      }
      if (i >= n) throw new Error('unterminated string');
      i++; // closing quote
      toks.push({ k: 'str', v: s });
      continue;
    }
    if (/[0-9]/.test(c) || (c === '-' && /[0-9.]/.test(src[i + 1] ?? '') && prevAllowsSign())) {
      const m = /^-?\d*\.?\d+/.exec(src.slice(i));
      if (!m) throw new Error('bad number');
      toks.push({ k: 'num', v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_]\w*/.exec(src.slice(i))!;
      toks.push({ k: 'name', v: m[0] });
      i += m[0].length;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '==' || two === '!=' || two === '<=' || two === '>=') {
      toks.push({ k: 'op', v: two });
      i += 2;
      continue;
    }
    if (c === '<' || c === '>') {
      toks.push({ k: 'op', v: c });
      i++;
      continue;
    }
    if (c === '|') {
      toks.push({ k: 'pipe' });
      i++;
      continue;
    }
    if (c === '(') {
      toks.push({ k: 'lp' });
      i++;
      continue;
    }
    if (c === ')') {
      toks.push({ k: 'rp' });
      i++;
      continue;
    }
    if (c === ',') {
      toks.push({ k: 'comma' });
      i++;
      continue;
    }
    if (c === '.') {
      toks.push({ k: 'dot' });
      i++;
      continue;
    }
    throw new Error(`unexpected character ${JSON.stringify(c)}`);
  }
  return toks;
}

interface PState {
  toks: ETok[];
  i: number;
}

function nameIs(p: PState, v: string): boolean {
  const t = p.toks[p.i];
  return !!t && t.k === 'name' && t.v === v;
}

function parseOr(p: PState): Expr {
  let left = parseAnd(p);
  while (nameIs(p, 'or')) {
    p.i++;
    left = { e: 'or', l: left, r: parseAnd(p) };
  }
  return left;
}

function parseAnd(p: PState): Expr {
  let left = parseNot(p);
  while (nameIs(p, 'and')) {
    p.i++;
    left = { e: 'and', l: left, r: parseNot(p) };
  }
  return left;
}

function parseNot(p: PState): Expr {
  if (nameIs(p, 'not')) {
    p.i++;
    return { e: 'not', x: parseNot(p) };
  }
  return parseCmp(p);
}

function parseCmp(p: PState): Expr {
  const left = parseFilter(p);
  const t = p.toks[p.i];
  if (t && t.k === 'op') {
    p.i++;
    return { e: 'cmp', op: t.v, l: left, r: parseFilter(p) };
  }
  return left;
}

/** Postfix member access: `obj.name.name…` binds tighter than filters. */
function parsePostfix(p: PState): Expr {
  let e = parsePrimary(p);
  while (p.toks[p.i]?.k === 'dot') {
    p.i++;
    const nameTok = p.toks[p.i++];
    if (!nameTok || nameTok.k !== 'name') throw new Error('expected property name after .');
    e = { e: 'member', obj: e, name: nameTok.v };
  }
  return e;
}

function parseFilter(p: PState): Expr {
  let left = parsePostfix(p);
  while (p.toks[p.i]?.k === 'pipe') {
    p.i++;
    const nameTok = p.toks[p.i++];
    if (!nameTok || nameTok.k !== 'name') throw new Error('expected filter name');
    const args: Expr[] = [];
    if (p.toks[p.i]?.k === 'lp') {
      p.i++;
      if (p.toks[p.i]?.k !== 'rp') {
        args.push(parseOr(p));
        while (p.toks[p.i]?.k === 'comma') {
          p.i++;
          args.push(parseOr(p));
        }
      }
      if (p.toks[p.i++]?.k !== 'rp') throw new Error('expected )');
    }
    left = { e: 'filter', src: left, name: nameTok.v, args };
  }
  return left;
}

function parsePrimary(p: PState): Expr {
  const t = p.toks[p.i++];
  if (!t) throw new Error('unexpected end of expression');
  if (t.k === 'str') return { e: 'lit', v: t.v };
  if (t.k === 'num') return { e: 'lit', v: t.v };
  if (t.k === 'lp') {
    const e = parseOr(p);
    if (p.toks[p.i++]?.k !== 'rp') throw new Error('expected )');
    return e;
  }
  if (t.k === 'name') {
    switch (t.v) {
      case 'true':
      case 'True':
        return { e: 'lit', v: true };
      case 'false':
      case 'False':
        return { e: 'lit', v: false };
      case 'none':
      case 'None':
      case 'null':
        return { e: 'lit', v: null };
      case 'omit':
        return { e: 'lit', v: OMIT };
      default:
        return { e: 'var', name: t.v };
    }
  }
  throw new Error('unexpected token in expression');
}

/** Parse one expression source string; structural failures degrade visibly. */
function parseExpr(src: string, diag: Diag): Expr {
  try {
    const p: PState = { toks: lexExpr(src), i: 0 };
    const expr = parseOr(p);
    if (p.i < p.toks.length) throw new Error('trailing tokens');
    return expr;
  } catch {
    diag.structural = true;
    return { e: 'lit', v: undefined };
  }
}

// ── Template parser ─────────────────────────────────────────────────────────

interface TState {
  toks: Tok[];
  i: number;
}

function firstWord(s: string): string {
  const m = /^\s*(\S+)/.exec(s);
  return m ? m[1] : '';
}

function afterWord(s: string, word: string): string {
  return s.slice(s.indexOf(word) + word.length).trim();
}

/** Parse a node sequence until a tag whose keyword is in `stops` (uncon­sumed). */
/** Hard cap on `{% if %}`/`{% for %}` nesting — guards against a stack overflow
 * on pathologically deep (possibly hostile) pasted input. Real templates nest a
 * handful of levels; 64 is far beyond any genuine config template. */
const MAX_PARSE_DEPTH = 64;

function parseSeq(
  ts: TState,
  stops: string[],
  diag: Diag,
  depth: number,
): { nodes: Node[]; stop: string | null } {
  const nodes: Node[] = [];
  while (ts.i < ts.toks.length) {
    const tok = ts.toks[ts.i];
    if (tok.kind === 'text') {
      if (tok.value) nodes.push({ t: 'text', v: tok.value });
      ts.i++;
      continue;
    }
    if (tok.kind === 'output') {
      nodes.push({ t: 'out', expr: parseExpr(tok.expr, diag) });
      ts.i++;
      continue;
    }
    // tag
    const kw = firstWord(tok.value);
    if (stops.includes(kw)) return { nodes, stop: kw };
    if ((kw === 'if' || kw === 'for') && depth >= MAX_PARSE_DEPTH) {
      // Nesting too deep: bail loudly (text + structural degrade) rather than
      // recurse further. Never silently wrong, never a crash.
      diag.structural = true;
      nodes.push({ t: 'text', v: `{% ${tok.value} %}` });
      ts.i++;
      continue;
    }
    if (kw === 'if') {
      ts.i++;
      nodes.push(parseIf(ts, tok.value, diag, depth + 1));
      continue;
    }
    if (kw === 'for') {
      ts.i++;
      nodes.push(parseFor(ts, tok.value, diag, depth + 1));
      continue;
    }
    // Unknown tag: render it literally so the divergence is visible, and degrade.
    diag.structural = true;
    nodes.push({ t: 'text', v: `{% ${tok.value} %}` });
    ts.i++;
  }
  return { nodes, stop: null };
}

function parseIf(ts: TState, tagSrc: string, diag: Diag, depth: number): Node {
  const branches: { cond: Expr; body: Node[] }[] = [];
  let cond = parseExpr(afterWord(tagSrc, 'if'), diag);
  let seq = parseSeq(ts, ['elif', 'else', 'endif'], diag, depth);
  branches.push({ cond, body: seq.nodes });
  while (seq.stop === 'elif') {
    const elifTok = ts.toks[ts.i++];
    cond = parseExpr(afterWord(elifTok.kind === 'tag' ? elifTok.value : '', 'elif'), diag);
    seq = parseSeq(ts, ['elif', 'else', 'endif'], diag, depth);
    branches.push({ cond, body: seq.nodes });
  }
  let alt: Node[] | null = null;
  if (seq.stop === 'else') {
    ts.i++;
    seq = parseSeq(ts, ['endif'], diag, depth);
    alt = seq.nodes;
  }
  if (seq.stop === 'endif') ts.i++;
  else diag.structural = true;
  return { t: 'if', branches, alt };
}

function parseFor(ts: TState, tagSrc: string, diag: Diag, depth: number): Node {
  const m = /^for\s+([A-Za-z_]\w*)\s+in\s+(.+)$/.exec(tagSrc.trim());
  if (!m) {
    diag.structural = true;
    const seq = parseSeq(ts, ['endfor'], diag, depth);
    if (seq.stop === 'endfor') ts.i++;
    return { t: 'for', name: '_', iter: { e: 'lit', v: [] }, body: seq.nodes, alt: null };
  }
  const iter = parseExpr(m[2], diag);
  let seq = parseSeq(ts, ['else', 'endfor'], diag, depth);
  const body = seq.nodes;
  let alt: Node[] | null = null;
  if (seq.stop === 'else') {
    ts.i++;
    seq = parseSeq(ts, ['endfor'], diag, depth);
    alt = seq.nodes;
  }
  if (seq.stop === 'endfor') ts.i++;
  else diag.structural = true;
  return { t: 'for', name: m[1], iter, body, alt };
}

/**
 * Tokenize + parse a template into the node AST, filling `diag` with any
 * structural problems. The single parser shared by both consumers — `renderPreview`
 * (below) and `extractTemplate` (issue #30) — so the reader can never disagree
 * with the preview ("one parser, two outputs"). Adds no grammar of its own.
 */
function parseTemplate(template: string, diag: Diag): Node[] {
  const toks = tokenize(template, diag);
  const ts: TState = { toks, i: 0 };
  return parseSeq(ts, [], diag, 0).nodes;
}

// ── Runtime helpers ─────────────────────────────────────────────────────────

/** Python/Jinja truthiness. */
function truthy(v: unknown): boolean {
  if (v === undefined || v === null || v === false || v === '' || v === 0 || v === OMIT) {
    return false;
  }
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
}

function compare(op: string, l: unknown, r: unknown): boolean {
  if (op === '==') return l === r;
  if (op === '!=') return l !== r;
  let a: number | string;
  let b: number | string;
  if (typeof l === 'number' && typeof r === 'number') {
    a = l;
    b = r;
  } else {
    a = String(l);
    b = String(r);
  }
  switch (op) {
    case '<':
      return a < b;
    case '>':
      return a > b;
    case '<=':
      return a <= b;
    case '>=':
      return a >= b;
    default:
      return false;
  }
}

/** Render a value the way Jinja's default finalizer would. */
function toText(v: unknown): string {
  if (v === undefined || v === null || v === OMIT) return '';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(', ')}]`;
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function pyRepr(v: unknown): string {
  if (typeof v === 'string') return `'${v}'`;
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (v === null || v === undefined) return 'None';
  return toText(v);
}

function toIterable(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return [...v];
  if (v && typeof v === 'object') return Object.keys(v);
  return [];
}

// ── Public entry point ──────────────────────────────────────────────────────

/**
 * Render `template` against `values` using `registry` for filters. Never throws:
 * any failure is caught and surfaced as a downgraded `fidelity` so the UI can
 * degrade visibly rather than crash.
 */
export function renderPreview(
  template: string,
  values: Scope,
  registry: FilterRegistry,
): PreviewResult {
  const diag: Diag = { structural: false, runtime: false };
  const filters: string[] = [];
  let text = '';

  const evalExpr = (node: Expr, scope: Scope): unknown => {
    switch (node.e) {
      case 'lit':
        return node.v;
      case 'var':
        return Object.prototype.hasOwnProperty.call(scope, node.name)
          ? scope[node.name]
          : undefined;
      case 'not':
        return !truthy(evalExpr(node.x, scope));
      case 'and': {
        const l = evalExpr(node.l, scope);
        return truthy(l) ? evalExpr(node.r, scope) : l;
      }
      case 'or': {
        const l = evalExpr(node.l, scope);
        return truthy(l) ? l : evalExpr(node.r, scope);
      }
      case 'cmp':
        return compare(node.op, evalExpr(node.l, scope), evalExpr(node.r, scope));
      case 'member': {
        const obj = evalExpr(node.obj, scope);
        if (obj === null || obj === undefined) return undefined;
        if (typeof obj === 'object') return (obj as Record<string, unknown>)[node.name];
        return undefined;
      }
      case 'filter': {
        const input = evalExpr(node.src, scope);
        if (!filters.includes(node.name)) filters.push(node.name);
        const def = registry.get(node.name);
        const args = node.args.map((a) => evalExpr(a, scope));
        // Unknown filter: pass the value through. `resolveFidelity` already maps
        // the unknown name to `unsupported`, so the divergence is advertised.
        if (!def) return input;
        try {
          return def.apply(input, ...args);
        } catch {
          diag.runtime = true;
          return input;
        }
      }
    }
  };

  const renderNodes = (nodes: Node[], scope: Scope): string => {
    let out = '';
    for (const node of nodes) {
      switch (node.t) {
        case 'text':
          out += node.v;
          break;
        case 'out':
          out += toText(evalExpr(node.expr, scope));
          break;
        case 'if': {
          let taken = false;
          for (const branch of node.branches) {
            if (truthy(evalExpr(branch.cond, scope))) {
              out += renderNodes(branch.body, scope);
              taken = true;
              break;
            }
          }
          if (!taken && node.alt) out += renderNodes(node.alt, scope);
          break;
        }
        case 'for': {
          const items = toIterable(evalExpr(node.iter, scope));
          if (items.length === 0) {
            if (node.alt) out += renderNodes(node.alt, scope);
          } else {
            for (const item of items) {
              out += renderNodes(node.body, { ...scope, [node.name]: item });
            }
          }
          break;
        }
      }
    }
    return out;
  };

  try {
    const nodes = parseTemplate(template, diag);
    text = renderNodes(nodes, values);
  } catch {
    // Defensive: the renderer must never throw. Degrade instead.
    diag.runtime = true;
  }

  const fidelity: FidelityTier =
    diag.structural || diag.runtime ? 'unsupported' : registry.resolveFidelity(filters);

  return { text, fidelity, filters };
}

// ── Template reader: extraction (issue #30) ──────────────────────────────────

/** A filter referenced by a template, with how faithfully the preview matches. */
export interface FilterUse {
  name: string;
  tier: FidelityTier;
}

/**
 * What the read-only template explainer (#30) learns from a pasted template.
 *
 * Deliberately *descriptive, never inferential* (council deal-breaker): it lists
 * the variables and filters the template references and the worst-case preview
 * fidelity, but it does NOT guess types, validation, or requiredness. `loopVars`
 * and `hasBlocks` let the UI warn that `{% set %}`/loop variables may not all be
 * surfaced — so a partial list is shown honestly, never as authoritative.
 */
export interface TemplateExtraction {
  /** Free variable names the operator would fill, first-seen order (loop vars excluded). */
  variables: string[];
  /** Distinct filters referenced, first-seen order, each with its fidelity tier. */
  filters: FilterUse[];
  /** Names bound by `{% for x in … %}` — surfaced separately, not as fill-ins. */
  loopVars: string[];
  /** Worst-case preview fidelity: any structural problem ⇒ `unsupported`. */
  fidelity: FidelityTier;
  /** Whether the template uses `{% if %}`/`{% for %}` (⇒ list may be partial). */
  hasBlocks: boolean;
  /** A parse problem occurred (unknown tag, unbalanced block, bad expression, too deep). */
  structural: boolean;
  /** Input exceeded {@link MAX_TEMPLATE_LENGTH} and was not parsed. */
  tooLarge: boolean;
}

/** Largest template the reader will parse — a hard ceiling against hostile input. */
export const MAX_TEMPLATE_LENGTH = 64 * 1024;

/**
 * Extract the variables, filters, and fidelity of a pasted template by walking
 * the SAME AST `renderPreview` uses. Pure, never throws, never evaluates values
 * (so no pasted value is run). Adds no grammar the renderer can't already parse.
 */
export function extractTemplate(template: string, registry: FilterRegistry): TemplateExtraction {
  if (template.length > MAX_TEMPLATE_LENGTH) {
    return {
      variables: [],
      filters: [],
      loopVars: [],
      fidelity: 'unsupported',
      hasBlocks: false,
      structural: true,
      tooLarge: true,
    };
  }

  const diag: Diag = { structural: false, runtime: false };
  const variables: string[] = [];
  const loopVars: string[] = [];
  const filterNames: string[] = [];
  const filters: FilterUse[] = [];
  let hasBlocks = false;

  const addVar = (name: string, bound: Set<string>) => {
    if (bound.has(name) || variables.includes(name)) return;
    variables.push(name);
  };
  const addFilter = (name: string) => {
    if (filterNames.includes(name)) return;
    filterNames.push(name);
    const def = registry.get(name);
    filters.push({ name, tier: def ? def.fidelity : 'unsupported' });
  };
  /** Root variable of a `a.b.c` member chain (the thing the operator provides). */
  const rootVar = (e: Expr): string | null => {
    let cur = e;
    while (cur.e === 'member') cur = cur.obj;
    return cur.e === 'var' ? cur.name : null;
  };

  const walkExpr = (e: Expr, bound: Set<string>): void => {
    switch (e.e) {
      case 'lit':
        return;
      case 'var':
        addVar(e.name, bound);
        return;
      case 'not':
        walkExpr(e.x, bound);
        return;
      case 'and':
      case 'or':
      case 'cmp':
        walkExpr(e.l, bound);
        walkExpr(e.r, bound);
        return;
      case 'member': {
        const root = rootVar(e);
        if (root !== null) addVar(root, bound);
        else walkExpr(e.obj, bound);
        return;
      }
      case 'filter':
        walkExpr(e.src, bound);
        addFilter(e.name);
        for (const arg of e.args) walkExpr(arg, bound);
        return;
    }
  };

  const walkNodes = (nodes: Node[], bound: Set<string>): void => {
    for (const node of nodes) {
      switch (node.t) {
        case 'text':
          break;
        case 'out':
          walkExpr(node.expr, bound);
          break;
        case 'if':
          hasBlocks = true;
          for (const branch of node.branches) {
            walkExpr(branch.cond, bound);
            walkNodes(branch.body, bound);
          }
          if (node.alt) walkNodes(node.alt, bound);
          break;
        case 'for': {
          hasBlocks = true;
          walkExpr(node.iter, bound); // iterable is evaluated in the outer scope
          if (!loopVars.includes(node.name)) loopVars.push(node.name);
          const inner = new Set(bound);
          inner.add(node.name);
          walkNodes(node.body, inner);
          if (node.alt) walkNodes(node.alt, inner);
          break;
        }
      }
    }
  };

  try {
    walkNodes(parseTemplate(template, diag), new Set());
  } catch {
    diag.structural = true;
  }

  return {
    variables,
    filters,
    loopVars,
    fidelity: diag.structural ? 'unsupported' : registry.resolveFidelity(filterNames),
    hasBlocks,
    structural: diag.structural,
    tooLarge: false,
  };
}
