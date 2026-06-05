import { describe, expect, it } from 'vitest';
import interfaceIpTask from './task';
import { createSeedRegistry } from '../../core/filters/seed';
import { renderPreview } from '../../core/preview';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { initialValues } from '../../components/form';

const registry = createSeedRegistry();
const { task } = interfaceIpTask;

describe('interface-ip reference task', () => {
  it('renders exact Cisco IOS config from the default values', () => {
    const result = renderPreview(task.template, initialValues(task.schema), registry);
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'interface GigabitEthernet0/1\n ip address 192.0.2.1 255.255.255.0\n no shutdown\n',
    );
  });

  it('derives the netmask from the CIDR and includes a set description', () => {
    const result = renderPreview(
      task.template,
      {
        interface_name: 'GigabitEthernet0/2',
        interface_description: 'Uplink to core',
        ip_cidr: '10.0.0.1/30',
        enabled: false,
      },
      registry,
    );
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'interface GigabitEthernet0/2\n description Uplink to core\n ip address 10.0.0.1 255.255.255.252\n shutdown\n',
    );
  });

  it('emits byte-correct host_vars YAML, omitting the blank description', () => {
    const artifact = groupVarsYamlSink.render({
      schema: task.schema,
      values: initialValues(task.schema),
      scope: task.defaultScope,
    });
    expect(artifact.filename).toBe('host_vars/switch01.yml');
    expect(artifact.content).toBe(
      'interface_name: GigabitEthernet0/1\nip_cidr: 192.0.2.1/24\nenabled: true\n',
    );
  });

  it('includes the description key only once the user fills it', () => {
    const artifact = groupVarsYamlSink.render({
      schema: task.schema,
      values: { ...initialValues(task.schema), interface_description: 'Uplink' },
      scope: task.defaultScope,
    });
    expect(artifact.content).toContain('interface_description: Uplink');
  });
});
