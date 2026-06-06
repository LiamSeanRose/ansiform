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
  trap_level: 'informational',
  source_interface: 'Loopback0',
  hosts: [
    { host: '192.0.2.50', transport: 'udp' },
    { host: '192.0.2.51', vrf: 'Mgmt-intf', transport: 'tcp' },
  ],
};

describe('syslog task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('syslog');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'group_vars/all.yml',
    );
  });

  it('every schema i18n key has English and French copy', () => {
    const keys: string[] = [];
    const pushField = (f: { label: string; help?: string; type: string }) => {
      keys.push(f.label);
      if (f.help) keys.push(f.help);
      if (f.type === 'select') for (const o of (f as { options: { label: string }[] }).options) keys.push(o.label);
    };
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        pushField(field);
        if (field.type === 'list') {
          const lf = field as ListField;
          if (lf.addLabel) keys.push(lf.addLabel);
          if (lf.itemLabel) keys.push(lf.itemLabel);
          for (const sub of lf.fields) pushField(sub);
        }
      }
    }
    for (const key of keys) {
      expect(task.messages.en[key], `missing EN copy for ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `missing FR copy for ${key}`).toBeTruthy();
    }
  });

  describe('YAML output (always correct)', () => {
    it('emits the scalars and a sequence of host mappings (per-row omit-on-blank)', () => {
      expect(yaml(full)).toBe(
        [
          'trap_level: informational',
          'source_interface: Loopback0',
          'hosts:',
          '  - host: 192.0.2.50',
          '    transport: udp',
          '  - host: 192.0.2.51',
          '    vrf: Mgmt-intf',
          '    transport: tcp',
          '',
        ].join('\n'),
      );
    });

    it('omits the optional source-interface when blank', () => {
      expect(yaml({ trap_level: 'warnings', hosts: [{ host: '192.0.2.50', transport: 'udp' }] })).toBe(
        [
          'trap_level: warnings',
          'hosts:',
          '  - host: 192.0.2.50',
          '    transport: udp',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders one logging-host line per row at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'logging source-interface Loopback0',
          'logging trap informational',
          'logging host 192.0.2.50 transport udp',
          'logging host 192.0.2.51 vrf Mgmt-intf transport tcp',
          '',
        ].join('\n'),
      );
    });

    it('drops the source-interface line and the per-host VRF when unset', () => {
      const out = cli({ trap_level: 'warnings', hosts: [{ host: '192.0.2.50', transport: 'udp' }] });
      expect(out.text).toBe(
        ['logging trap warnings', 'logging host 192.0.2.50 transport udp', ''].join('\n'),
      );
    });
  });

  describe('defaults & validation', () => {
    it('seeds one host row with the transport default', () => {
      const init = initialValues(schema);
      expect(init.trap_level).toBe('informational');
      const rows = init.hosts as Array<Record<string, unknown>>;
      expect(rows).toHaveLength(1);
      expect(rows[0].transport).toBe('udp');
    });

    it('flags a row whose required host IP is missing as incomplete', () => {
      expect(validateForm(schema, { ...initialValues(schema), hosts: [{ transport: 'udp' }] }).hosts?.code).toBe(
        'incomplete',
      );
    });

    it('flags a malformed host IP via the row field pattern', () => {
      expect(validateForm(schema, { ...initialValues(schema), hosts: [{ host: 'nope', transport: 'udp' }] }).hosts?.code).toBe(
        'incomplete',
      );
    });
  });
});
