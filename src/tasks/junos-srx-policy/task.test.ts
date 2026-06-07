import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview, withFidelityFloor } from '../../core/preview';
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
  zones: [
    { name: 'trust', interface: 'ge-0/0/0.0', host_inbound: 'ssh' },
    { name: 'untrust', interface: 'ge-0/0/1.0', host_inbound: '' },
  ],
  addresses: [
    { name: 'web-server', prefix: '10.1.1.0/24' },
    { name: 'admin-host', prefix: '203.0.113.5/32' },
  ],
  policies: [
    {
      name: 'allow-web',
      from_zone: 'trust',
      to_zone: 'untrust',
      source_address: 'any',
      destination_address: 'web-server',
      application: 'junos-https',
      action: 'permit',
    },
  ],
};

describe('junos-srx-policy task (SRX security zones + policies)', () => {
  it('registers as a juniper-junos group task with an approximate floor', () => {
    expect(task.definition.slug).toBe('junos-srx-policy');
    expect(vendorOf(task.definition)).toBe('juniper-junos');
    expect(task.definition.fidelityFloor).toBe('approximate');
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
    it('emits zones, addresses, and policies with per-row omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'zones:',
          '  - name: trust',
          '    interface: ge-0/0/0.0',
          '    host_inbound: ssh',
          '  - name: untrust',
          '    interface: ge-0/0/1.0',
          'addresses:',
          '  - name: web-server',
          '    prefix: 10.1.1.0/24',
          '  - name: admin-host',
          '    prefix: 203.0.113.5/32',
          'policies:',
          '  - name: allow-web',
          '    from_zone: trust',
          '    to_zone: untrust',
          '    source_address: any',
          '    destination_address: web-server',
          '    application: junos-https',
          '    action: permit',
          '',
        ].join('\n'),
      );
    });

    it('drops the optional address-book and policy keys when those sections are empty', () => {
      const out = yaml({ zones: [{ name: 'trust' }], addresses: [], policies: [] });
      expect(out).toBe(['zones:', '  - name: trust', ''].join('\n'));
    });
  });

  describe('device-config preview (set form)', () => {
    it('renders the zone, address-book, and policy set lines', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'set security zones security-zone trust',
          'set security zones security-zone trust interfaces ge-0/0/0.0',
          'set security zones security-zone trust host-inbound-traffic system-services ssh',
          'set security zones security-zone untrust',
          'set security zones security-zone untrust interfaces ge-0/0/1.0',
          'set security address-book global address web-server 10.1.1.0/24',
          'set security address-book global address admin-host 203.0.113.5/32',
          'set security policies from-zone trust to-zone untrust policy allow-web match source-address any',
          'set security policies from-zone trust to-zone untrust policy allow-web match destination-address web-server',
          'set security policies from-zone trust to-zone untrust policy allow-web match application junos-https',
          'set security policies from-zone trust to-zone untrust policy allow-web then permit',
          '',
        ].join('\n'),
      );
    });

    it('is exact when rendered, but the declared floor clamps it to approximate (#39)', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(withFidelityFloor(out, task.definition.fidelityFloor).fidelity).toBe('approximate');
    });
  });

  it('requires at least one zone but not addresses or policies', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.zones?.code).toBe('incomplete');
    expect(errors.addresses).toBeUndefined();
    expect(errors.policies).toBeUndefined();
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is juniper-junos only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
