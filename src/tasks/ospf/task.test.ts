import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  process_id: 1,
  router_id: '1.1.1.1',
  network: '10.0.0.0',
  wildcard: '0.0.0.255',
  area: 0,
};

describe('ospf task', () => {
  it('registers under the expected slug and host scope', () => {
    expect(task.definition.slug).toBe('ospf');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'router1' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'host_vars/router1.yml',
    );
  });

  it('declares no secret fields (nothing sensitive to leak in a snapshot)', () => {
    const types = schema.groups.flatMap((g) => g.fields.map((f) => f.type));
    expect(types).not.toContain('secret');
  });

  it('every schema i18n key has English copy', () => {
    const en = task.messages.en;
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
      }
    }
    for (const key of keys) expect(en[key], `missing copy for ${key}`).toBeTruthy();
  });

  describe('YAML output (always correct)', () => {
    it('emits every field with correct types when fully filled', () => {
      expect(yaml(full)).toBe(
        [
          'process_id: 1',
          'router_id: 1.1.1.1',
          'network: 10.0.0.0',
          'wildcard: 0.0.0.255',
          'area: 0',
          '',
        ].join('\n'),
      );
    });

    it('omits the blank optional router_id — default(omit)', () => {
      const values: FormValues = { ...full, router_id: '' };
      expect(yaml(values)).toBe(
        ['process_id: 1', 'network: 10.0.0.0', 'wildcard: 0.0.0.255', 'area: 0', ''].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact)', () => {
    it('renders the full OSPF block at exact fidelity, no filters', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'router ospf 1',
          ' router-id 1.1.1.1',
          ' network 10.0.0.0 0.0.0.255 area 0',
          '',
        ].join('\n'),
      );
    });

    it('drops the router-id line when none is given', () => {
      const out = cli({ ...full, router_id: '' });
      expect(out.text).toBe(
        ['router ospf 1', ' network 10.0.0.0 0.0.0.255 area 0', ''].join('\n'),
      );
    });
  });

  describe('validation', () => {
    it('initial values: area defaults to 0; process_id/network/wildcard are required', () => {
      const init = initialValues(schema);
      expect(init.area).toBe(0);
      expect(Object.keys(validateForm(schema, init)).sort()).toEqual([
        'network',
        'process_id',
        'wildcard',
      ]);
    });

    it('rejects a malformed router_id', () => {
      const errors = validateForm(schema, { ...full, router_id: 'nope' });
      expect(errors.router_id?.code).toBe('pattern');
    });
  });
});
