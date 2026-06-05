import { describe, expect, it } from 'vitest';
import vlanTask from './task';
import { createSeedRegistry } from '../../core/filters/seed';
import { renderPreview } from '../../core/preview';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { initialValues } from '../../components/form';

const registry = createSeedRegistry();
const { task } = vlanTask;

describe('vlan task', () => {
  it('renders exact Cisco IOS VLAN config from the default values', () => {
    const result = renderPreview(task.template, initialValues(task.schema), registry);
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe('vlan 10\n name DATA\n state active\n');
  });

  it('reflects edited values, including the state select', () => {
    const result = renderPreview(
      task.template,
      { vlan_id: 200, vlan_name: 'VOICE', vlan_state: 'suspend' },
      registry,
    );
    expect(result.text).toBe('vlan 200\n name VOICE\n state suspend\n');
  });

  it('emits byte-correct group_vars YAML at the suggested path', () => {
    const artifact = groupVarsYamlSink.render({
      schema: task.schema,
      values: initialValues(task.schema),
      scope: task.defaultScope,
    });
    expect(artifact.filename).toBe('group_vars/switches.yml');
    expect(artifact.content).toBe('vlan_id: 10\nvlan_name: DATA\nvlan_state: active\n');
  });
});
