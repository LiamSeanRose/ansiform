import { describe, expect, it } from 'vitest';
import {
  availableVendors,
  categoryCounts,
  filterTasks,
  matchesQuery,
  matchesVendors,
  type IndexedTask,
} from './tasks-index-filter';
import type { Vendor } from '../core/tasks/vendor';

// Real slugs so categoryOf resolves: ospf→routing, vlan→switching, asa-nat→firewall.
const tasks: IndexedTask[] = [
  { slug: 'ospf', title: 'OSPF', description: 'link-state routing', vendors: ['cisco-ios'] },
  { slug: 'vlan', title: 'VLAN', description: 'switching', vendors: ['cisco-ios', 'cisco-nxos'] },
  { slug: 'asa-nat', title: 'ASA NAT', description: 'firewall nat', vendors: ['cisco-asa'] },
  { slug: 'junos-bgp', title: 'Junos BGP', description: 'bgp', vendors: ['juniper-junos'] },
];
const noVendors: ReadonlySet<Vendor> = new Set();

describe('tasks-index filtering (#92)', () => {
  it('matchesQuery: empty matches all; matches title/description/slug, case-insensitive', () => {
    expect(matchesQuery(tasks[0], '')).toBe(true);
    expect(matchesQuery(tasks[0], 'OSPF')).toBe(true);
    expect(matchesQuery(tasks[0], 'link-state')).toBe(true);
    expect(matchesQuery(tasks[2], 'asa-nat')).toBe(true);
    expect(matchesQuery(tasks[0], 'bgp')).toBe(false);
  });

  it('matchesVendors: empty selection matches all; otherwise OR over vendors', () => {
    expect(matchesVendors(tasks[1], noVendors)).toBe(true);
    expect(matchesVendors(tasks[1], new Set<Vendor>(['cisco-nxos']))).toBe(true);
    expect(matchesVendors(tasks[0], new Set<Vendor>(['cisco-nxos']))).toBe(false);
  });

  it('filterTasks: combines query + vendors + category as AND', () => {
    expect(filterTasks(tasks, { query: '', vendors: noVendors, category: 'all' })).toHaveLength(4);
    expect(
      filterTasks(tasks, { query: '', vendors: noVendors, category: 'routing' }).map((t) => t.slug),
    ).toEqual(['ospf', 'junos-bgp']);
    expect(
      filterTasks(tasks, {
        query: '',
        vendors: new Set<Vendor>(['cisco-asa']),
        category: 'all',
      }).map((t) => t.slug),
    ).toEqual(['asa-nat']);
    // query + category together
    expect(
      filterTasks(tasks, { query: 'bgp', vendors: noVendors, category: 'routing' }).map(
        (t) => t.slug,
      ),
    ).toEqual(['junos-bgp']);
  });

  it('categoryCounts: per-category counts under text+vendor scope, with an all total', () => {
    const counts = categoryCounts(tasks, { query: '', vendors: noVendors });
    expect(counts.get('all')).toBe(4);
    expect(counts.get('routing')).toBe(2);
    expect(counts.get('switching')).toBe(1);
    expect(counts.get('firewall')).toBe(1);

    const scoped = categoryCounts(tasks, { query: '', vendors: new Set<Vendor>(['cisco-ios']) });
    expect(scoped.get('all')).toBe(2); // ospf + vlan
    expect(scoped.get('firewall')).toBeUndefined();
  });

  it('availableVendors: present vendors, in the given canonical order', () => {
    const order: Vendor[] = ['cisco-ios', 'cisco-nxos', 'cisco-asa', 'juniper-junos', 'vyos'];
    expect(availableVendors(tasks, order)).toEqual([
      'cisco-ios',
      'cisco-nxos',
      'cisco-asa',
      'juniper-junos',
    ]);
  });
});
