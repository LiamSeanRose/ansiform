/**
 * BGP neighbor — Cisco IOS (issue #8).
 *
 * Curated task on the #6 pattern. Notably it exercises the `secret` field type
 * (#4/#5): the neighbor password is a password input that is never seeded and is
 * `omitWhenBlank`, so it is left out of the vars entirely until the user types
 * one. All fields are scalar and the template uses no filters, so the preview is
 * `exact` and the YAML byte-correct.
 *
 * Secrets (§5): the value lives only in memory; redaction is required before any
 * persistence/export, which the copy/download (#12) and survey-spec (#13) sinks
 * own. The in-memory on-screen preview/vars here may show it, exactly like #5's
 * ephemeral preview.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../types';

const AS_MIN = 1;
const AS_MAX = 4294967295;

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.bgp-neighbor.group.process',
      fields: [
        {
          type: 'number',
          name: 'local_as',
          label: 'task.bgp-neighbor.field.local_as.label',
          help: 'task.bgp-neighbor.field.local_as.help',
          required: true,
          default: 65001,
          min: AS_MIN,
          max: AS_MAX,
        },
      ],
    },
    {
      legend: 'task.bgp-neighbor.group.neighbor',
      fields: [
        {
          type: 'text',
          name: 'neighbor_ip',
          label: 'task.bgp-neighbor.field.neighbor_ip.label',
          help: 'task.bgp-neighbor.field.neighbor_ip.help',
          required: true,
          default: '192.0.2.2',
          placeholder: '192.0.2.2',
          pattern: '^\\d{1,3}(\\.\\d{1,3}){3}$',
        },
        {
          type: 'number',
          name: 'remote_as',
          label: 'task.bgp-neighbor.field.remote_as.label',
          help: 'task.bgp-neighbor.field.remote_as.help',
          required: true,
          default: 65002,
          min: AS_MIN,
          max: AS_MAX,
        },
        {
          type: 'text',
          name: 'neighbor_description',
          label: 'task.bgp-neighbor.field.neighbor_description.label',
          help: 'task.bgp-neighbor.field.neighbor_description.help',
          omitWhenBlank: true,
          placeholder: 'ISP-A uplink',
        },
        {
          type: 'secret',
          name: 'neighbor_password',
          label: 'task.bgp-neighbor.field.neighbor_password.label',
          help: 'task.bgp-neighbor.field.neighbor_password.help',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// No filters → exact preview. The description/password lines appear only when set.
const template = [
  'router bgp {{ local_as }}',
  ' neighbor {{ neighbor_ip }} remote-as {{ remote_as }}',
  '{% if neighbor_description %}',
  ' neighbor {{ neighbor_ip }} description {{ neighbor_description }}',
  '{% endif %}',
  '{% if neighbor_password %}',
  ' neighbor {{ neighbor_ip }} password {{ neighbor_password }}',
  '{% endif %}',
  '',
].join('\n');

const bgpNeighborTask: TaskModule = {
  task: {
    slug: 'bgp-neighbor',
    title: 'BGP neighbor (Cisco IOS)',
    description:
      'Fill a short form and get valid Ansible host_vars plus a live Cisco IOS BGP neighbor config: local/remote AS, peer IP, description and an optional MD5 password. Client-side and zero-egress.',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router01' },
  },
  messages: {
    en: {
      'task.bgp-neighbor.group.process': 'BGP process',
      'task.bgp-neighbor.group.neighbor': 'Neighbor',

      'task.bgp-neighbor.field.local_as.label': 'Local AS',
      'task.bgp-neighbor.field.local_as.help': 'The local autonomous system number (router bgp).',

      'task.bgp-neighbor.field.neighbor_ip.label': 'Neighbor IP',
      'task.bgp-neighbor.field.neighbor_ip.help': 'The peer’s IPv4 address, e.g. 192.0.2.2.',

      'task.bgp-neighbor.field.remote_as.label': 'Remote AS',
      'task.bgp-neighbor.field.remote_as.help': 'The neighbor’s autonomous system number.',

      'task.bgp-neighbor.field.neighbor_description.label': 'Description',
      'task.bgp-neighbor.field.neighbor_description.help':
        'Optional. Left blank, the key is omitted entirely (Ansible default(omit)).',

      'task.bgp-neighbor.field.neighbor_password.label': 'MD5 password',
      'task.bgp-neighbor.field.neighbor_password.help':
        'Optional secret. Held only in memory, never seeded or stored; omitted from the vars until set.',
    },
  },
};

export default bgpNeighborTask;
