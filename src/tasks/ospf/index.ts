/**
 * Curated task: Cisco IOS OSPF (issue #9).
 *
 * Cloned from the interface-ip reference (#6). A single OSPF process with a
 * router-id and **one** network/area statement.
 *
 * Scope note (per the #18 design review, 2026-06-06): OSPF normally carries many
 * `network … area …` lines, but `FormSchema` has no `list`/repeating-group field
 * type yet, and improvising one is out of scope for a task module. v1 ships the
 * **single-entry cut** (one network) — the same approach #8 took for a single BGP
 * neighbor. Multiple networks land once a real `list` field type exists.
 *
 * Correctness (council §4): the YAML vars come straight from the field values and
 * are always correct. The template uses no filters, so the device-CLI preview is
 * always `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

// Dotted IPv4, e.g. 10.0.0.0 / 0.0.0.255 / 1.1.1.1.
const IPV4 = '^(\\d{1,3}\\.){3}\\d{1,3}$';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.ospf.legend.process',
      fields: [
        {
          type: 'number',
          name: 'process_id',
          label: 'task.ospf.field.process_id.label',
          help: 'task.ospf.field.process_id.help',
          required: true,
          min: 1,
          max: 65535,
        },
        {
          type: 'text',
          name: 'router_id',
          label: 'task.ospf.field.router_id.label',
          help: 'task.ospf.field.router_id.help',
          pattern: IPV4,
          placeholder: '1.1.1.1',
          omitWhenBlank: true,
        },
      ],
    },
    {
      legend: 'task.ospf.legend.network',
      fields: [
        {
          type: 'text',
          name: 'network',
          label: 'task.ospf.field.network.label',
          help: 'task.ospf.field.network.help',
          required: true,
          pattern: IPV4,
          placeholder: '10.0.0.0',
        },
        {
          type: 'text',
          name: 'wildcard',
          label: 'task.ospf.field.wildcard.label',
          help: 'task.ospf.field.wildcard.help',
          required: true,
          pattern: IPV4,
          placeholder: '0.0.0.255',
        },
        {
          type: 'number',
          name: 'area',
          label: 'task.ospf.field.area.label',
          help: 'task.ospf.field.area.help',
          required: true,
          min: 0,
          max: 4294967295,
          default: 0,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline after each `{% endif %}` is swallowed, so the optional router-id line
// leaves no gap when blank.
const template = [
  'router ospf {{ process_id }}',
  '{% if router_id %} router-id {{ router_id }}',
  '{% endif %} network {{ network }} {{ wildcard }} area {{ area }}',
  '',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'ospf',
    title: 'Cisco IOS OSPF',
    description:
      'Generate Ansible host_vars and a Cisco IOS OSPF configuration — process ID, router ID, and a network/area statement — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.ospf.legend.process': 'OSPF process',
      'task.ospf.legend.network': 'Network',
      'task.ospf.field.process_id.label': 'Process ID',
      'task.ospf.field.process_id.help': 'OSPF process ID, local to the device (1–65535).',
      'task.ospf.field.router_id.label': 'Router ID',
      'task.ospf.field.router_id.help':
        'Optional OSPF router ID in IPv4 form, e.g. 1.1.1.1. Omitted from the vars when left blank.',
      'task.ospf.field.network.label': 'Network',
      'task.ospf.field.network.help': 'Network address to advertise, e.g. 10.0.0.0.',
      'task.ospf.field.wildcard.label': 'Wildcard mask',
      'task.ospf.field.wildcard.help': 'Inverse (wildcard) mask, e.g. 0.0.0.255 for a /24.',
      'task.ospf.field.area.label': 'Area',
      'task.ospf.field.area.help': 'OSPF area number (0 is the backbone area).',
    },
  },
};
