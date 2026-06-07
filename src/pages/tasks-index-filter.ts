/**
 * Pure filtering/grouping logic for the Task Library (#92).
 *
 * Kept framework-free and side-effect-free so the page's filter behaviour is unit
 * testable without rendering React. The page owns state + scroll-spy; this owns
 * "which tasks match" and "how many per category".
 */
import type { Vendor } from '../core/tasks/vendor';
import { categoryOf } from '../tasks/categories';

export interface IndexedTask {
  slug: string;
  title: string;
  description: string;
  vendors: Vendor[];
}

export interface TaskFilterState {
  query: string;
  /** Selected platform filter; empty set ⇒ no vendor constraint. */
  vendors: ReadonlySet<Vendor>;
  /** `'all'` or a category id. */
  category: string;
}

/** Text match over title/description/slug. Empty query matches all. */
export function matchesQuery(task: IndexedTask, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (
    task.title.toLowerCase().includes(q) ||
    task.description.toLowerCase().includes(q) ||
    task.slug.includes(q)
  );
}

/** Vendor match: empty selection matches all; otherwise OR over selected vendors. */
export function matchesVendors(task: IndexedTask, vendors: ReadonlySet<Vendor>): boolean {
  if (vendors.size === 0) return true;
  return task.vendors.some((v) => vendors.has(v));
}

/** Apply text + vendor + category filters (all AND). */
export function filterTasks(tasks: readonly IndexedTask[], f: TaskFilterState): IndexedTask[] {
  return tasks.filter(
    (t) =>
      matchesQuery(t, f.query) &&
      matchesVendors(t, f.vendors) &&
      (f.category === 'all' || categoryOf(t.slug) === f.category),
  );
}

/**
 * Tasks per category under the text+vendor filters only (ignoring the category
 * selection), so sidebar counts reflect the current search/vendor scope. The
 * `all` key holds the grand total.
 */
export function categoryCounts(
  tasks: readonly IndexedTask[],
  f: Pick<TaskFilterState, 'query' | 'vendors'>,
): Map<string, number> {
  const counts = new Map<string, number>();
  let all = 0;
  for (const t of tasks) {
    if (!matchesQuery(t, f.query) || !matchesVendors(t, f.vendors)) continue;
    all += 1;
    const cat = categoryOf(t.slug);
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  counts.set('all', all);
  return counts;
}

/** Vendors present in the library, in the given canonical order, for the chip row. */
export function availableVendors(
  tasks: readonly IndexedTask[],
  order: readonly Vendor[],
): Vendor[] {
  const present = new Set<Vendor>();
  for (const t of tasks) for (const v of t.vendors) present.add(v);
  return order.filter((v) => present.has(v));
}
