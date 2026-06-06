import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues, ListField } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  routes: [
    { prefix: '0.0.0.0', mask: '0.0.0.0', next_hop: '192.0.2.1' },
    { prefix: '10.0.0.0', mask: '255.0.0.0', next_hop: '192.0.2.2', distance: 200 },
  ],
};

describe('static-routes task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('static-routes');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
  });

  it('every schema i18n key has English and French copy', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
        if (field.type === 'list') {
          const lf = field as ListField;
          if (lf.addLabel) keys.push(lf.addLabel);
          if (lf.itemLabel) keys.push(lf.itemLabel);
          for (const sub of lf.fields) {
            keys.push(sub.label);
            if (sub.help) keys.push(sub.help);
          }
        }
      }
    }
    for (const key of keys) {
      expect(task.messages.en[key], `missing EN copy for ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `missing FR copy for ${key}`).toBeTruthy();
    }
  });

  describe('YAML output (always correct)', () => {
    it('emits a sequence of route mappings, omitting a blank distance', () => {
      expect(yaml(full)).toBe(
        [
          'routes:',
          '  - prefix: 0.0.0.0',
          '    mask: 0.0.0.0',
          '    next_hop: 192.0.2.1',
          '  - prefix: 10.0.0.0',
          '    mask: 255.0.0.0',
          '    next_hop: 192.0.2.2',
          '    distance: 200',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders one ip route line per row, appending the optional distance', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'ip route 0.0.0.0 0.0.0.0 192.0.2.1',
          'ip route 10.0.0.0 255.0.0.0 192.0.2.2 200',
          '',
        ].join('\n'),
      );
    });

    it('renders a single route with no trailing distance', () => {
      expect(cli({ routes: [{ prefix: '10.0.0.0', mask: '255.0.0.0', next_hop: '192.0.2.2' }] }).text).toBe(
        ['ip route 10.0.0.0 255.0.0.0 192.0.2.2', ''].join('\n'),
      );
    });
  });

  describe('defaults & validation', () => {
    it('seeds one empty route row', () => {
      const rows = initialValues(schema).routes as Array<Record<string, unknown>>;
      expect(rows).toHaveLength(1);
      expect('prefix' in rows[0]).toBe(false);
    });

    it('flags a row missing a required field as incomplete', () => {
      expect(validateForm(schema, { routes: [{ prefix: '10.0.0.0', mask: '255.0.0.0' }] }).routes?.code).toBe(
        'incomplete',
      );
    });
  });
});
