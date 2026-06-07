import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { taskVendors, templateForVendor, vendorTemplateApproximate } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  local_as: 65001,
  peer_ip: '10.0.0.2',
  remote_as: 65002,
  description: 'ISP uplink',
  password: 's3cr3t',
};

describe('bgp-neighbor task', () => {
  it('registers under the expected slug and host scope', () => {
    expect(task.definition.slug).toBe('bgp-neighbor');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'router1' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'host_vars/router1.yml',
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
      expect(yaml(full)).toBe(
        [
          'local_as: 65001',
          'peer_ip: 10.0.0.2',
          'remote_as: 65002',
          'description: ISP uplink',
          'password: s3cr3t',
          '',
        ].join('\n'),
      );
    });

    it('omits blank optional fields (description, password) — default(omit)', () => {
      const values: FormValues = {
        local_as: 65001,
        peer_ip: '10.0.0.2',
        remote_as: 65002,
        description: '',
      };
      expect(yaml(values)).toBe(
        ['local_as: 65001', 'peer_ip: 10.0.0.2', 'remote_as: 65002', ''].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders a full neighbor block at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'router bgp 65001',
          ' neighbor 10.0.0.2 remote-as 65002',
          ' neighbor 10.0.0.2 description ISP uplink',
          ' neighbor 10.0.0.2 password s3cr3t',
          '',
        ].join('\n'),
      );
    });

    it('drops the optional description and password lines when blank', () => {
      const out = cli({ local_as: 65001, peer_ip: '10.0.0.2', remote_as: 65002 });
      expect(out.text).toBe(
        ['router bgp 65001', ' neighbor 10.0.0.2 remote-as 65002', ''].join('\n'),
      );
    });
  });

  it('requires local_as, peer_ip, and remote_as; password is never seeded', () => {
    const init = initialValues(schema);
    expect(init.password).toBeUndefined();
    const errors = validateForm(schema, init);
    expect(Object.keys(errors).sort()).toEqual(['local_as', 'peer_ip', 'remote_as']);
  });

  it('flags a malformed neighbor IP via the field pattern', () => {
    expect(validateForm(schema, { ...full, peer_ip: 'not-an-ip' }).peer_ip?.code).toBe('pattern');
  });

  // #34: EOS flat-neighbor BGP CLI verified exact and locked. NX-OS is omitted
  // (submode neighbor model) — it must not silently fall back to this form.
  describe('per-vendor preview (#34)', () => {
    const def = task.definition;

    it('EOS is exact: flat neighbor remote-as/description/password lines', () => {
      expect(vendorTemplateApproximate(def, 'arista-eos')).toBe(false);
      const out = renderPreview(templateForVendor(def, 'arista-eos'), full, registry);
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'router bgp 65001',
          ' neighbor 10.0.0.2 remote-as 65002',
          ' neighbor 10.0.0.2 description ISP uplink',
          ' neighbor 10.0.0.2 password s3cr3t',
          '',
        ].join('\n'),
      );
    });

    it('does not offer NX-OS (submode model not rendered)', () => {
      expect(taskVendors(def)).not.toContain('cisco-nxos');
    });
  });
});
