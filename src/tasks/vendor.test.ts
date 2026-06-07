import { describe, expect, it } from 'vitest';
import { DEFAULT_VENDOR, listTaskSummaries, vendorOf } from './registry';
import {
  taskVendors,
  templateForVendor,
  vendorTemplateApproximate,
} from '../core/tasks/vendor';
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
    const known = ['cisco-ios', 'cisco-iosxe', 'cisco-nxos', 'arista-eos', 'cisco-asa'];
    for (const summary of summaries) {
      // Never undefined — a summary always resolves a concrete platform (#21).
      expect(summary.vendor).toBeDefined();
      expect(known).toContain(summary.vendor);
    }
    // The library now spans more than one platform: the IOS-family tasks plus the
    // cisco-asa firewall family (#38).
    const vendors = new Set(summaries.map((s) => s.vendor));
    expect(vendors.has('cisco-ios')).toBe(true);
    expect(vendors.has('cisco-asa')).toBe(true);
  });
});

describe('per-vendor preview overlay (#27)', () => {
  it('lists the base vendor first, then declared overrides', () => {
    expect(taskVendors(interfaceIp.definition)).toEqual([
      'cisco-ios',
      'cisco-iosxe',
      'cisco-nxos',
      'arista-eos',
    ]);
  });

  it('returns a single-element list (no selector) for a base-only task', () => {
    expect(taskVendors({ template: 'x' })).toEqual(['cisco-ios']);
  });

  it('never lists the base vendor twice even if it appears in templates', () => {
    const def = { template: 'base', templates: { 'cisco-ios': 'dup' } } as const;
    expect(taskVendors(def)).toEqual(['cisco-ios']);
  });

  it('resolves the override template, falling back to the base template', () => {
    const def = { template: 'BASE', templates: { 'cisco-nxos': 'NXOS' } } as const;
    expect(templateForVendor(def, 'cisco-ios')).toBe('BASE');
    expect(templateForVendor(def, 'cisco-nxos')).toBe('NXOS');
    // A vendor with no override falls back to base (the workbench never offers it).
    expect(templateForVendor(def, 'arista-eos')).toBe('BASE');
  });

  it('reads the fidelity flag: bare strings are exact, flagged objects approximate', () => {
    const def = {
      template: 'BASE',
      templates: {
        'cisco-iosxe': 'XE', // bare string → exact
        'cisco-nxos': { template: 'NXOS', fidelity: 'approximate' as const },
        'arista-eos': { template: 'EOS' }, // object without flag → exact
      },
    } as const;
    expect(vendorTemplateApproximate(def, 'cisco-ios')).toBe(false);
    expect(vendorTemplateApproximate(def, 'cisco-iosxe')).toBe(false);
    expect(vendorTemplateApproximate(def, 'cisco-nxos')).toBe(true);
    expect(vendorTemplateApproximate(def, 'arista-eos')).toBe(false);
  });

  it('treats the IOS-XE proof tasks as an exact, same-CLI claim', () => {
    // interface-ip declares cisco-iosxe reusing the base template verbatim.
    expect(templateForVendor(interfaceIp.definition, 'cisco-iosxe')).toBe(
      interfaceIp.definition.template,
    );
    expect(vendorTemplateApproximate(interfaceIp.definition, 'cisco-iosxe')).toBe(false);
  });

  it('flags the divergent NX-OS/EOS interface previews as approximate', () => {
    // interface-ip ships a prefix-length template for NX-OS/EOS, not the IOS one.
    expect(templateForVendor(interfaceIp.definition, 'cisco-nxos')).not.toBe(
      interfaceIp.definition.template,
    );
    expect(vendorTemplateApproximate(interfaceIp.definition, 'cisco-nxos')).toBe(true);
    expect(vendorTemplateApproximate(interfaceIp.definition, 'arista-eos')).toBe(true);
  });
});
