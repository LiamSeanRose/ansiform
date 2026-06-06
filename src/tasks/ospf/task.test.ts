import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

function collectKeys(fields: readonly Field[]): string[] {
  const keys: string[] = [];
  for (const field of fields) {
    keys.push(field.label);
    if (field.help) keys.push(field.help);
    if (field.type === 'list') {
      for (const k of [field.addLabel, field.removeLabel, field.itemLabel]) if (k) keys.push(k);
      keys.push(...collectKeys(field.fields));
    }
  }
  return keys;
}

const full: FormValues = {
  process_id: 1,
  router_id: '1.1.1.1',
  networks: [
    { network: '10.0.0.0', wildcard: '0.0.0.255', area: 0 },
    { network: '10.1.0.0', wildcard: '0.0.255.255', area: 0 },
  ],
};

describe('ospf task (multi-network)', () => {
  it('registers under the expected slug and host scope', () => {
    expect(task.definition.slug).toBe('ospf');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'router1' });
  });

  it('every schema i18n key has EN and FR copy (incl. list keys)', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      keys.push(...collectKeys(group.fields));
    }
    for (const key of keys) {
      expect(task.messages.en[key], `en ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `fr ${key}`).toBeTruthy();
    }
  });

  describe('YAML output', () => {
    it('emits the process, router-id, and a networks sequence', () => {
      expect(yaml(full)).toBe(
        [
          'process_id: 1',
          'router_id: 1.1.1.1',
          'networks:',
          '  - network: 10.0.0.0',
          '    wildcard: 0.0.0.255',
          '    area: 0',
          '  - network: 10.1.0.0',
          '    wildcard: 0.0.255.255',
          '    area: 0',
          '',
        ].join('\n'),
      );
    });

    it('omits a blank router-id', () => {
      const out = yaml({
        process_id: 1,
        networks: [{ network: '10.0.0.0', wildcard: '0.0.0.255', area: 0 }],
      });
      expect(out).not.toContain('router_id');
      expect(out).toContain('process_id: 1');
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders the router-id and one line per network', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'router ospf 1',
          ' router-id 1.1.1.1',
          ' network 10.0.0.0 0.0.0.255 area 0',
          ' network 10.1.0.0 0.0.255.255 area 0',
          '',
        ].join('\n'),
      );
    });

    it('drops the router-id line when blank', () => {
      const out = cli({
        process_id: 1,
        networks: [{ network: '10.0.0.0', wildcard: '0.0.0.255', area: 0 }],
      });
      expect(out.text).toBe('router ospf 1\n network 10.0.0.0 0.0.0.255 area 0\n');
    });
  });

  it('requires a process ID and at least one valid network', () => {
    const init = initialValues(schema);
    const errors = validateForm(schema, init);
    expect(errors.process_id?.code).toBe('required');
    expect(errors.networks?.code).toBe('incomplete'); // seeded row missing network/wildcard
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
