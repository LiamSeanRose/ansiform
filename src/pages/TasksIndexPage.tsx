/**
 * Task discovery index at `/tasks` (issue #35; nav + filters polished in #92).
 *
 * Two-column layout: a sticky category sidebar (with counts) on the left and the
 * card grid on the right, behind a text search + multi-select vendor chips.
 * Clicking a category FILTERS the grid to it; with "All" selected the grid shows
 * every category and the sidebar scroll-spy-highlights the section in view (a
 * purely visual cue — the chosen filter, marked `aria-current`, stays "All").
 *
 * Pure aggregation — it reads the registry and never edits a task. Categories are
 * derived here (see `tasks-index-filter`), so the page adds nothing to the task
 * contract and never touches `src/tasks`.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import type { MessageKey } from '../i18n';
import { getTaskModule, listTaskSummaries } from '../tasks/registry';
import { taskVendors, type Vendor } from '../core/tasks/vendor';
import { GROUP_ORDER, categoryOf } from '../tasks/categories';
import {
  availableVendors,
  categoryCounts,
  filterTasks,
  type IndexedTask,
} from './tasks-index-filter';

// Canonical vendor order for the chip row (mirrors the vendor label set).
const VENDOR_ORDER: Vendor[] = [
  'cisco-ios',
  'cisco-iosxe',
  'cisco-nxos',
  'arista-eos',
  'cisco-asa',
  'cisco-iosxr',
  'juniper-junos',
  'vyos',
  'huawei-vrp',
  'cradlepoint-ncos',
];

export function TasksIndexPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  // Seed the category from a `?category=` deep link (breadcrumb target, #92) —
  // allowlisted to known categories, else "All". Read once on mount.
  const [category, setCategory] = useState(() => {
    const c = searchParams.get('category');
    return c && (c === 'all' || GROUP_ORDER.includes(c)) ? c : 'all';
  });
  const [vendors, setVendors] = useState<ReadonlySet<Vendor>>(new Set());
  const [inView, setInView] = useState<string | null>(null);
  const searchId = useId();

  useEffect(() => {
    const prev = document.title;
    document.title = `${t('tasksIndex.title')} · Ansiform`;
    return () => {
      document.title = prev;
    };
  }, [t]);

  // Read the registry once: each task with the vendors its previews cover.
  const tasks = useMemo<IndexedTask[]>(
    () =>
      listTaskSummaries().map((s) => {
        const mod = getTaskModule(s.slug);
        return {
          slug: s.slug,
          title: s.title,
          description: s.description,
          vendors: mod ? taskVendors(mod.definition) : [],
        };
      }),
    [],
  );

  const filtered = useMemo(
    () => filterTasks(tasks, { query, vendors, category }),
    [tasks, query, vendors, category],
  );
  // Counts reflect the text+vendor scope (not the category selection itself).
  const counts = useMemo(() => categoryCounts(tasks, { query, vendors }), [tasks, query, vendors]);
  const vendorChips = useMemo(() => availableVendors(tasks, VENDOR_ORDER), [tasks]);

  // Categories to list in the sidebar: those with a non-zero count in scope.
  const navCats = GROUP_ORDER.filter((id) => (counts.get(id) ?? 0) > 0);

  // Group the filtered tasks by category for display (preserving order).
  const groups = useMemo(() => {
    const byCat = new Map<string, IndexedTask[]>();
    for (const task of filtered) {
      const cat = categoryOf(task.slug);
      const list = byCat.get(cat) ?? [];
      list.push(task);
      byCat.set(cat, list);
    }
    return GROUP_ORDER.map((id) => ({ id, tasks: byCat.get(id) ?? [] })).filter(
      (g) => g.tasks.length > 0,
    );
  }, [filtered]);

  // Scroll-spy (only meaningful with "All" selected, where every section shows).
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const intersecting = useRef(new Set<string>());
  useEffect(() => {
    if (category !== 'all' || typeof IntersectionObserver === 'undefined') {
      setInView(null);
      return;
    }
    intersecting.current.clear();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const cat = (e.target as HTMLElement).dataset.cat;
          if (!cat) continue;
          if (e.isIntersecting) intersecting.current.add(cat);
          else intersecting.current.delete(cat);
        }
        setInView(GROUP_ORDER.find((id) => intersecting.current.has(id)) ?? null);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
    );
    for (const el of sectionRefs.current.values()) obs.observe(el);
    return () => obs.disconnect();
  }, [category, groups]);

  const hasFilters = query.trim() !== '' || vendors.size > 0 || category !== 'all';

  const toggleVendor = (v: Vendor) =>
    setVendors((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  const clearAll = () => {
    setQuery('');
    setVendors(new Set());
    setCategory('all');
  };

  const catLabel = (id: string) => t(`tasksIndex.category.${id}` as MessageKey);

  return (
    <section className="page page--tasks" aria-labelledby="tasks-title">
      <h1 id="tasks-title">{t('tasksIndex.title')}</h1>
      <p className="lede">{t('tasksIndex.lede')}</p>

      <div className="tasks-index__toolbar">
        <div className="tasks-index__search">
          <label htmlFor={searchId}>{t('tasksIndex.searchLabel')}</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('tasksIndex.searchPlaceholder')}
            autoComplete="off"
          />
        </div>

        {vendorChips.length > 1 && (
          <div
            className="tasks-index__chips"
            role="group"
            aria-label={t('tasksIndex.vendorFilterLabel')}
          >
            {vendorChips.map((v) => (
              <button
                key={v}
                type="button"
                className="tasks-index__chip"
                aria-pressed={vendors.has(v)}
                onClick={() => toggleVendor(v)}
              >
                {t(`vendor.${v}` as MessageKey)}
              </button>
            ))}
          </div>
        )}

        {hasFilters && (
          <button type="button" className="tasks-index__clear" onClick={clearAll}>
            {t('tasksIndex.clearFilters')}
          </button>
        )}
      </div>

      <p className="tasks-index__count" role="status" aria-live="polite">
        {t('tasksIndex.resultsCount', { count: filtered.length })}
      </p>

      <div className="tasks-index__layout">
        <nav className="tasks-index__sidebar" aria-label={t('tasksIndex.categoriesLabel')}>
          <ul className="tasks-index__nav">
            <li>
              <button
                type="button"
                className="tasks-index__nav-link"
                aria-current={category === 'all' ? 'true' : undefined}
                onClick={() => setCategory('all')}
              >
                <span>{t('tasksIndex.allCategories')}</span>
                <span className="tasks-index__nav-count">{counts.get('all') ?? 0}</span>
              </button>
            </li>
            {navCats.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={
                    'tasks-index__nav-link' +
                    (category === 'all' && inView === id ? ' is-inview' : '')
                  }
                  aria-current={category === id ? 'true' : undefined}
                  onClick={() => setCategory(id)}
                >
                  <span>{catLabel(id)}</span>
                  <span className="tasks-index__nav-count">{counts.get(id) ?? 0}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="tasks-index__content">
          {groups.length === 0 ? (
            <p className="muted tasks-index__empty">{t('tasksIndex.empty')}</p>
          ) : (
            groups.map((group) => (
              <section
                key={group.id}
                className="tasks-index__group"
                aria-labelledby={`cat-${group.id}`}
                data-cat={group.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(group.id, el);
                  else sectionRefs.current.delete(group.id);
                }}
              >
                <h2 id={`cat-${group.id}`}>{catLabel(group.id)}</h2>
                <ul className="task-list">
                  {group.tasks.map((task) => (
                    <li key={task.slug} className="task-list__item">
                      <Link className="task-list__link" to={`/tasks/${task.slug}`}>
                        {task.title}
                      </Link>
                      <p className="task-list__desc muted">{task.description}</p>
                      {task.vendors.length > 0 && (
                        <p className="tasks-index__vendors">
                          <span className="tasks-index__vendors-label">
                            {t('tasksIndex.vendorsLabel')}
                          </span>{' '}
                          {task.vendors.map((v) => (
                            <span key={v} className="tasks-index__badge">
                              {t(`vendor.${v}` as MessageKey)}
                            </span>
                          ))}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
