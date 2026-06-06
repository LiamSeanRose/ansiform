import { describe, expect, it } from 'vitest';
import { extractTemplate, MAX_TEMPLATE_LENGTH, renderPreview } from './render';
import { createSeedRegistry } from '../filters/seed';

const registry = createSeedRegistry();
const extract = (tpl: string) => extractTemplate(tpl, registry);

describe('extractTemplate (#30 — one parser, two outputs)', () => {
  it('lists free variables in first-seen order', () => {
    const out = extract('interface {{ interface }}\n ip address {{ ip_address }}');
    expect(out.variables).toEqual(['interface', 'ip_address']);
    expect(out.fidelity).toBe('exact'); // no filters, clean parse
    expect(out.filters).toEqual([]);
    expect(out.hasBlocks).toBe(false);
  });

  it('reports filters with their fidelity tier (exact / approximate / unsupported)', () => {
    const out = extract("ip address {{ ip | ipaddr('address') }} {{ data | to_json }} {{ x | mystery }}");
    expect(out.filters).toEqual([
      { name: 'ipaddr', tier: 'exact' },
      { name: 'to_json', tier: 'approximate' },
      { name: 'mystery', tier: 'unsupported' },
    ]);
    // worst-case across filters drives the headline fidelity
    expect(out.fidelity).toBe('unsupported');
    // the variable, not the filter, is what the operator fills
    expect(out.variables).toEqual(['ip', 'data', 'x']);
  });

  it('surfaces the iterated list variable, not the loop-bound name', () => {
    const out = extract('{% for s in ntp_servers %}ntp server {{ s }}\n{% endfor %}');
    expect(out.variables).toEqual(['ntp_servers']);
    expect(out.loopVars).toEqual(['s']);
    expect(out.hasBlocks).toBe(true);
  });

  it('takes the root of a member chain as the variable', () => {
    const out = extract('{% for intf in interfaces %} description {{ intf.description }}\n{% endfor %}');
    expect(out.variables).toEqual(['interfaces']);
    expect(out.loopVars).toEqual(['intf']);
  });

  it('collects condition variables and de-dupes', () => {
    const out = extract('{% if enable_bfd %}bfd{% endif %}\n{% if enable_bfd %}more{% endif %}');
    expect(out.variables).toEqual(['enable_bfd']);
    expect(out.hasBlocks).toBe(true);
  });

  it('degrades to unsupported on an unknown tag', () => {
    const out = extract('{% set x = 1 %}{{ x }}');
    expect(out.structural).toBe(true);
    expect(out.fidelity).toBe('unsupported');
  });

  it('degrades on an unbalanced block', () => {
    expect(extract('{% if a %}no end').structural).toBe(true);
  });

  it('never throws and flags oversized input rather than parsing it', () => {
    const huge = 'x'.repeat(MAX_TEMPLATE_LENGTH + 1);
    const out = extract(huge);
    expect(out.tooLarge).toBe(true);
    expect(out.fidelity).toBe('unsupported');
    expect(out.variables).toEqual([]);
  });

  it('survives pathologically deep nesting without crashing', () => {
    const deep = '{% if a %}'.repeat(500) + 'x' + '{% endif %}'.repeat(500);
    const out = extract(deep);
    expect(out.structural).toBe(true); // depth guard tripped
    expect(out).toBeDefined();
  });

  it('agrees with the renderer it is factored from (same parse)', () => {
    // A template the renderer handles exactly should extract as exact too.
    const tpl = 'vlan {{ vlan_id }}\n{% if name %} name {{ name }}\n{% endif %}';
    expect(extract(tpl).fidelity).toBe('exact');
    expect(renderPreview(tpl, { vlan_id: 10, name: 'SALES' }, registry).fidelity).toBe('exact');
  });
});
