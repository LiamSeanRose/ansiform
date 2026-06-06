/**
 * OSPF — Cisco IOS (issue #9).
 *
 * Built on the #6 pattern and the #1/#3 amendment: networks are a `list` field
 * (one record per network statement), and the template derives the IOS wildcard
 * mask from each network's CIDR via the new `ipaddr('hostmask')` query (#3). Only
 * the `exact` ipaddr filter is used, so the preview stays byte-faithful.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../types';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.ospf.group.process',
      fields: [
        {
          type: 'number',
          name: 'process_id',
          label: 'task.ospf.field.process_id.label',
          help: 'task.ospf.field.process_id.help',
          required: true,
          default: 1,
          min: 1,
          max: 65535,
        },
        {
          type: 'text',
          name: 'router_id',
          label: 'task.ospf.field.router_id.label',
          help: 'task.ospf.field.router_id.help',
          required: true,
          default: '10.0.0.1',
          placeholder: '10.0.0.1',
          pattern: '^\\d{1,3}(\\.\\d{1,3}){3}$',
        },
      ],
    },
    {
      legend: 'task.ospf.group.networks',
      fields: [
        {
          type: 'list',
          name: 'networks',
          label: 'task.ospf.field.networks.label',
          help: 'task.ospf.field.networks.help',
          addLabel: 'task.ospf.field.networks.add',
          required: true,
          default: [{ network: '10.0.0.0/24', area: '0' }],
          item: [
            {
              type: 'text',
              name: 'network',
              label: 'task.ospf.field.networks.network.label',
              required: true,
              placeholder: '10.0.0.0/24',
              pattern: '^\\d{1,3}(\\.\\d{1,3}){3}/\\d{1,2}$',
            },
            {
              type: 'text',
              name: 'area',
              label: 'task.ospf.field.networks.area.label',
              required: true,
              default: '0',
              placeholder: '0',
            },
          ],
        },
      ],
    },
  ],
};

const template = [
  'router ospf {{ process_id }}',
  ' router-id {{ router_id }}',
  '{% for n in networks %}',
  " network {{ n.network | ipaddr('network') }} {{ n.network | ipaddr('hostmask') }} area {{ n.area }}",
  '{% endfor %}',
  '',
].join('\n');

const ospfTask: TaskModule = {
  task: {
    slug: 'ospf',
    title: 'OSPF (Cisco IOS)',
    description:
      'Fill a short form and get valid Ansible host_vars plus a live Cisco IOS OSPF config: process id, router-id and any number of network statements. Wildcard masks are derived from each CIDR. Client-side and zero-egress.',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router01' },
  },
  messages: {
    en: {
      'task.ospf.group.process': 'OSPF process',
      'task.ospf.group.networks': 'Networks',

      'task.ospf.field.process_id.label': 'Process ID',
      'task.ospf.field.process_id.help': 'The OSPF process number (router ospf <id>).',

      'task.ospf.field.router_id.label': 'Router ID',
      'task.ospf.field.router_id.help': 'The OSPF router-id, in IPv4 form, e.g. 10.0.0.1.',

      'task.ospf.field.networks.label': 'Network statements',
      'task.ospf.field.networks.help':
        'One or more networks to advertise. The wildcard mask is derived from each CIDR.',
      'task.ospf.field.networks.add': 'Add network',
      'task.ospf.field.networks.network.label': 'Network (CIDR)',
      'task.ospf.field.networks.area.label': 'Area',
    },
  },
};

export default ospfTask;
