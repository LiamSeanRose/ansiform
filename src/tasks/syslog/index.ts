/**
 * Curated task: Cisco IOS syslog / logging hosts (issue #22).
 *
 * The first list-shaped task built on the #20 `list` field type: a repeating
 * group of logging hosts, plus the scalar trap level and source-interface that
 * frame them. Each host renders as one `logging host …` line.
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — a list becomes a YAML sequence of per-row mappings
 * with omit-on-blank applied inside each row. The template uses no filters, so
 * the device-CLI preview is always `exact`. The optional per-host VRF sits in
 * the middle of the line (the trailing token is the always-present transport),
 * so the per-row newline follows an output and survives `trim_blocks`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

// Dotted IPv4, e.g. 192.0.2.50.
const IPV4 = '^(\\d{1,3}\\.){3}\\d{1,3}$';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.syslog.legend',
      fields: [
        {
          type: 'select',
          name: 'trap_level',
          label: 'task.syslog.field.trap_level.label',
          help: 'task.syslog.field.trap_level.help',
          default: 'informational',
          options: [
            { value: 'emergencies', label: 'task.syslog.trap_level.emergencies' },
            { value: 'alerts', label: 'task.syslog.trap_level.alerts' },
            { value: 'critical', label: 'task.syslog.trap_level.critical' },
            { value: 'errors', label: 'task.syslog.trap_level.errors' },
            { value: 'warnings', label: 'task.syslog.trap_level.warnings' },
            { value: 'notifications', label: 'task.syslog.trap_level.notifications' },
            { value: 'informational', label: 'task.syslog.trap_level.informational' },
            { value: 'debugging', label: 'task.syslog.trap_level.debugging' },
          ],
        },
        {
          type: 'text',
          name: 'source_interface',
          label: 'task.syslog.field.source_interface.label',
          help: 'task.syslog.field.source_interface.help',
          placeholder: 'Loopback0',
          omitWhenBlank: true,
        },
        {
          type: 'list',
          name: 'hosts',
          label: 'task.syslog.field.hosts.label',
          help: 'task.syslog.field.hosts.help',
          minRows: 1,
          addLabel: 'task.syslog.field.hosts.add',
          itemLabel: 'task.syslog.field.hosts.item',
          fields: [
            {
              type: 'text',
              name: 'host',
              label: 'task.syslog.field.hosts.host.label',
              help: 'task.syslog.field.hosts.host.help',
              required: true,
              pattern: IPV4,
              placeholder: '192.0.2.50',
            },
            {
              type: 'text',
              name: 'vrf',
              label: 'task.syslog.field.hosts.vrf.label',
              help: 'task.syslog.field.hosts.vrf.help',
              placeholder: 'Mgmt-intf',
              omitWhenBlank: true,
            },
            {
              type: 'select',
              name: 'transport',
              label: 'task.syslog.field.hosts.transport.label',
              help: 'task.syslog.field.hosts.transport.help',
              default: 'udp',
              options: [
                { value: 'udp', label: 'task.syslog.transport.udp' },
                { value: 'tcp', label: 'task.syslog.transport.tcp' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// optional source-interface line carries its newline inside the `{% if %}`; the
// per-host line ends in the always-present transport, so its trailing newline
// follows an output and survives trim_blocks (one line per host).
const template = [
  '{% if source_interface %}logging source-interface {{ source_interface }}',
  '{% endif %}logging trap {{ trap_level }}',
  '{% for h in hosts %}logging host {{ h.host }}{% if h.vrf %} vrf {{ h.vrf }}{% endif %} transport {{ h.transport }}',
  '{% endfor %}',
].join('\n');

// NX-OS: destinations are `logging server` (VRF via `use-vrf`); severity is set
// per-facility with `logging level`, not a single `logging trap`, so trap level
// and the IOS `transport` keyword are dropped here. Verified exact against
// Cisco's Nexus System Management Configuration Guide: `logging source-interface
// <intf>` and `logging server <host> [use-vrf <vrf>]` (the optional
// severity/facility tokens are omitted). The per-row newline uses `{{ '\n' }}`
// because trim_blocks would eat one placed after the inline `{% endif %}`.
const templateNxos = [
  '{% if source_interface %}logging source-interface {{ source_interface }}',
  "{% endif %}{% for h in hosts %}logging server {{ h.host }}{% if h.vrf %} use-vrf {{ h.vrf }}{% endif %}{{ '\\n' }}{% endfor %}",
].join('\n');

// Arista EOS: corrected toward verified syntax — EOS uses `logging
// local-interface` (not `source-interface`) and orders VRF before the host
// (`logging vrf <vrf> host <host>`). Still shipped APPROXIMATE: the standalone
// `logging local-interface` form (no VRF) and the full trap-severity name set
// have not been line-verified, so the preview keeps its degrade banner.
const templateEos = [
  '{% if source_interface %}logging local-interface {{ source_interface }}',
  '{% endif %}logging trap {{ trap_level }}',
  "{% for h in hosts %}{% if h.vrf %}logging vrf {{ h.vrf }} host {{ h.host }}{% else %}logging host {{ h.host }}{% endif %}{{ '\\n' }}{% endfor %}",
].join('\n');

// Cisco IOS-XR (#37): destinations are a bare `logging <ip>` (no `host` keyword),
// and `logging source-interface` is identical. Crucially, `trap_level` is dropped
// here — on IOS-XR `logging trap <severity>` sets the SNMP-trap severity, NOT the
// syslog-destination severity, so reusing it would be silently wrong. Shipped
// APPROXIMATE: the VRF/severity placement on the destination line and the
// `transport` keyword (absent on IOS-XR) are not yet line-verified.
const templateIosxr = [
  '{% if source_interface %}logging source-interface {{ source_interface }}',
  "{% endif %}{% for h in hosts %}logging {{ h.host }}{% if h.vrf %} vrf {{ h.vrf }}{% endif %}{{ '\\n' }}{% endfor %}",
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'syslog',
    title: 'Cisco IOS syslog / logging hosts',
    description:
      'Generate Ansible group_vars and a Cisco IOS logging configuration — trap level, source-interface, and a repeating list of syslog hosts with per-host VRF and transport — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE shares the IOS logging CLI verbatim; NX-OS is verified exact against
    // Cisco's Nexus guide (#34). EOS and IOS-XR stay approximate — partially
    // corrected but not yet fully line-verified — so their previews keep the
    // degrade banner (#37 for IOS-XR).
    templates: {
      'cisco-iosxe': template,
      'cisco-nxos': templateNxos,
      'arista-eos': { template: templateEos, fidelity: 'approximate' },
      'cisco-iosxr': { template: templateIosxr, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.syslog.legend': 'Logging',
      'task.syslog.field.trap_level.label': 'Trap level',
      'task.syslog.field.trap_level.help':
        'Lowest severity sent to the syslog hosts; messages at this level and higher are forwarded.',
      'task.syslog.trap_level.emergencies': 'emergencies (0)',
      'task.syslog.trap_level.alerts': 'alerts (1)',
      'task.syslog.trap_level.critical': 'critical (2)',
      'task.syslog.trap_level.errors': 'errors (3)',
      'task.syslog.trap_level.warnings': 'warnings (4)',
      'task.syslog.trap_level.notifications': 'notifications (5)',
      'task.syslog.trap_level.informational': 'informational (6)',
      'task.syslog.trap_level.debugging': 'debugging (7)',
      'task.syslog.field.source_interface.label': 'Source interface',
      'task.syslog.field.source_interface.help':
        'Optional interface whose IP sources the syslog traffic, e.g. Loopback0. Omitted when blank.',
      'task.syslog.field.hosts.label': 'Syslog hosts',
      'task.syslog.field.hosts.help': 'One or more syslog collectors to forward logs to.',
      'task.syslog.field.hosts.add': 'Add host',
      'task.syslog.field.hosts.item': 'Host {index}',
      'task.syslog.field.hosts.host.label': 'Host IP',
      'task.syslog.field.hosts.host.help': 'IPv4 address of the syslog collector, e.g. 192.0.2.50.',
      'task.syslog.field.hosts.vrf.label': 'VRF',
      'task.syslog.field.hosts.vrf.help':
        'Optional VRF the collector is reached through, e.g. Mgmt-intf. Omitted when blank.',
      'task.syslog.field.hosts.transport.label': 'Transport',
      'task.syslog.field.hosts.transport.help': 'Transport protocol used to reach this collector.',
      'task.syslog.transport.udp': 'udp (port 514)',
      'task.syslog.transport.tcp': 'tcp',
    },
    fr: {
      'task.syslog.legend': 'Journalisation',
      'task.syslog.field.trap_level.label': 'Niveau de trap',
      'task.syslog.field.trap_level.help':
        'Sévérité minimale envoyée aux hôtes syslog ; les messages de ce niveau et supérieurs sont transmis.',
      'task.syslog.trap_level.emergencies': 'emergencies (0)',
      'task.syslog.trap_level.alerts': 'alerts (1)',
      'task.syslog.trap_level.critical': 'critical (2)',
      'task.syslog.trap_level.errors': 'errors (3)',
      'task.syslog.trap_level.warnings': 'warnings (4)',
      'task.syslog.trap_level.notifications': 'notifications (5)',
      'task.syslog.trap_level.informational': 'informational (6)',
      'task.syslog.trap_level.debugging': 'debugging (7)',
      'task.syslog.field.source_interface.label': 'Interface source',
      'task.syslog.field.source_interface.help':
        'Interface facultative dont l’IP source le trafic syslog, par ex. Loopback0. Omise si vide.',
      'task.syslog.field.hosts.label': 'Hôtes syslog',
      'task.syslog.field.hosts.help': 'Un ou plusieurs collecteurs syslog vers qui transférer les journaux.',
      'task.syslog.field.hosts.add': 'Ajouter un hôte',
      'task.syslog.field.hosts.item': 'Hôte {index}',
      'task.syslog.field.hosts.host.label': 'IP de l’hôte',
      'task.syslog.field.hosts.host.help': 'Adresse IPv4 du collecteur syslog, par ex. 192.0.2.50.',
      'task.syslog.field.hosts.vrf.label': 'VRF',
      'task.syslog.field.hosts.vrf.help':
        'VRF facultative par laquelle le collecteur est joint, par ex. Mgmt-intf. Omise si vide.',
      'task.syslog.field.hosts.transport.label': 'Transport',
      'task.syslog.field.hosts.transport.help': 'Protocole de transport utilisé pour joindre ce collecteur.',
      'task.syslog.transport.udp': 'udp (port 514)',
      'task.syslog.transport.tcp': 'tcp',
    },
  },
};
