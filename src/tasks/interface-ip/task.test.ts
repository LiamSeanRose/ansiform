import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { templateForVendor, vendorTemplateApproximate } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

describe('interface-ip task', () => {
  it('registers under the expected slug and host scope', () => {
    expect(task.definition.slug).toBe('interface-ip');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'switch1' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'host_vars/switch1.yml',
    );
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
      const values: FormValues = {
        interface: 'GigabitEthernet0/1',
        description: 'Uplink to core',
        ip_address: '10.0.0.1/24',
        mtu: 1500,
        enabled: true,
      };
      expect(yaml(values)).toBe(
        [
          'interface: GigabitEthernet0/1',
          'description: Uplink to core',
          'ip_address: 10.0.0.1/24',
          'mtu: 1500',
          'enabled: true',
          '',
        ].join('\n'),
      );
    });

    it('omits blank optional fields (description, mtu) — default(omit)', () => {
      const values: FormValues = {
        interface: 'GigabitEthernet0/1',
        description: '',
        ip_address: '10.0.0.1/24',
        enabled: false,
      };
      expect(yaml(values)).toBe(
        ['interface: GigabitEthernet0/1', 'ip_address: 10.0.0.1/24', 'enabled: false', ''].join(
          '\n',
        ),
      );
    });
  });

  describe('device-CLI preview (exact)', () => {
    it('renders a full interface block at exact fidelity', () => {
      const out = cli({
        interface: 'GigabitEthernet0/1',
        description: 'Uplink to core',
        ip_address: '10.0.0.1/24',
        mtu: 1500,
        enabled: true,
      });
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'interface GigabitEthernet0/1',
          ' description Uplink to core',
          ' ip address 10.0.0.1 255.255.255.0',
          ' mtu 1500',
          ' no shutdown',
          '',
        ].join('\n'),
      );
    });

    it('drops optional lines and shuts the port when disabled', () => {
      const out = cli({
        interface: 'GigabitEthernet0/1',
        ip_address: '10.0.0.1/24',
        enabled: false,
      });
      expect(out.text).toBe(
        ['interface GigabitEthernet0/1', ' ip address 10.0.0.1 255.255.255.0', ' shutdown', ''].join(
          '\n',
        ),
      );
    });
  });

  it('initial values render a valid form (interface/ip required, enabled defaults on)', () => {
    const init = initialValues(schema);
    expect(init.enabled).toBe(true);
    // interface + ip_address are required and unset at first.
    const errors = validateForm(schema, init);
    expect(Object.keys(errors).sort()).toEqual(['interface', 'ip_address']);
  });

  // #37: IOS-XR interface CLI verified exact (`ipv4 address <addr> <mask>`) and locked.
  describe('per-vendor preview (#37)', () => {
    const def = task.definition;
    const values: FormValues = {
      interface: 'GigabitEthernet0/0/0/0',
      description: 'Uplink to core',
      ip_address: '10.0.0.1/24',
      mtu: 1500,
      enabled: true,
    };

    it('IOS-XR is exact and uses the `ipv4 address <addr> <mask>` form', () => {
      expect(vendorTemplateApproximate(def, 'cisco-iosxr')).toBe(false);
      const out = renderPreview(templateForVendor(def, 'cisco-iosxr'), values, registry);
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'interface GigabitEthernet0/0/0/0',
          ' description Uplink to core',
          ' ipv4 address 10.0.0.1 255.255.255.0',
          ' mtu 1500',
          ' no shutdown',
          '',
        ].join('\n'),
      );
    });

    // #73: Huawei VRP is IOS-adjacent but enables with `undo shutdown`; approximate.
    it('Huawei VRP is approximate and enables with undo shutdown', () => {
      expect(vendorTemplateApproximate(def, 'huawei-vrp')).toBe(true);
      const out = renderPreview(templateForVendor(def, 'huawei-vrp'), values, registry);
      expect(out.text).toBe(
        [
          'interface GigabitEthernet0/0/0/0',
          ' description Uplink to core',
          ' ip address 10.0.0.1 255.255.255.0',
          ' mtu 1500',
          ' undo shutdown',
          '',
        ].join('\n'),
      );
    });
  });
});
