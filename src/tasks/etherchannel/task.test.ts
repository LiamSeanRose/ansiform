import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import {
  taskVendors,
  templateForVendor,
  vendorTemplateApproximate,
  vendorOf,
} from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const def = task.definition;
const { schema, template, defaultScope } = def;
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
  channel_id: 10,
  description: 'Uplink bundle to core',
  mode: 'active',
  members: [{ interface: 'GigabitEthernet0/1' }, { interface: 'GigabitEthernet0/2' }],
};

const iosExpected = [
  'interface Port-channel10',
  ' description Uplink bundle to core',
  'interface GigabitEthernet0/1',
  ' channel-group 10 mode active',
  'interface GigabitEthernet0/2',
  ' channel-group 10 mode active',
  '',
].join('\n');

describe('etherchannel task', () => {
  it('registers under the expected slug and host scope, default vendor cisco-ios', () => {
    expect(def.slug).toBe('etherchannel');
    expect(vendorOf(def)).toBe('cisco-ios');
    expect(def.defaultScope).toEqual({ kind: 'host', name: 'switch1' });
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
    it('emits the channel fields and a members sequence', () => {
      expect(yaml(full)).toBe(
        [
          'channel_id: 10',
          'description: Uplink bundle to core',
          'mode: active',
          'members:',
          '  - interface: GigabitEthernet0/1',
          '  - interface: GigabitEthernet0/2',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders the Port-channel and one channel-group block per member', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(iosExpected);
    });
  });

  describe('per-vendor overlays (#58)', () => {
    it('offers the IOS family vendors', () => {
      expect(taskVendors(def)).toEqual(['cisco-ios', 'cisco-iosxe', 'cisco-nxos', 'arista-eos']);
    });

    it('IOS-XE is exact and identical to the IOS template', () => {
      expect(vendorTemplateApproximate(def, 'cisco-iosxe')).toBe(false);
      expect(renderPreview(templateForVendor(def, 'cisco-iosxe'), full, registry).text).toBe(
        iosExpected,
      );
    });

    it('NX-OS is approximate: lowercase port-channel, feature lacp for LACP modes', () => {
      expect(vendorTemplateApproximate(def, 'cisco-nxos')).toBe(true);
      expect(renderPreview(templateForVendor(def, 'cisco-nxos'), full, registry).text).toBe(
        [
          'feature lacp',
          'interface port-channel10',
          ' description Uplink bundle to core',
          'interface GigabitEthernet0/1',
          ' channel-group 10 mode active',
          'interface GigabitEthernet0/2',
          ' channel-group 10 mode active',
          '',
        ].join('\n'),
      );
    });

    it('NX-OS omits feature lacp for a static (on) bundle', () => {
      const out = renderPreview(templateForVendor(def, 'cisco-nxos'), {
        channel_id: 5,
        mode: 'on',
        members: [{ interface: 'Ethernet1/1' }],
      }, registry);
      expect(out.text).toBe(
        ['interface port-channel5', 'interface Ethernet1/1', ' channel-group 5 mode on', ''].join(
          '\n',
        ),
      );
    });

    it('EOS is approximate and capitalises Port-Channel', () => {
      expect(vendorTemplateApproximate(def, 'arista-eos')).toBe(true);
      const text = renderPreview(templateForVendor(def, 'arista-eos'), full, registry).text;
      expect(text.startsWith('interface Port-Channel10\n')).toBe(true);
      expect(text).toContain(' channel-group 10 mode active');
    });
  });

  it('requires a channel number and at least one member', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.channel_id?.code).toBe('required');
    expect(errors.members?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
