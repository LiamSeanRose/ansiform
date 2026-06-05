import { describe, expect, it } from 'vitest';
import { load } from 'js-yaml';
import { GROUP_VARS_YAML_ID, groupVarsYamlSink, toYaml } from './yaml';
import type { Field, FormSchema, FormValues } from '../types';

/** Wrap loose fields into a single-group schema. */
const schemaOf = (...fields: Field[]): FormSchema => ({ groups: [{ fields }] });

/** Render values against a schema and return just the YAML string. */
const render = (schema: FormSchema, values: FormValues): string =>
  groupVarsYamlSink.render({ schema, values }).content;

describe('groupVarsYamlSink', () => {
  it('exposes a stable id and contentType', () => {
    expect(groupVarsYamlSink.id).toBe(GROUP_VARS_YAML_ID);
    const artifact = groupVarsYamlSink.render({
      schema: schemaOf({ type: 'text', name: 'a', label: 'A' }),
      values: { a: 'x' },
    });
    expect(artifact.contentType).toBe('text/yaml');
  });

  describe('types', () => {
    it('emits booleans unquoted', () => {
      const schema = schemaOf(
        { type: 'boolean', name: 'enabled', label: 'Enabled' },
        { type: 'boolean', name: 'shutdown', label: 'Shutdown' },
      );
      expect(render(schema, { enabled: true, shutdown: false })).toBe(
        'enabled: true\nshutdown: false\n',
      );
    });

    it('emits numbers as bare numbers, including zero', () => {
      const schema = schemaOf(
        { type: 'number', name: 'vlan_id', label: 'VLAN' },
        { type: 'number', name: 'cost', label: 'Cost' },
      );
      expect(render(schema, { vlan_id: 100, cost: 0 })).toBe('vlan_id: 100\ncost: 0\n');
    });

    it('leaves plain strings unquoted', () => {
      const schema = schemaOf({ type: 'text', name: 'description', label: 'Description' });
      expect(render(schema, { description: 'core uplink' })).toBe('description: core uplink\n');
    });

    it('quotes strings that would otherwise parse as another type', () => {
      const schema = schemaOf(
        { type: 'text', name: 'looks_bool', label: 'B' },
        { type: 'text', name: 'looks_num', label: 'N' },
      );
      // Without quotes these would round-trip as a boolean / number.
      expect(render(schema, { looks_bool: 'true', looks_num: '123' })).toBe(
        "looks_bool: 'true'\nlooks_num: '123'\n",
      );
    });

    it('serializes a secret value as an ordinary string', () => {
      const schema = schemaOf({ type: 'secret', name: 'snmp_community', label: 'Community' });
      expect(render(schema, { snmp_community: 's3cr3t' })).toBe('snmp_community: s3cr3t\n');
    });

    it('does not fold long scalar values across lines', () => {
      const schema = schemaOf({ type: 'text', name: 'peers', label: 'Peers' });
      const peers = Array.from({ length: 12 }, (_, i) => `10.0.0.${i + 1}`).join(', ');
      const out = render(schema, { peers });
      expect(out).toBe(`peers: ${peers}\n`);
      expect(out.trimEnd().split('\n')).toHaveLength(1);
    });
  });

  describe('default(omit) semantics', () => {
    it('omits an omitWhenBlank field that is undefined', () => {
      const schema = schemaOf({
        type: 'text',
        name: 'description',
        label: 'Description',
        omitWhenBlank: true,
      });
      expect(render(schema, {})).toBe('{}\n');
    });

    it('omits an omitWhenBlank field that is an empty string', () => {
      const schema = schemaOf({
        type: 'text',
        name: 'description',
        label: 'Description',
        omitWhenBlank: true,
      });
      expect(render(schema, { description: '' })).toBe('{}\n');
    });

    it('never omits a real boolean false, even when omitWhenBlank', () => {
      const schema = schemaOf({
        type: 'boolean',
        name: 'enabled',
        label: 'Enabled',
        omitWhenBlank: true,
      });
      expect(render(schema, { enabled: false })).toBe('enabled: false\n');
    });

    it('never omits a numeric zero, even when omitWhenBlank', () => {
      const schema = schemaOf({
        type: 'number',
        name: 'cost',
        label: 'Cost',
        omitWhenBlank: true,
      });
      expect(render(schema, { cost: 0 })).toBe('cost: 0\n');
    });

    it('emits an explicit null for a blank field that is NOT omitWhenBlank', () => {
      const schema = schemaOf({ type: 'text', name: 'description', label: 'Description' });
      expect(render(schema, {})).toBe('description: null\n');
    });

    it('emits an empty string for a blank, non-omit string field', () => {
      const schema = schemaOf({ type: 'text', name: 'description', label: 'Description' });
      expect(render(schema, { description: '' })).toBe("description: ''\n");
    });

    it('keeps present keys while omitting only the blank omit fields', () => {
      const schema = schemaOf(
        { type: 'text', name: 'name', label: 'Name' },
        { type: 'text', name: 'description', label: 'Description', omitWhenBlank: true },
        { type: 'number', name: 'mtu', label: 'MTU', omitWhenBlank: true },
      );
      expect(render(schema, { name: 'Gig0/1', description: '', mtu: 9000 })).toBe(
        'name: Gig0/1\nmtu: 9000\n',
      );
    });
  });

  describe('object shaping', () => {
    it('preserves schema field order across groups', () => {
      const schema: FormSchema = {
        groups: [
          { fields: [{ type: 'text', name: 'b', label: 'B' }] },
          {
            fields: [
              { type: 'text', name: 'a', label: 'A' },
              { type: 'text', name: 'c', label: 'C' },
            ],
          },
        ],
      };
      expect(render(schema, { a: '1', b: '2', c: '3' })).toBe('b: \'2\'\na: \'1\'\nc: \'3\'\n');
    });

    it('ignores values with no matching schema field', () => {
      const schema = schemaOf({ type: 'text', name: 'kept', label: 'Kept' });
      expect(render(schema, { kept: 'keepme', stray: 'should-not-leak' })).toBe('kept: keepme\n');
    });

    it('renders an empty document when every field is omitted', () => {
      const schema = schemaOf({
        type: 'text',
        name: 'description',
        label: 'D',
        omitWhenBlank: true,
      });
      expect(render(schema, {})).toBe('{}\n');
    });
  });

  describe('suggested filename from scope', () => {
    const schema = schemaOf({ type: 'text', name: 'a', label: 'A' });
    const values = { a: 'x' };

    it('defaults to group_vars/all.yml with no scope', () => {
      expect(groupVarsYamlSink.render({ schema, values }).filename).toBe('group_vars/all.yml');
    });

    it('uses group_vars/<name>.yml for a group scope', () => {
      const artifact = groupVarsYamlSink.render({
        schema,
        values,
        scope: { kind: 'group', name: 'core-switches' },
      });
      expect(artifact.filename).toBe('group_vars/core-switches.yml');
    });

    it('uses host_vars/<name>.yml for a host scope', () => {
      const artifact = groupVarsYamlSink.render({
        schema,
        values,
        scope: { kind: 'host', name: 'rtr01' },
      });
      expect(artifact.filename).toBe('host_vars/rtr01.yml');
    });
  });

  describe('golden file + round-trip', () => {
    // A representative interface task: a mix of every field type, an omitted
    // blank optional field, and a string that needs quoting.
    const schema: FormSchema = {
      groups: [
        {
          legend: 'Interface',
          fields: [
            { type: 'text', name: 'interface', label: 'Interface' },
            { type: 'text', name: 'description', label: 'Description', omitWhenBlank: true },
            { type: 'text', name: 'ip_address', label: 'IP' },
            { type: 'number', name: 'mtu', label: 'MTU', omitWhenBlank: true },
            { type: 'boolean', name: 'enabled', label: 'Enabled' },
            {
              type: 'select',
              name: 'duplex',
              label: 'Duplex',
              options: [
                { value: 'auto', label: 'Auto' },
                { value: 'full', label: 'Full' },
              ],
            },
          ],
        },
      ],
    };
    const values: FormValues = {
      interface: 'GigabitEthernet0/1',
      description: '', // omitted
      ip_address: '10.0.0.1 255.255.255.0',
      mtu: 1500,
      enabled: true,
      duplex: 'auto',
    };

    const GOLDEN = [
      'interface: GigabitEthernet0/1',
      'ip_address: 10.0.0.1 255.255.255.0',
      'mtu: 1500',
      'enabled: true',
      'duplex: auto',
      '',
    ].join('\n');

    it('matches the golden YAML exactly', () => {
      expect(render(schema, values)).toBe(GOLDEN);
    });

    it('round-trips back to the expected object (no description key)', () => {
      const parsed = load(render(schema, values));
      expect(parsed).toEqual({
        interface: 'GigabitEthernet0/1',
        ip_address: '10.0.0.1 255.255.255.0',
        mtu: 1500,
        enabled: true,
        duplex: 'auto',
      });
    });
  });

  describe('toYaml', () => {
    it('serializes a pre-built object with stable options', () => {
      expect(toYaml({ a: 1, b: 'two', c: true })).toBe('a: 1\nb: two\nc: true\n');
    });

    it('renders an empty object as {}', () => {
      expect(toYaml({})).toBe('{}\n');
    });
  });
});
