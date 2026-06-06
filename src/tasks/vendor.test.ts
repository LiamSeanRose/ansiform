import { describe, expect, it } from 'vitest';
import { DEFAULT_VENDOR, listTaskSummaries, vendorOf } from './registry';
import { task as interfaceIp } from './interface-ip';

describe('vendor seam (#21)', () => {
  it('defaults to cisco-ios', () => {
    expect(DEFAULT_VENDOR).toBe('cisco-ios');
    expect(vendorOf({})).toBe('cisco-ios');
    expect(vendorOf({ vendor: undefined })).toBe('cisco-ios');
    expect(vendorOf({ vendor: 'cisco-ios' })).toBe('cisco-ios');
  });

  it('leaves existing tasks vendor-less, resolving to the default', () => {
    // Additive: the curated v1 tasks declare no vendor and must keep working.
    expect(interfaceIp.definition.vendor).toBeUndefined();
    expect(vendorOf(interfaceIp.definition)).toBe('cisco-ios');
  });

  it('surfaces a concrete vendor on every task summary', () => {
    const summaries = listTaskSummaries();
    expect(summaries.length).toBeGreaterThan(0);
    for (const summary of summaries) {
      expect(summary.vendor).toBe('cisco-ios');
    }
  });
});
