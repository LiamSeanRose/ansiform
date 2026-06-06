/**
 * Device basics — SNMP / NTP / TACACS (Cisco IOS) (issue #11).
 *
 * Combines the engine's primitives: `secret` fields (SNMP community, TACACS key —
 * never seeded, omit-on-blank, redacted before export), a `list` of NTP servers,
 * and nested `{% if %}`/`{% for %}` blocks. No filters, so the preview is `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../types';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.device-basics.group.snmp',
      fields: [
        {
          type: 'secret',
          name: 'snmp_community',
          label: 'task.device-basics.field.snmp_community.label',
          help: 'task.device-basics.field.snmp_community.help',
          omitWhenBlank: true,
        },
      ],
    },
    {
      legend: 'task.device-basics.group.ntp',
      fields: [
        {
          type: 'list',
          name: 'ntp_servers',
          label: 'task.device-basics.field.ntp_servers.label',
          help: 'task.device-basics.field.ntp_servers.help',
          addLabel: 'task.device-basics.field.ntp_servers.add',
          default: [{ server: '192.0.2.123' }],
          item: [
            {
              type: 'text',
              name: 'server',
              label: 'task.device-basics.field.ntp_servers.server.label',
              required: true,
              placeholder: '192.0.2.123',
              pattern: '^\\d{1,3}(\\.\\d{1,3}){3}$',
            },
          ],
        },
      ],
    },
    {
      legend: 'task.device-basics.group.tacacs',
      fields: [
        {
          type: 'text',
          name: 'tacacs_host',
          label: 'task.device-basics.field.tacacs_host.label',
          help: 'task.device-basics.field.tacacs_host.help',
          omitWhenBlank: true,
          placeholder: '192.0.2.50',
          pattern: '^\\d{1,3}(\\.\\d{1,3}){3}$',
        },
        {
          type: 'secret',
          name: 'tacacs_key',
          label: 'task.device-basics.field.tacacs_key.label',
          help: 'task.device-basics.field.tacacs_key.help',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

const template = [
  '{% if snmp_community %}',
  'snmp-server community {{ snmp_community }} RO',
  '{% endif %}',
  '{% for n in ntp_servers %}',
  'ntp server {{ n.server }}',
  '{% endfor %}',
  '{% if tacacs_host %}',
  'tacacs server PRIMARY',
  ' address ipv4 {{ tacacs_host }}',
  '{% if tacacs_key %}',
  ' key {{ tacacs_key }}',
  '{% endif %}',
  '{% endif %}',
  '',
].join('\n');

const deviceBasicsTask: TaskModule = {
  task: {
    slug: 'device-basics',
    title: 'Device basics — SNMP/NTP/TACACS (Cisco IOS)',
    description:
      'Fill a short form and get valid Ansible group_vars plus a live Cisco IOS baseline: SNMP community, NTP servers and TACACS. Secrets stay in memory and never leave the browser. Client-side and zero-egress.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.device-basics.group.snmp': 'SNMP',
      'task.device-basics.group.ntp': 'NTP',
      'task.device-basics.group.tacacs': 'TACACS+',

      'task.device-basics.field.snmp_community.label': 'SNMP community (RO)',
      'task.device-basics.field.snmp_community.help':
        'Optional secret. Held only in memory, never seeded or stored; omitted until set.',

      'task.device-basics.field.ntp_servers.label': 'NTP servers',
      'task.device-basics.field.ntp_servers.help': 'One line per server is generated.',
      'task.device-basics.field.ntp_servers.add': 'Add NTP server',
      'task.device-basics.field.ntp_servers.server.label': 'Server IP',

      'task.device-basics.field.tacacs_host.label': 'TACACS+ server IP',
      'task.device-basics.field.tacacs_host.help':
        'Optional. Left blank, the TACACS block is omitted entirely.',

      'task.device-basics.field.tacacs_key.label': 'TACACS+ key',
      'task.device-basics.field.tacacs_key.help':
        'Optional secret. Held only in memory, never seeded or stored; omitted until set.',
    },
  },
};

export default deviceBasicsTask;
