/**
 * Run recipe — the "now what?" guidance for a generated var-file set (#83).
 *
 * A correct var file is inert until it is wired into a run. This pure builder
 * turns the artifact path(s) + scope(s) (and the inventory file from #81 when a
 * composed set has one) into two pieces of copyable guidance:
 *  - an ASCII **directory tree** showing where the files sit, and
 *  - the literal `ansible-playbook` **command** to run them.
 *
 * Spine (council §4, scope discipline): this is **documentation, not execution**.
 * Every name here is one the user entered or a file we already generate; the
 * `playbook.yml` it references is the user's OWN — we deliberately do NOT emit a
 * runnable playbook (that stays deferred). Pure: no persistence, no network.
 */
import type { TaskScope } from '../tasks/types';

/** The user's playbook filename — referenced, never generated. */
export const DEFAULT_PLAYBOOK = 'playbook.yml';

export interface RunRecipeInput {
  /** Var-file paths in the set, e.g. `['group_vars/all.yml', 'host_vars/r1.yml']`. */
  files: readonly string[];
  /** Scopes the files target — drives the `--limit` hint. */
  scopes: readonly TaskScope[];
  /**
   * Generated inventory filename (#81), when the set has one. When omitted the
   * command references a generic `inventory` the user already maintains, and the
   * tree shows only the files we actually generate.
   */
  inventory?: string;
  /** The user's playbook filename. Defaults to {@link DEFAULT_PLAYBOOK}. */
  playbook?: string;
}

export interface RunRecipe {
  /** ASCII directory tree of where the files sit, rooted at `.`. */
  tree: string;
  /** The `ansible-playbook` invocation. */
  command: string;
}

interface TreeNode {
  children: Map<string, TreeNode>;
  isFile: boolean;
}

function newNode(isFile: boolean): TreeNode {
  return { children: new Map(), isFile };
}

/** Insert a `/`-separated path into the tree, preserving first-seen order. */
function insertPath(root: TreeNode, path: string): void {
  const segments = path.split('/').filter((s) => s !== '');
  let node = root;
  segments.forEach((segment, i) => {
    const isFile = i === segments.length - 1;
    let child = node.children.get(segment);
    if (!child) {
      child = newNode(isFile);
      node.children.set(segment, child);
    }
    node = child;
  });
}

/** Render a tree node's children as ASCII lines under the given prefix. */
function renderChildren(node: TreeNode, prefix: string, out: string[]): void {
  const entries = [...node.children.entries()];
  entries.forEach(([name, child], i) => {
    const last = i === entries.length - 1;
    out.push(`${prefix}${last ? '└── ' : '├── '}${name}${child.isFile ? '' : '/'}`);
    renderChildren(child, `${prefix}${last ? '    ' : '│   '}`, out);
  });
}

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
 * Build the run recipe, or `null` when there is nothing to wire (no files). The
 * tree lists, in order: the inventory (if generated), the var files, then the
 * user's playbook. The command targets the named non-`all` scopes via `--limit`
 * (the implicit `all` group needs none).
 */
export function buildRunRecipe(input: RunRecipeInput): RunRecipe | null {
  const files = input.files.filter((f) => f.trim() !== '');
  if (files.length === 0) return null;

  const playbook = input.playbook ?? DEFAULT_PLAYBOOK;
  const inventoryName = input.inventory?.trim();

  // Directory tree: inventory first (root), then var files, then the playbook.
  const root = newNode(false);
  if (inventoryName) insertPath(root, inventoryName);
  for (const file of files) insertPath(root, file);
  insertPath(root, playbook);
  const treeLines = ['.'];
  renderChildren(root, '', treeLines);

  // Command: `--limit` lists the specific groups/hosts; `all` is the whole
  // inventory, so it adds no limit.
  const targets = dedupePreservingOrder(
    input.scopes.map((s) => s.name.trim()).filter((n) => n !== '' && n !== 'all'),
  );
  const limit = targets.length > 0 ? ` --limit '${targets.join(':')}'` : '';
  const command = `ansible-playbook -i ${inventoryName ?? 'inventory'} ${playbook}${limit}`;

  return { tree: treeLines.join('\n'), command };
}
