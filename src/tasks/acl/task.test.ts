import { describe, expect, it } from 'vitest';
import aclTask from './task';
import { createSeedRegistry } from '../../core/filters/seed';
import { renderPreview } from '../../core/preview';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { initialValues } from '../../components/form';

const registry = createSeedRegistry();
const { task } = aclTask;

describe('acl task', () => {
  it('renders an exact extended ACL from the default single entry', () => {
    const result = renderPreview(task.template, initialValues(task.schema), registry);
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'ip access-list extended BLOCK_RFC1918\n permit ip 10.0.0.0 0.0.0.255 any\n',
    );
  });

  it('renders one ACE line per entry, in order', () => {
    const result = renderPreview(
      task.template,
      {
        acl_name: 'EDGE_IN',
        acl_entries: [
          { action: 'deny', protocol: 'tcp', source: 'any', destination: 'host 192.0.2.1' },
          { action: 'permit', protocol: 'ip', source: 'any', destination: 'any' },
        ],
      },
      registry,
    );
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'ip access-list extended EDGE_IN\n' +
        ' deny tcp any host 192.0.2.1\n' +
        ' permit ip any any\n',
    );
  });

  it('emits group_vars YAML with the entries as a list of records', () => {
    const artifact = groupVarsYamlSink.render({
      schema: task.schema,
      values: initialValues(task.schema),
      scope: task.defaultScope,
    });
    expect(artifact.filename).toBe('group_vars/firewalls.yml');
    expect(artifact.content).toContain('acl_name: BLOCK_RFC1918');
    expect(artifact.content).toContain('acl_entries:');
    expect(artifact.content).toContain('- action: permit');
    expect(artifact.content).toContain('protocol: ip');
  });
});
