/**
 * Function categories for the task library — shared by the `/tasks` index (#35)
 * and the related-task crosslinks on each task page (#62).
 *
 * Grouping is derived here, not on task metadata, so adding a task stays just a
 * folder. A task slug not listed falls into `other` (graceful — the index and the
 * crosslinks still render it), so this map never *blocks* the disjoint fan-out; it
 * is filled in as a follow-up to keep discovery tidy.
 */
export const CATEGORIES: { id: string; slugs: string[] }[] = [
  { id: 'interfaces', slugs: ['interface-ip', 'interface-ranges', 'etherchannel'] },
  { id: 'switching', slugs: ['vlan', 'spanning-tree'] },
  {
    id: 'routing',
    slugs: [
      'ospf',
      'bgp-neighbor',
      'static-routes',
      'hsrp',
      'vrrp',
      'vrf',
      'junos-static-routes',
      'junos-ospf',
      'junos-bgp',
    ],
  },
  { id: 'policy', slugs: ['acl', 'prefix-lists', 'route-maps', 'ios-nat'] },
  {
    id: 'firewall',
    slugs: ['asa-interface', 'asa-acl', 'asa-objects', 'asa-access-group', 'asa-nat', 'asa-management'],
  },
  {
    id: 'edge',
    slugs: [
      'cradlepoint-lan',
      'cradlepoint-static-route',
      'cradlepoint-wan',
      'cradlepoint-firewall',
      'cradlepoint-tunnel',
    ],
  },
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

/** Category display order, with `other` last for any uncategorized task. */
export const GROUP_ORDER = [...CATEGORIES.map((c) => c.id), 'other'];

/** The function category a task belongs to, or `other`. */
export function categoryOf(slug: string): string {
  return CATEGORY_OF[slug] ?? 'other';
}

/** Other task slugs in the same category — the crosslink set for a task page. */
export function relatedSlugs(slug: string): string[] {
  const cat = CATEGORY_OF[slug];
  if (cat === undefined) return [];
  return (CATEGORIES.find((c) => c.id === cat)?.slugs ?? []).filter((s) => s !== slug);
}
