import { describe, expect, it } from 'vitest';
import bgpNeighborTask from './task';
import { createSeedRegistry } from '../../core/filters/seed';
import { renderPreview } from '../../core/preview';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { initialValues } from '../../components/form';
import { redactSecrets, secretFieldNames } from '../../components/form';

const registry = createSeedRegistry();
const { task } = bgpNeighborTask;

describe('bgp-neighbor task', () => {
  it('renders an exact BGP neighbor from defaults, with no optional lines', () => {
    const result = renderPreview(task.template, initialValues(task.schema), registry);
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe('router bgp 65001\n neighbor 192.0.2.2 remote-as 65002\n');
  });

  it('adds description and password lines once those fields are set', () => {
    const result = renderPreview(
      task.template,
      {
        local_as: 65001,
        neighbor_ip: '192.0.2.2',
        remote_as: 65002,
        neighbor_description: 'ISP-A uplink',
        neighbor_password: 's3cret',
      },
      registry,
    );
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'router bgp 65001\n' +
        ' neighbor 192.0.2.2 remote-as 65002\n' +
        ' neighbor 192.0.2.2 description ISP-A uplink\n' +
        ' neighbor 192.0.2.2 password s3cret\n',
    );
  });

  it('declares the password as a secret field and omits both optionals when blank', () => {
    expect(secretFieldNames(task.schema).has('neighbor_password')).toBe(true);

    const artifact = groupVarsYamlSink.render({
      schema: task.schema,
      values: initialValues(task.schema),
      scope: task.defaultScope,
    });
    expect(artifact.filename).toBe('host_vars/router01.yml');
    expect(artifact.content).toBe('local_as: 65001\nneighbor_ip: 192.0.2.2\nremote_as: 65002\n');
  });

  it('redacts the secret from any snapshot that would leave memory', () => {
    const values = { ...initialValues(task.schema), neighbor_password: 's3cret' };
    const safe = redactSecrets(task.schema, values);
    expect('neighbor_password' in safe).toBe(false);
  });
});
