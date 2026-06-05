/**
 * Interface / IP address — Cisco IOS (issue #6 reference task).
 *
 * This is the copy-paste pattern for the whole curated library (#7–#11): a
 * correct-by-construction `FormSchema`, a Jinja2 device-CLI `template`, and route
 * + SEO meta, all bundled with task-local copy in one folder. The registry
 * auto-discovers it — adding a task means cloning this folder, nothing more.
 *
 * Two halves of the product, both demonstrated here:
 *  - **Always-correct YAML (#2):** the schema fields become `host_vars` keys
 *    verbatim — raw values, no filters applied. `interface_description` is
 *    `omitWhenBlank`, so it disappears from the vars when left blank
 *    (`default(omit)` semantics).
 *  - **Trust-signal preview (#5):** the template renders real IOS config. It
 *    uses only the `exact` `ipaddr` filter (#3) to derive the dotted netmask from
 *    the CIDR, so the preview is byte-faithful and never shows a degradation
 *    notice for valid input.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../types';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.interface-ip.group.interface',
      fields: [
        {
          type: 'text',
          name: 'interface_name',
          label: 'task.interface-ip.field.interface_name.label',
          help: 'task.interface-ip.field.interface_name.help',
          required: true,
          default: 'GigabitEthernet0/1',
          placeholder: 'GigabitEthernet0/1',
        },
        {
          type: 'text',
          name: 'interface_description',
          label: 'task.interface-ip.field.interface_description.label',
          help: 'task.interface-ip.field.interface_description.help',
          omitWhenBlank: true,
          placeholder: 'Uplink to core',
        },
      ],
    },
    {
      legend: 'task.interface-ip.group.addressing',
      fields: [
        {
          type: 'text',
          name: 'ip_cidr',
          label: 'task.interface-ip.field.ip_cidr.label',
          help: 'task.interface-ip.field.ip_cidr.help',
          required: true,
          default: '192.0.2.1/24',
          placeholder: '192.0.2.1/24',
          // IPv4 address with a CIDR prefix; the netmask is derived for preview.
          pattern: '^\\d{1,3}(\\.\\d{1,3}){3}/\\d{1,2}$',
        },
      ],
    },
    {
      legend: 'task.interface-ip.group.state',
      fields: [
        {
          type: 'boolean',
          name: 'enabled',
          label: 'task.interface-ip.field.enabled.label',
          help: 'task.interface-ip.field.enabled.help',
          default: true,
        },
      ],
    },
  ],
};

// trim_blocks is on (Ansible's default), so the newline after each `%}` is
// swallowed — the block tags sit on their own lines without adding blank lines.
const template = [
  'interface {{ interface_name }}',
  '{% if interface_description %}',
  ' description {{ interface_description }}',
  '{% endif %}',
  " ip address {{ ip_cidr | ipaddr('address') }} {{ ip_cidr | ipaddr('netmask') }}",
  '{% if enabled %}',
  ' no shutdown',
  '{% else %}',
  ' shutdown',
  '{% endif %}',
  '',
].join('\n');

const interfaceIpTask: TaskModule = {
  task: {
    slug: 'interface-ip',
    title: 'Interface IP address (Cisco IOS)',
    description:
      'Fill a short form and get valid Ansible host_vars plus a live Cisco IOS interface config: set the interface, IPv4 address/prefix, description and admin state. Client-side and zero-egress.',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'switch01' },
  },
  messages: {
    en: {
      'task.interface-ip.group.interface': 'Interface',
      'task.interface-ip.group.addressing': 'Addressing',
      'task.interface-ip.group.state': 'Administrative state',

      'task.interface-ip.field.interface_name.label': 'Interface name',
      'task.interface-ip.field.interface_name.help':
        'The IOS interface to configure, e.g. GigabitEthernet0/1.',

      'task.interface-ip.field.interface_description.label': 'Description',
      'task.interface-ip.field.interface_description.help':
        'Optional. Left blank, the key is omitted entirely (Ansible default(omit)).',

      'task.interface-ip.field.ip_cidr.label': 'IP address / prefix',
      'task.interface-ip.field.ip_cidr.help':
        'IPv4 address with prefix in CIDR form, e.g. 192.0.2.1/24. The dotted netmask is derived for the device preview.',

      'task.interface-ip.field.enabled.label': 'Interface enabled (no shutdown)',
      'task.interface-ip.field.enabled.help':
        'On renders “no shutdown” in the preview; off renders “shutdown”.',
    },
  },
};

export default interfaceIpTask;
