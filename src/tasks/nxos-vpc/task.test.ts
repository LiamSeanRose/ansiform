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
  domain_id: 1,
  peer_keepalive_dest: '10.1.1.2',
  peer_keepalive_source: '10.1.1.1',
  peer_keepalive_vrf: 'management',
  peer_link_po: 1,
  peer_gateway: true,
  auto_recovery: true,
};

describe('nxos-vpc task', () => {
  it('registers as a cisco-nxos group task under the expected slug', () => {
    expect(task.definition.slug).toBe('nxos-vpc');
    expect(vendorOf(task.definition)).toBe('cisco-nxos');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'leaf-switches' });
  });

  it('every schema i18n key has EN and FR copy', () => {
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
    it('emits every field', () => {
      expect(yaml(full)).toBe(
        [
          'domain_id: 1',
          'peer_keepalive_dest: 10.1.1.2',
          'peer_keepalive_source: 10.1.1.1',
          'peer_keepalive_vrf: management',
          'peer_link_po: 1',
          'peer_gateway: true',
          'auto_recovery: true',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders the full domain with keepalive VRF and both toggles', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'feature vpc',
          'vpc domain 1',
          '  peer-keepalive destination 10.1.1.2 source 10.1.1.1 vrf management',
          '  peer-gateway',
          '  auto-recovery',
          'interface port-channel1',
          '  vpc peer-link',
        ].join('\n'),
      );
    });

    it('omits the VRF and toggle lines when they are blank/off', () => {
      const out = cli({
        domain_id: 1,
        peer_keepalive_dest: '10.1.1.2',
        peer_keepalive_source: '10.1.1.1',
        peer_keepalive_vrf: '',
        peer_link_po: 1,
        peer_gateway: false,
        auto_recovery: false,
      });
      expect(out.text).toBe(
        [
          'feature vpc',
          'vpc domain 1',
          '  peer-keepalive destination 10.1.1.2 source 10.1.1.1',
          'interface port-channel1',
          '  vpc peer-link',
        ].join('\n'),
      );
    });
  });

  it('requires the domain, keepalive IPs, and peer-link port-channel', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.domain_id?.code).toBe('required');
    expect(errors.peer_keepalive_dest?.code).toBe('required');
    expect(errors.peer_keepalive_source?.code).toBe('required');
    expect(errors.peer_link_po?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is cisco-nxos only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
