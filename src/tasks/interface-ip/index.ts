/**
 * Reference task: Cisco IOS interface + IPv4 address (issue #6).
 *
 * This is the copy-paste pattern for the wave-3 task library (#7–#11). A task is
 * a `TaskModule`: a correct-by-construction `FormSchema`, a Jinja2 preview
 * template that renders to device CLI, a default output scope, and its own copy.
 * Drop a folder like this under `src/tasks/<slug>/` and it auto-registers.
 *
 * Correctness model (council §4): the YAML vars are taken straight from the field
 * values and are always correct; this template only drives the *preview*, which
 * uses the `exact`-tier `ipaddr` filter so the rendered CLI matches Ansible.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.interface-ip.legend',
      fields: [
        {
          type: 'text',
          name: 'interface',
          label: 'task.interface-ip.field.interface.label',
          help: 'task.interface-ip.field.interface.help',
          required: true,
          placeholder: 'GigabitEthernet0/1',
        },
        {
          type: 'text',
          name: 'description',
          label: 'task.interface-ip.field.description.label',
          help: 'task.interface-ip.field.description.help',
          placeholder: 'Uplink to core',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'ip_address',
          label: 'task.interface-ip.field.ip_address.label',
          help: 'task.interface-ip.field.ip_address.help',
          required: true,
          placeholder: '10.0.0.1/24',
        },
        {
          type: 'number',
          name: 'mtu',
          label: 'task.interface-ip.field.mtu.label',
          help: 'task.interface-ip.field.mtu.help',
          min: 68,
          max: 9216,
          omitWhenBlank: true,
        },
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

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline after each `{% endif %}` is swallowed, so optional lines leave no gap.
const template = [
  'interface {{ interface }}',
  '{% if description %} description {{ description }}',
  "{% endif %} ip address {{ ip_address | ipaddr('address') }} {{ ip_address | ipaddr('netmask') }}",
  '{% if mtu %} mtu {{ mtu }}',
  '{% endif %}{% if enabled %} no shutdown',
  '{% else %} shutdown',
  '{% endif %}',
].join('\n');

// NX-OS and Arista EOS take the prefix-length form (`ip address 10.0.0.1/24`)
// instead of IOS's address + mask. That address line is the well-known divergence;
// routed-port defaults (e.g. `no switchport` on some platforms) are NOT modelled,
// so these ship `fidelity: 'approximate'` — a visible degrade, never a false exact.
const slashTemplate = [
  'interface {{ interface }}',
  '{% if description %} description {{ description }}',
  '{% endif %} ip address {{ ip_address }}',
  '{% if mtu %} mtu {{ mtu }}',
  '{% endif %}{% if enabled %} no shutdown',
  '{% else %} shutdown',
  '{% endif %}',
].join('\n');

// Cisco IOS-XR (#37). Verified exact against Cisco's IOS-XR IP Addresses command
// reference: the address keyword is `ipv4 address <addr> <mask>` (not IOS's
// `ip address`); `description`, interface-level `mtu`, and `shutdown`/`no
// shutdown` are identical. IOS-XR routers are L3 by default, so no switchport
// caveat applies here (unlike the NX-OS/EOS overlays above).
const iosxrTemplate = [
  'interface {{ interface }}',
  '{% if description %} description {{ description }}',
  "{% endif %} ipv4 address {{ ip_address | ipaddr('address') }} {{ ip_address | ipaddr('netmask') }}",
  '{% if mtu %} mtu {{ mtu }}',
  '{% endif %}{% if enabled %} no shutdown',
  '{% else %} shutdown',
  '{% endif %}',
].join('\n');

// Juniper Junos renders the flat `set …` form (#39, per the #36 decision). Authored
// from public Junos syntax, not curated against gear, so flagged approximate.
// `ip_address` is already CIDR (e.g. 10.0.0.1/24), which Junos takes verbatim.
const junosTemplate = [
  'set interfaces {{ interface }} unit 0 family inet address {{ ip_address }}',
  '{% if description %}set interfaces {{ interface }} description "{{ description }}"',
  '{% endif %}{% if mtu %}set interfaces {{ interface }} mtu {{ mtu }}',
  '{% endif %}{% if enabled %}{% else %}set interfaces {{ interface }} disable',
  '{% endif %}',
].join('\n');

// Huawei VRP (#73). IOS-adjacent line CLI: `ip address <addr> <mask>` (dotted
// mask, same as IOS) and `description` map verbatim, but VRP enables an interface
// with `undo shutdown` (not `no shutdown`). Authored from public VRP references,
// not curated against gear, so flagged approximate.
const vrpTemplate = [
  'interface {{ interface }}',
  '{% if description %} description {{ description }}',
  "{% endif %} ip address {{ ip_address | ipaddr('address') }} {{ ip_address | ipaddr('netmask') }}",
  '{% if mtu %} mtu {{ mtu }}',
  '{% endif %}{% if enabled %} undo shutdown',
  '{% else %} shutdown',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'interface-ip',
    title: 'Cisco IOS interface & IP address',
    description:
      'Generate Ansible host_vars and a Cisco IOS interface configuration — set the interface, IPv4 address, MTU, and admin state — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE renders identical interface CLI (#27): an explicit per-vendor claim,
    // not an inference. NX-OS/EOS diverge (prefix-length IP) and are flagged
    // approximate. Same schema, same vars — only the previewed CLI changes.
    templates: {
      'cisco-iosxe': template,
      'cisco-nxos': { template: slashTemplate, fidelity: 'approximate' },
      'arista-eos': { template: slashTemplate, fidelity: 'approximate' },
      // IOS-XR uses `ipv4 address <addr> <mask>`, verified exact (#37).
      'cisco-iosxr': iosxrTemplate,
      'juniper-junos': { template: junosTemplate, fidelity: 'approximate' },
      // Huawei VRP: IOS-like, but `undo shutdown` to enable (#73). Approximate.
      'huawei-vrp': { template: vrpTemplate, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'host', name: 'switch1' },
  },
  messages: {
    en: {
      'task.interface-ip.legend': 'Interface & IP address',
      'task.interface-ip.field.interface.label': 'Interface',
      'task.interface-ip.field.interface.help':
        'The interface to configure, e.g. GigabitEthernet0/1.',
      'task.interface-ip.field.description.label': 'Description',
      'task.interface-ip.field.description.help':
        'Optional interface description. Omitted from the vars when left blank.',
      'task.interface-ip.field.ip_address.label': 'IP address',
      'task.interface-ip.field.ip_address.help': 'IPv4 address with prefix, e.g. 10.0.0.1/24.',
      'task.interface-ip.field.mtu.label': 'MTU',
      'task.interface-ip.field.mtu.help': 'Optional MTU in bytes (68–9216). Omitted when blank.',
      'task.interface-ip.field.enabled.label': 'Administratively enabled',
      'task.interface-ip.field.enabled.help': 'When off, the interface is shut down.',
    },
    fr: {
      'task.interface-ip.legend': 'Interface et adresse IP',
      'task.interface-ip.field.interface.label': 'Interface',
      'task.interface-ip.field.interface.help':
        'L’interface à configurer, par ex. GigabitEthernet0/1.',
      'task.interface-ip.field.description.label': 'Description',
      'task.interface-ip.field.description.help':
        'Description facultative de l’interface. Omise des variables si laissée vide.',
      'task.interface-ip.field.ip_address.label': 'Adresse IP',
      'task.interface-ip.field.ip_address.help': 'Adresse IPv4 avec préfixe, par ex. 10.0.0.1/24.',
      'task.interface-ip.field.mtu.label': 'MTU',
      'task.interface-ip.field.mtu.help': 'MTU facultatif en octets (68–9216). Omis si vide.',
      'task.interface-ip.field.enabled.label': 'Activée administrativement',
      'task.interface-ip.field.enabled.help': 'Si désactivée, l’interface est arrêtée (shutdown).',
    },
  },
};
