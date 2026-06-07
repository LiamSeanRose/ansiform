import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { vendorOf } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

/** Collect every i18n key referenced by a field set, recursing into list rows. */
function collectKeys(fields: readonly Field[]): string[] {
  const keys: string[] = [];
  for (const field of fields) {
    keys.push(field.label);
    if (field.help) keys.push(field.help);
    if (field.type === 'select') for (const opt of field.options) keys.push(opt.label);
    if (field.type === 'list') {
      for (const k of [field.addLabel, field.removeLabel, field.itemLabel]) if (k) keys.push(k);
      keys.push(...collectKeys(field.fields));
    }
  }
  return keys;
}

const full: FormValues = {
  objects: [
    { name: 'WEB-SERVER', type: 'host', value: '203.0.113.10', description: 'Public web server' },
    { name: 'LAN', type: 'subnet', value: '10.0.0.0 255.255.255.0' },
  ],
  group_name: 'WEB-SERVERS',
};

describe('asa-objects task (network objects + object-group)', () => {
  it('registers as a cisco-asa group task under the expected slug', () => {
    expect(task.definition.slug).toBe('asa-objects');
    expect(vendorOf(task.definition)).toBe('cisco-asa');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
  });

  it('every schema i18n key has EN and FR copy (incl. list + option keys)', () => {
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
    it('emits the objects sequence (description omitted when blank) and the group name', () => {
      expect(yaml(full)).toBe(
        [
          'objects:',
          '  - name: WEB-SERVER',
          '    type: host',
          '    value: 203.0.113.10',
          '    description: Public web server',
          '  - name: LAN',
          '    type: subnet',
          '    value: 10.0.0.0 255.255.255.0',
          'group_name: WEB-SERVERS',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders one object block per row, the right body per type, then the bundling group', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'object network WEB-SERVER',
          ' host 203.0.113.10',
          ' description Public web server',
          'object network LAN',
          ' subnet 10.0.0.0 255.255.255.0',
          'object-group network WEB-SERVERS',
          ' network-object object WEB-SERVER',
          ' network-object object LAN',
          '',
        ].join('\n'),
      );
    });

    it('omits the object-group entirely when no group name is given', () => {
      const out = cli({ objects: [{ name: 'H', type: 'host', value: '10.0.0.1' }] });
      expect(out.text).toBe(['object network H', ' host 10.0.0.1', ''].join('\n'));
    });
  });

  it('requires at least one object', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.objects?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is cisco-asa only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
