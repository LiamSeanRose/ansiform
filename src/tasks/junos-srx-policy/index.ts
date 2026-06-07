/**
 * Curated task: Juniper SRX security zones and policies — multi-entry (issue #77).
 *
 * The first SRX-flavoured Junos task: it stays in the flat `set …` form (#36/#39)
 * but covers the SRX security stack — security zones (with an interface binding and
 * a host-inbound system-service), global address-book entries, and zone-pair
 * policies (from-zone/to-zone match + permit/deny/reject). Three independent
 * `list` fields (#20), one section each, so a config can carry any combination.
 *
 * Honesty (#39): the YAML vars are always correct; the preview is authored from
 * public SRX syntax and not device-verified, so the task declares
 * `fidelityFloor: 'approximate'` and the pane always shows the degrade notice.
 * The template uses no filters, so it renders `exact` before the floor clamps it.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.junos-srx-policy.zones.legend',
      fields: [
        {
          type: 'list',
          name: 'zones',
          label: 'task.junos-srx-policy.field.zones.label',
          help: 'task.junos-srx-policy.field.zones.help',
          required: true,
          minRows: 1,
          addLabel: 'task.junos-srx-policy.zones.add',
          removeLabel: 'task.junos-srx-policy.zones.remove',
          itemLabel: 'task.junos-srx-policy.zones.item',
          fields: [
            {
              type: 'text',
              name: 'name',
              label: 'task.junos-srx-policy.field.zone_name.label',
              help: 'task.junos-srx-policy.field.zone_name.help',
              required: true,
              placeholder: 'trust',
            },
            {
              type: 'text',
              name: 'interface',
              label: 'task.junos-srx-policy.field.zone_interface.label',
              help: 'task.junos-srx-policy.field.zone_interface.help',
              placeholder: 'ge-0/0/0.0',
              format: 'ifname',
              omitWhenBlank: true,
            },
            {
              type: 'select',
              name: 'host_inbound',
              label: 'task.junos-srx-policy.field.host_inbound.label',
              help: 'task.junos-srx-policy.field.host_inbound.help',
              default: '',
              omitWhenBlank: true,
              options: [
                { value: '', label: 'task.junos-srx-policy.host_inbound.none' },
                { value: 'all', label: 'task.junos-srx-policy.host_inbound.all' },
                { value: 'ping', label: 'task.junos-srx-policy.host_inbound.ping' },
                { value: 'ssh', label: 'task.junos-srx-policy.host_inbound.ssh' },
                { value: 'https', label: 'task.junos-srx-policy.host_inbound.https' },
              ],
            },
          ],
        },
      ],
    },
    {
      legend: 'task.junos-srx-policy.addresses.legend',
      fields: [
        {
          type: 'list',
          name: 'addresses',
          label: 'task.junos-srx-policy.field.addresses.label',
          help: 'task.junos-srx-policy.field.addresses.help',
          omitWhenBlank: true,
          addLabel: 'task.junos-srx-policy.addresses.add',
          removeLabel: 'task.junos-srx-policy.addresses.remove',
          itemLabel: 'task.junos-srx-policy.addresses.item',
          fields: [
            {
              type: 'text',
              name: 'name',
              label: 'task.junos-srx-policy.field.address_name.label',
              help: 'task.junos-srx-policy.field.address_name.help',
              required: true,
              placeholder: 'web-server',
            },
            {
              type: 'text',
              name: 'prefix',
              label: 'task.junos-srx-policy.field.address_prefix.label',
              help: 'task.junos-srx-policy.field.address_prefix.help',
              required: true,
              placeholder: '10.1.1.0/24',
              format: 'cidr',
            },
          ],
        },
      ],
    },
    {
      legend: 'task.junos-srx-policy.policies.legend',
      fields: [
        {
          type: 'list',
          name: 'policies',
          label: 'task.junos-srx-policy.field.policies.label',
          help: 'task.junos-srx-policy.field.policies.help',
          omitWhenBlank: true,
          addLabel: 'task.junos-srx-policy.policies.add',
          removeLabel: 'task.junos-srx-policy.policies.remove',
          itemLabel: 'task.junos-srx-policy.policies.item',
          fields: [
            {
              type: 'text',
              name: 'name',
              label: 'task.junos-srx-policy.field.policy_name.label',
              help: 'task.junos-srx-policy.field.policy_name.help',
              required: true,
              placeholder: 'allow-web',
            },
            {
              type: 'text',
              name: 'from_zone',
              label: 'task.junos-srx-policy.field.from_zone.label',
              help: 'task.junos-srx-policy.field.from_zone.help',
              required: true,
              placeholder: 'trust',
            },
            {
              type: 'text',
              name: 'to_zone',
              label: 'task.junos-srx-policy.field.to_zone.label',
              help: 'task.junos-srx-policy.field.to_zone.help',
              required: true,
              placeholder: 'untrust',
            },
            {
              type: 'text',
              name: 'source_address',
              label: 'task.junos-srx-policy.field.source_address.label',
              help: 'task.junos-srx-policy.field.source_address.help',
              required: true,
              default: 'any',
            },
            {
              type: 'text',
              name: 'destination_address',
              label: 'task.junos-srx-policy.field.destination_address.label',
              help: 'task.junos-srx-policy.field.destination_address.help',
              required: true,
              default: 'any',
            },
            {
              type: 'text',
              name: 'application',
              label: 'task.junos-srx-policy.field.application.label',
              help: 'task.junos-srx-policy.field.application.help',
              required: true,
              default: 'any',
            },
            {
              type: 'select',
              name: 'action',
              label: 'task.junos-srx-policy.field.action.label',
              help: 'task.junos-srx-policy.field.action.help',
              default: 'permit',
              options: [
                { value: 'permit', label: 'task.junos-srx-policy.action.permit' },
                { value: 'deny', label: 'task.junos-srx-policy.action.deny' },
                { value: 'reject', label: 'task.junos-srx-policy.action.reject' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Junos SRX `set` form. Three independent loops (zones, address book,
// policies); each emits one or more `set` lines per row. The host-inbound service
// and interface lines are conditional. No filters → renders exact, then
// `fidelityFloor` clamps the preview to approximate.
const template =
  '{% for z in zones %}' +
  'set security zones security-zone {{ z.name }}' +
  "{{ '\\n' }}" +
  '{% if z.interface %}set security zones security-zone {{ z.name }} interfaces {{ z.interface }}' +
  "{{ '\\n' }}{% endif %}" +
  '{% if z.host_inbound %}set security zones security-zone {{ z.name }} host-inbound-traffic system-services {{ z.host_inbound }}' +
  "{{ '\\n' }}{% endif %}" +
  '{% endfor %}' +
  '{% for a in addresses %}' +
  'set security address-book global address {{ a.name }} {{ a.prefix }}' +
  "{{ '\\n' }}" +
  '{% endfor %}' +
  '{% for p in policies %}' +
  'set security policies from-zone {{ p.from_zone }} to-zone {{ p.to_zone }} policy {{ p.name }} match source-address {{ p.source_address }}' +
  "{{ '\\n' }}" +
  'set security policies from-zone {{ p.from_zone }} to-zone {{ p.to_zone }} policy {{ p.name }} match destination-address {{ p.destination_address }}' +
  "{{ '\\n' }}" +
  'set security policies from-zone {{ p.from_zone }} to-zone {{ p.to_zone }} policy {{ p.name }} match application {{ p.application }}' +
  "{{ '\\n' }}" +
  'set security policies from-zone {{ p.from_zone }} to-zone {{ p.to_zone }} policy {{ p.name }} then {{ p.action }}' +
  "{{ '\\n' }}" +
  '{% endfor %}';

export const task: TaskModule = {
  definition: {
    slug: 'junos-srx-policy',
    title: 'Juniper SRX security zones and policies',
    description:
      'Generate Ansible group_vars and Juniper SRX security configuration — security zones with interface bindings and host-inbound services, global address-book entries, and zone-pair policies — with an approximate device-config preview.',
    vendor: 'juniper-junos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.junos-srx-policy.zones.legend': 'Security zones',
      'task.junos-srx-policy.field.zones.label': 'Zones',
      'task.junos-srx-policy.field.zones.help':
        'One or more security zones, each optionally bound to an interface and permitting a host-inbound service.',
      'task.junos-srx-policy.zones.add': 'Add zone',
      'task.junos-srx-policy.zones.item': 'Zone {index}',
      'task.junos-srx-policy.zones.remove': 'Remove zone {index}',
      'task.junos-srx-policy.field.zone_name.label': 'Zone name',
      'task.junos-srx-policy.field.zone_name.help': 'Security-zone name, e.g. trust or untrust.',
      'task.junos-srx-policy.field.zone_interface.label': 'Interface',
      'task.junos-srx-policy.field.zone_interface.help':
        'Logical interface bound to the zone, e.g. ge-0/0/0.0. Omitted from the vars when blank.',
      'task.junos-srx-policy.field.host_inbound.label': 'Host-inbound service',
      'task.junos-srx-policy.field.host_inbound.help':
        'System service the zone accepts to the device itself (host-inbound-traffic). Leave as none to add no service.',
      'task.junos-srx-policy.host_inbound.none': 'None',
      'task.junos-srx-policy.host_inbound.all': 'All',
      'task.junos-srx-policy.host_inbound.ping': 'Ping',
      'task.junos-srx-policy.host_inbound.ssh': 'SSH',
      'task.junos-srx-policy.host_inbound.https': 'HTTPS',
      'task.junos-srx-policy.addresses.legend': 'Address book (global)',
      'task.junos-srx-policy.field.addresses.label': 'Address-book entries',
      'task.junos-srx-policy.field.addresses.help':
        'Named entries in the global address book, referenced by name in policies. Optional.',
      'task.junos-srx-policy.addresses.add': 'Add address',
      'task.junos-srx-policy.addresses.item': 'Address {index}',
      'task.junos-srx-policy.addresses.remove': 'Remove address {index}',
      'task.junos-srx-policy.field.address_name.label': 'Name',
      'task.junos-srx-policy.field.address_name.help':
        'Address-book entry name, e.g. web-server.',
      'task.junos-srx-policy.field.address_prefix.label': 'Prefix',
      'task.junos-srx-policy.field.address_prefix.help':
        'Host or subnet in CIDR, e.g. 10.1.1.0/24 or 203.0.113.5/32.',
      'task.junos-srx-policy.policies.legend': 'Zone-pair policies',
      'task.junos-srx-policy.field.policies.label': 'Policies',
      'task.junos-srx-policy.field.policies.help':
        'Security policies between a source and destination zone. Optional.',
      'task.junos-srx-policy.policies.add': 'Add policy',
      'task.junos-srx-policy.policies.item': 'Policy {index}',
      'task.junos-srx-policy.policies.remove': 'Remove policy {index}',
      'task.junos-srx-policy.field.policy_name.label': 'Policy name',
      'task.junos-srx-policy.field.policy_name.help': 'Policy name, e.g. allow-web.',
      'task.junos-srx-policy.field.from_zone.label': 'From zone',
      'task.junos-srx-policy.field.from_zone.help': 'Source security zone, e.g. trust.',
      'task.junos-srx-policy.field.to_zone.label': 'To zone',
      'task.junos-srx-policy.field.to_zone.help': 'Destination security zone, e.g. untrust.',
      'task.junos-srx-policy.field.source_address.label': 'Source address',
      'task.junos-srx-policy.field.source_address.help':
        'Match source address — an address-book name or any.',
      'task.junos-srx-policy.field.destination_address.label': 'Destination address',
      'task.junos-srx-policy.field.destination_address.help':
        'Match destination address — an address-book name or any.',
      'task.junos-srx-policy.field.application.label': 'Application',
      'task.junos-srx-policy.field.application.help':
        'Match application, e.g. junos-https, junos-ssh, or any.',
      'task.junos-srx-policy.field.action.label': 'Action',
      'task.junos-srx-policy.field.action.help':
        'Permit, deny (silently drop), or reject (drop and notify) matching traffic.',
      'task.junos-srx-policy.action.permit': 'Permit',
      'task.junos-srx-policy.action.deny': 'Deny',
      'task.junos-srx-policy.action.reject': 'Reject',
    },
    fr: {
      'task.junos-srx-policy.zones.legend': 'Zones de sécurité',
      'task.junos-srx-policy.field.zones.label': 'Zones',
      'task.junos-srx-policy.field.zones.help':
        'Une ou plusieurs zones de sécurité, chacune éventuellement liée à une interface et autorisant un service host-inbound.',
      'task.junos-srx-policy.zones.add': 'Ajouter une zone',
      'task.junos-srx-policy.zones.item': 'Zone {index}',
      'task.junos-srx-policy.zones.remove': 'Supprimer la zone {index}',
      'task.junos-srx-policy.field.zone_name.label': 'Nom de la zone',
      'task.junos-srx-policy.field.zone_name.help':
        'Nom de la zone de sécurité, par ex. trust ou untrust.',
      'task.junos-srx-policy.field.zone_interface.label': 'Interface',
      'task.junos-srx-policy.field.zone_interface.help':
        'Interface logique liée à la zone, par ex. ge-0/0/0.0. Omise des variables si vide.',
      'task.junos-srx-policy.field.host_inbound.label': 'Service host-inbound',
      'task.junos-srx-policy.field.host_inbound.help':
        'Service système accepté par la zone vers le périphérique lui-même (host-inbound-traffic). Laisser sur aucun pour n’ajouter aucun service.',
      'task.junos-srx-policy.host_inbound.none': 'Aucun',
      'task.junos-srx-policy.host_inbound.all': 'Tous',
      'task.junos-srx-policy.host_inbound.ping': 'Ping',
      'task.junos-srx-policy.host_inbound.ssh': 'SSH',
      'task.junos-srx-policy.host_inbound.https': 'HTTPS',
      'task.junos-srx-policy.addresses.legend': 'Carnet d’adresses (global)',
      'task.junos-srx-policy.field.addresses.label': 'Entrées du carnet d’adresses',
      'task.junos-srx-policy.field.addresses.help':
        'Entrées nommées du carnet d’adresses global, référencées par nom dans les politiques. Facultatif.',
      'task.junos-srx-policy.addresses.add': 'Ajouter une adresse',
      'task.junos-srx-policy.addresses.item': 'Adresse {index}',
      'task.junos-srx-policy.addresses.remove': 'Supprimer l’adresse {index}',
      'task.junos-srx-policy.field.address_name.label': 'Nom',
      'task.junos-srx-policy.field.address_name.help':
        'Nom de l’entrée du carnet d’adresses, par ex. web-server.',
      'task.junos-srx-policy.field.address_prefix.label': 'Préfixe',
      'task.junos-srx-policy.field.address_prefix.help':
        'Hôte ou sous-réseau en CIDR, par ex. 10.1.1.0/24 ou 203.0.113.5/32.',
      'task.junos-srx-policy.policies.legend': 'Politiques entre zones',
      'task.junos-srx-policy.field.policies.label': 'Politiques',
      'task.junos-srx-policy.field.policies.help':
        'Politiques de sécurité entre une zone source et une zone de destination. Facultatif.',
      'task.junos-srx-policy.policies.add': 'Ajouter une politique',
      'task.junos-srx-policy.policies.item': 'Politique {index}',
      'task.junos-srx-policy.policies.remove': 'Supprimer la politique {index}',
      'task.junos-srx-policy.field.policy_name.label': 'Nom de la politique',
      'task.junos-srx-policy.field.policy_name.help': 'Nom de la politique, par ex. allow-web.',
      'task.junos-srx-policy.field.from_zone.label': 'Zone source',
      'task.junos-srx-policy.field.from_zone.help': 'Zone de sécurité source, par ex. trust.',
      'task.junos-srx-policy.field.to_zone.label': 'Zone de destination',
      'task.junos-srx-policy.field.to_zone.help':
        'Zone de sécurité de destination, par ex. untrust.',
      'task.junos-srx-policy.field.source_address.label': 'Adresse source',
      'task.junos-srx-policy.field.source_address.help':
        'Adresse source à comparer — un nom du carnet d’adresses ou any.',
      'task.junos-srx-policy.field.destination_address.label': 'Adresse de destination',
      'task.junos-srx-policy.field.destination_address.help':
        'Adresse de destination à comparer — un nom du carnet d’adresses ou any.',
      'task.junos-srx-policy.field.application.label': 'Application',
      'task.junos-srx-policy.field.application.help':
        'Application à comparer, par ex. junos-https, junos-ssh, ou any.',
      'task.junos-srx-policy.field.action.label': 'Action',
      'task.junos-srx-policy.field.action.help':
        'Autoriser (permit), refuser silencieusement (deny) ou rejeter avec notification (reject) le trafic correspondant.',
      'task.junos-srx-policy.action.permit': 'Autoriser',
      'task.junos-srx-policy.action.deny': 'Refuser',
      'task.junos-srx-policy.action.reject': 'Rejeter',
    },
  },
};
