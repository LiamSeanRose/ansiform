import { describe, expect, it } from 'vitest';
import ospfTask from './task';
import { createSeedRegistry } from '../../core/filters/seed';
import { renderPreview } from '../../core/preview';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { initialValues } from '../../components/form';

const registry = createSeedRegistry();
const { task } = ospfTask;

describe('ospf task', () => {
  it('renders exact OSPF config from defaults, deriving the wildcard mask', () => {
    const result = renderPreview(task.template, initialValues(task.schema), registry);
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'router ospf 1\n router-id 10.0.0.1\n network 10.0.0.0 0.0.0.255 area 0\n',
    );
  });

  it('renders one network line per entry', () => {
    const result = renderPreview(
      task.template,
      {
        process_id: 10,
        router_id: '10.0.0.2',
        networks: [
          { network: '10.0.0.0/24', area: '0' },
          { network: '192.168.1.0/30', area: '1' },
        ],
      },
      registry,
    );
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'router ospf 10\n' +
        ' router-id 10.0.0.2\n' +
        ' network 10.0.0.0 0.0.0.255 area 0\n' +
        ' network 192.168.1.0 0.0.0.3 area 1\n',
    );
  });

  it('emits host_vars YAML with the networks as a list of records', () => {
    const artifact = groupVarsYamlSink.render({
      schema: task.schema,
      values: initialValues(task.schema),
      scope: task.defaultScope,
    });
    expect(artifact.filename).toBe('host_vars/router01.yml');
    expect(artifact.content).toContain('process_id: 1');
    expect(artifact.content).toContain('router_id: 10.0.0.1');
    expect(artifact.content).toContain('networks:');
    expect(artifact.content).toContain('- network: 10.0.0.0/24');
    expect(artifact.content).toContain('area: ');
  });
});
