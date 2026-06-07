/**
 * Task discovery index at `/tasks` (issue #35).
 *
 * Aggregates the auto-registered curated library into scannable cards grouped by
 * network function, each showing the vendors it renders, behind a live text
 * filter. Pure aggregation — it reads the registry and never edits a task.
 *
 * Categories are derived HERE, not on task metadata, so this page owns its own
 * grouping and adds nothing to the task contract (and never touches `src/tasks`).
 * Any task whose slug isn't categorized below falls into the `other` group, so a
 * newly-added task still shows up.
 */
import { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import type { MessageKey } from '../i18n';
import { getTaskModule, listTaskSummaries } from '../tasks/registry';
import { taskVendors, type Vendor } from '../core/tasks/vendor';

/** Function groups in display order. Slugs not listed fall into `other`. */
const CATEGORIES: { id: string; slugs: string[] }[] = [
  { id: 'interfaces', slugs: ['interface-ip', 'interface-ranges'] },
  { id: 'switching', slugs: ['vlan'] },
  { id: 'routing', slugs: ['ospf', 'bgp-neighbor', 'static-routes', 'hsrp', 'vrrp'] },
  { id: 'policy', slugs: ['acl', 'prefix-lists', 'route-maps'] },
  { id: 'firewall', slugs: ['asa-interface', 'asa-acl', 'asa-access-group', 'asa-nat'] },
  { id: 'edge', slugs: ['cradlepoint-lan', 'cradlepoint-static-route'] },
  {
    id: 'management',
    slugs: [
      'device-basics',
      'aaa-servers',
      'ntp-auth',
      'syslog',
      'snmpv3',
      'ssh-hardening',
      'banners',
      'device-hardening',
      'junos-system',
    ],
  },
];

const CATEGORY_OF: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const cat of CATEGORIES) for (const slug of cat.slugs) map[slug] = cat.id;
  return map;
})();

const GROUP_ORDER = [...CATEGORIES.map((c) => c.id), 'other'];

interface IndexedTask {
  slug: string;
  title: string;
  description: string;
  vendors: Vendor[];
}

export function TasksIndexPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
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

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q.length === 0
        ? tasks
        : tasks.filter(
            (task) =>
              task.title.toLowerCase().includes(q) ||
              task.description.toLowerCase().includes(q) ||
              task.slug.includes(q),
          ),
    [tasks, q],
  );

  // Group filtered tasks by category, preserving display order; drop empty groups.
  const groups = useMemo(() => {
    const byCat = new Map<string, IndexedTask[]>();
    for (const task of filtered) {
      const cat = CATEGORY_OF[task.slug] ?? 'other';
      const list = byCat.get(cat) ?? [];
      list.push(task);
      byCat.set(cat, list);
    }
    return GROUP_ORDER.map((id) => ({ id, tasks: byCat.get(id) ?? [] })).filter(
      (g) => g.tasks.length > 0,
    );
  }, [filtered]);

  return (
    <section className="page page--tasks" aria-labelledby="tasks-title">
      <h1 id="tasks-title">{t('tasksIndex.title')}</h1>
      <p className="lede">{t('tasksIndex.lede')}</p>

      <div className="tasks-index__search">
        <label htmlFor={searchId}>{t('tasksIndex.searchLabel')}</label>{' '}
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('tasksIndex.searchPlaceholder')}
          autoComplete="off"
        />
      </div>

      <p className="tasks-index__count" role="status" aria-live="polite">
        {t('tasksIndex.resultsCount', { count: filtered.length })}
      </p>

      {groups.length === 0 ? (
        <p className="muted">{t('tasksIndex.empty')}</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.id}
            className="tasks-index__group"
            aria-labelledby={`cat-${group.id}`}
          >
            <h2 id={`cat-${group.id}`}>{t(`tasksIndex.category.${group.id}` as MessageKey)}</h2>
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
    </section>
  );
}
