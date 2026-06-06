import { describe, expect, it } from 'vitest';
import { buildExtractedSchema } from './edit-schema';
import { initialValues } from '../../components/form';
import { buildVars, toYaml } from '../../core/output/yaml';

const fieldsOf = (variables: string[]) => buildExtractedSchema(variables, 'L').groups[0].fields;

describe('buildExtractedSchema (#31 — all-text, no inference)', () => {
  it('makes every plain variable a text field tagged data-source=extracted', () => {
    const fields = fieldsOf(['interface', 'ip_address', 'vlan_id']);
    expect(fields.map((f) => f.type)).toEqual(['text', 'text', 'text']);
    expect(fields.every((f) => f.dataSource === 'extracted')).toBe(true);
    // Honesty: omit-on-blank so unfilled vars never appear as null scaffolding.
    expect(fields.every((f) => f.omitWhenBlank === true)).toBe(true);
    // The label IS the raw variable name (shown verbatim by the reader's t()).
    expect(fields.map((f) => f.label)).toEqual(['interface', 'ip_address', 'vlan_id']);
  });

  it('infers NO type/format/validation from usage — names that look numeric stay text', () => {
    const fields = fieldsOf(['vlan_id', 'mtu', 'priority']);
    for (const f of fields) {
      expect(f.type).toBe('text');
      // No defaults, no required, no pattern — nothing inferred.
      expect('default' in f).toBe(false);
      expect(f.required).toBeUndefined();
      expect((f as { pattern?: string }).pattern).toBeUndefined();
    }
  });

  it('masks credential-named variables as secret fields (§5 outranks all-text)', () => {
    const fields = fieldsOf(['snmp_community', 'bgp_password', 'router_id']);
    expect(fields.map((f) => f.type)).toEqual(['secret', 'secret', 'text']);
    // Even secret-typed extracted fields keep the provenance marker.
    expect(fields.every((f) => f.dataSource === 'extracted')).toBe(true);
  });

  it('never pre-fills a value: a fresh schema seeds blank, exports empty YAML', () => {
    const schema = buildExtractedSchema(['interface', 'snmp_community'], 'L');
    const values = initialValues(schema);
    // Text field unseeded (undefined); secret never seeded.
    expect(values.interface).toBeUndefined();
    expect(values.snmp_community).toBeUndefined();
    // Omit-on-blank ⇒ no keys at all until the operator types something.
    expect(buildVars(schema, values)).toEqual({});
  });

  it('exports only the variables the operator filled — vars only, byte-correct', () => {
    const schema = buildExtractedSchema(['interface', 'ip_address'], 'L');
    const yaml = toYaml(buildVars(schema, { interface: 'Gig0/1' }));
    expect(yaml).toBe('interface: Gig0/1\n');
  });
});
