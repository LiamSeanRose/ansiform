import { describe, expect, it } from 'vitest';
import deviceBasicsTask from './task';
import { createSeedRegistry } from '../../core/filters/seed';
import { renderPreview } from '../../core/preview';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { initialValues, redactSecrets, secretFieldNames } from '../../components/form';

const registry = createSeedRegistry();
const { task } = deviceBasicsTask;

describe('device-basics task', () => {
  it('shows only the NTP server from defaults (secrets and TACACS blank)', () => {
    const result = renderPreview(task.template, initialValues(task.schema), registry);
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe('ntp server 192.0.2.123\n');
  });

  it('renders the full baseline once secrets and TACACS are set', () => {
    const result = renderPreview(
      task.template,
      {
        snmp_community: 'public',
        ntp_servers: [{ server: '192.0.2.123' }, { server: '192.0.2.124' }],
        tacacs_host: '192.0.2.50',
        tacacs_key: 's3cret',
      },
      registry,
    );
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe(
      'snmp-server community public RO\n' +
        'ntp server 192.0.2.123\n' +
        'ntp server 192.0.2.124\n' +
        'tacacs server PRIMARY\n' +
        ' address ipv4 192.0.2.50\n' +
        ' key s3cret\n',
    );
  });

  it('declares SNMP community and TACACS key as secret fields', () => {
    const secrets = secretFieldNames(task.schema);
    expect(secrets.has('snmp_community')).toBe(true);
    expect(secrets.has('tacacs_key')).toBe(true);
  });

  it('omits blank secrets and TACACS from the YAML output', () => {
    const artifact = groupVarsYamlSink.render({
      schema: task.schema,
      values: initialValues(task.schema),
      scope: task.defaultScope,
    });
    expect(artifact.filename).toBe('group_vars/all.yml');
    expect(artifact.content).toContain('ntp_servers:');
    expect(artifact.content).toContain('- server: 192.0.2.123');
    expect(artifact.content).not.toContain('snmp_community');
    expect(artifact.content).not.toContain('tacacs_key');
  });

  it('redacts both secrets from any snapshot that would leave memory', () => {
    const safe = redactSecrets(task.schema, {
      ...initialValues(task.schema),
      snmp_community: 'public',
      tacacs_key: 's3cret',
    });
    expect('snmp_community' in safe).toBe(false);
    expect('tacacs_key' in safe).toBe(false);
  });
});
