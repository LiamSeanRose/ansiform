/**
 * Curated task: VyOS ethernet interface (issue #72).
 *
 * The first VyOS task — VyOS is a `set`-form platform (Junos-lineage), so it
 * renders through the existing format-agnostic preview engine at low cost (#36):
 * `set interfaces ethernet <if> address <cidr>`, one line per setting. VyOS takes
 * the address as CIDR verbatim — no address/mask split.
 *
 * Honesty (#39/#40): the YAML vars are always correct; the preview is authored
 * from public VyOS syntax and not device-verified, so the task declares
 * `fidelityFloor: 'approximate'`. No filters → it renders `exact` before the floor
 * clamps it.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.vyos-interface.legend',
      fields: [
        {
          type: 'text',
          name: 'interface',
          label: 'task.vyos-interface.field.interface.label',
          help: 'task.vyos-interface.field.interface.help',
          required: true,
          placeholder: 'eth0',
          format: 'ifname',
        },
        {
          type: 'text',
          name: 'ip_address',
          label: 'task.vyos-interface.field.ip_address.label',
          help: 'task.vyos-interface.field.ip_address.help',
          required: true,
          placeholder: '192.168.1.1/24',
          format: 'cidr',
        },
        {
          type: 'text',
          name: 'description',
          label: 'task.vyos-interface.field.description.label',
          help: 'task.vyos-interface.field.description.help',
          placeholder: 'Uplink to core',
          omitWhenBlank: true,
        },
        {
          type: 'number',
          name: 'mtu',
          label: 'task.vyos-interface.field.mtu.label',
          help: 'task.vyos-interface.field.mtu.help',
          min: 68,
          max: 9000,
          omitWhenBlank: true,
        },
        {
          type: 'boolean',
          name: 'enabled',
          label: 'task.vyos-interface.field.enabled.label',
          help: 'task.vyos-interface.field.enabled.help',
          default: true,
        },
      ],
    },
  ],
};

// Jinja2 → VyOS `set` form. The address is taken as CIDR; description, MTU, and
// the disable line render only when relevant.
const template = [
  'set interfaces ethernet {{ interface }} address {{ ip_address }}',
  '{% if description %}set interfaces ethernet {{ interface }} description "{{ description }}"',
  '{% endif %}{% if mtu %}set interfaces ethernet {{ interface }} mtu {{ mtu }}',
  '{% endif %}{% if enabled %}{% else %}set interfaces ethernet {{ interface }} disable',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'vyos-interface',
    title: 'VyOS ethernet interface',
    description:
      'Generate Ansible host_vars and a VyOS ethernet interface configuration — address, description, MTU, and admin state — with an approximate device-config preview.',
    vendor: 'vyos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.vyos-interface.legend': 'Ethernet interface',
      'task.vyos-interface.field.interface.label': 'Interface',
      'task.vyos-interface.field.interface.help': 'The ethernet interface, e.g. eth0.',
      'task.vyos-interface.field.ip_address.label': 'IP address',
      'task.vyos-interface.field.ip_address.help':
        'IPv4 address with prefix, e.g. 192.168.1.1/24 (VyOS takes CIDR directly).',
      'task.vyos-interface.field.description.label': 'Description',
      'task.vyos-interface.field.description.help':
        'Optional interface description. Omitted from the vars when blank.',
      'task.vyos-interface.field.mtu.label': 'MTU',
      'task.vyos-interface.field.mtu.help': 'Optional MTU in bytes (68–9000). Omitted when blank.',
      'task.vyos-interface.field.enabled.label': 'Administratively enabled',
      'task.vyos-interface.field.enabled.help': 'When off, the interface is disabled.',
    },
    fr: {
      'task.vyos-interface.legend': 'Interface ethernet',
      'task.vyos-interface.field.interface.label': 'Interface',
      'task.vyos-interface.field.interface.help': 'L’interface ethernet, par ex. eth0.',
      'task.vyos-interface.field.ip_address.label': 'Adresse IP',
      'task.vyos-interface.field.ip_address.help':
        'Adresse IPv4 avec préfixe, par ex. 192.168.1.1/24 (VyOS accepte le CIDR directement).',
      'task.vyos-interface.field.description.label': 'Description',
      'task.vyos-interface.field.description.help':
        'Description facultative de l’interface. Omise des variables si vide.',
      'task.vyos-interface.field.mtu.label': 'MTU',
      'task.vyos-interface.field.mtu.help': 'MTU facultatif en octets (68–9000). Omis si vide.',
      'task.vyos-interface.field.enabled.label': 'Activée administrativement',
      'task.vyos-interface.field.enabled.help': 'Si désactivée, l’interface est désactivée (disable).',
    },
  },
};
