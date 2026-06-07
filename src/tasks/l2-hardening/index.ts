/**
 * Curated task: Cisco IOS Layer-2 access-port hardening (issue #76).
 *
 * One switchport's hardening: port-security (max MACs, violation action, sticky
 * learning), DHCP snooping (a trusted uplink, or a rate limit on an untrusted
 * access port), and broadcast storm-control. Base preview is Cisco IOS; IOS-XE
 * renders identical Catalyst CLI (an explicit per-vendor claim, #27).
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the template uses no filters, so the preview is always `exact`.
 * Trim_blocks-authored for Ansible. Authored from public IOS knowledge.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.l2-hardening.legend',
      fields: [
        {
          type: 'text',
          name: 'interface',
          label: 'task.l2-hardening.field.interface.label',
          help: 'task.l2-hardening.field.interface.help',
          required: true,
          placeholder: 'GigabitEthernet0/1',
        },
        {
          type: 'boolean',
          name: 'port_security',
          label: 'task.l2-hardening.field.port_security.label',
          help: 'task.l2-hardening.field.port_security.help',
          default: true,
        },
        {
          type: 'number',
          name: 'max_mac',
          label: 'task.l2-hardening.field.max_mac.label',
          help: 'task.l2-hardening.field.max_mac.help',
          min: 1,
          max: 3000,
          omitWhenBlank: true,
        },
        {
          type: 'select',
          name: 'violation',
          label: 'task.l2-hardening.field.violation.label',
          help: 'task.l2-hardening.field.violation.help',
          default: 'restrict',
          options: [
            { value: 'protect', label: 'task.l2-hardening.violation.protect' },
            { value: 'restrict', label: 'task.l2-hardening.violation.restrict' },
            { value: 'shutdown', label: 'task.l2-hardening.violation.shutdown' },
          ],
        },
        {
          type: 'boolean',
          name: 'sticky',
          label: 'task.l2-hardening.field.sticky.label',
          help: 'task.l2-hardening.field.sticky.help',
          default: true,
        },
        {
          type: 'boolean',
          name: 'dhcp_snoop_trust',
          label: 'task.l2-hardening.field.dhcp_snoop_trust.label',
          help: 'task.l2-hardening.field.dhcp_snoop_trust.help',
          default: false,
        },
        {
          type: 'number',
          name: 'dhcp_snoop_rate',
          label: 'task.l2-hardening.field.dhcp_snoop_rate.label',
          help: 'task.l2-hardening.field.dhcp_snoop_rate.help',
          min: 1,
          max: 2048,
          omitWhenBlank: true,
        },
        {
          type: 'number',
          name: 'storm_level',
          label: 'task.l2-hardening.field.storm_level.label',
          help: 'task.l2-hardening.field.storm_level.help',
          min: 0,
          max: 100,
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS access-port hardening. Optional lines appear only when set;
// a trusted DHCP-snooping uplink takes precedence over an untrusted rate limit.
const template = [
  'interface {{ interface }}',
  '{% if port_security %} switchport port-security',
  '{% if max_mac %} switchport port-security maximum {{ max_mac }}',
  '{% endif %} switchport port-security violation {{ violation }}',
  '{% if sticky %} switchport port-security mac-address sticky',
  '{% endif %}{% endif %}{% if dhcp_snoop_trust %} ip dhcp snooping trust',
  '{% elif dhcp_snoop_rate %} ip dhcp snooping limit rate {{ dhcp_snoop_rate }}',
  '{% endif %}{% if storm_level %} storm-control broadcast level {{ storm_level }}',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'l2-hardening',
    title: 'Cisco IOS L2 access-port hardening',
    description:
      'Generate Ansible host_vars and a Cisco IOS access-port hardening config — port-security, DHCP snooping, and storm-control — with a live device-CLI preview.',
    schema,
    template,
    templates: {
      // IOS-XE (Catalyst) renders identical switchport-security / DHCP-snooping /
      // storm-control CLI (#27): an explicit per-vendor claim, not an inference.
      'cisco-iosxe': template,
    },
    defaultScope: { kind: 'host', name: 'switch1' },
  },
  messages: {
    en: {
      'task.l2-hardening.legend': 'Access-port hardening',
      'task.l2-hardening.field.interface.label': 'Interface',
      'task.l2-hardening.field.interface.help': 'The access port to harden, e.g. GigabitEthernet0/1.',
      'task.l2-hardening.field.port_security.label': 'Port security',
      'task.l2-hardening.field.port_security.help': 'Enable switchport port-security on the port.',
      'task.l2-hardening.field.max_mac.label': 'Maximum MAC addresses',
      'task.l2-hardening.field.max_mac.help':
        'Optional cap on learned MACs (1–3000). Omitted from the vars when blank.',
      'task.l2-hardening.field.violation.label': 'Violation action',
      'task.l2-hardening.field.violation.help':
        'What happens when the limit is exceeded: protect (drop), restrict (drop + log), or shutdown.',
      'task.l2-hardening.violation.protect': 'protect',
      'task.l2-hardening.violation.restrict': 'restrict',
      'task.l2-hardening.violation.shutdown': 'shutdown',
      'task.l2-hardening.field.sticky.label': 'Sticky MAC learning',
      'task.l2-hardening.field.sticky.help': 'Learn and pin MAC addresses to the running config.',
      'task.l2-hardening.field.dhcp_snoop_trust.label': 'DHCP snooping trusted',
      'task.l2-hardening.field.dhcp_snoop_trust.help':
        'Mark this port as a trusted DHCP-snooping uplink (e.g. toward the DHCP server).',
      'task.l2-hardening.field.dhcp_snoop_rate.label': 'DHCP snooping rate limit',
      'task.l2-hardening.field.dhcp_snoop_rate.help':
        'Untrusted-port DHCP packet rate (pps). Ignored when the port is trusted; omitted when blank.',
      'task.l2-hardening.field.storm_level.label': 'Broadcast storm-control level (%)',
      'task.l2-hardening.field.storm_level.help':
        'Suppress broadcast traffic above this percent of bandwidth. Omitted from the vars when blank.',
    },
    fr: {
      'task.l2-hardening.legend': 'Durcissement du port d’accès',
      'task.l2-hardening.field.interface.label': 'Interface',
      'task.l2-hardening.field.interface.help':
        'Le port d’accès à durcir, par ex. GigabitEthernet0/1.',
      'task.l2-hardening.field.port_security.label': 'Sécurité de port',
      'task.l2-hardening.field.port_security.help':
        'Activer switchport port-security sur le port.',
      'task.l2-hardening.field.max_mac.label': 'Nombre maximal d’adresses MAC',
      'task.l2-hardening.field.max_mac.help':
        'Limite facultative des MAC apprises (1–3000). Omise des variables si vide.',
      'task.l2-hardening.field.violation.label': 'Action en cas de violation',
      'task.l2-hardening.field.violation.help':
        'Comportement au dépassement : protect (rejet), restrict (rejet + journal) ou shutdown.',
      'task.l2-hardening.violation.protect': 'protect',
      'task.l2-hardening.violation.restrict': 'restrict',
      'task.l2-hardening.violation.shutdown': 'shutdown',
      'task.l2-hardening.field.sticky.label': 'Apprentissage MAC « sticky »',
      'task.l2-hardening.field.sticky.help':
        'Apprendre et figer les adresses MAC dans la configuration courante.',
      'task.l2-hardening.field.dhcp_snoop_trust.label': 'DHCP snooping de confiance',
      'task.l2-hardening.field.dhcp_snoop_trust.help':
        'Marquer ce port comme liaison montante DHCP-snooping de confiance (vers le serveur DHCP).',
      'task.l2-hardening.field.dhcp_snoop_rate.label': 'Limite de débit DHCP snooping',
      'task.l2-hardening.field.dhcp_snoop_rate.help':
        'Débit de paquets DHCP (pps) sur un port non fiable. Ignoré si le port est de confiance ; omis si vide.',
      'task.l2-hardening.field.storm_level.label': 'Niveau storm-control broadcast (%)',
      'task.l2-hardening.field.storm_level.help':
        'Supprimer le trafic broadcast au-dessus de ce pourcentage de bande passante. Omis si vide.',
    },
  },
};
