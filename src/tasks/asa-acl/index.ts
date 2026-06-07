/**
 * Curated task: Cisco ASA extended access list — multi-entry (issue #38).
 *
 * The ASA analog of the IOS `acl` task, built on the `list` field type (#20). On
 * ASA an access list is a flat series of `access-list <name> extended …` lines
 * (no named sub-block), and matches use a real subnet mask, not an IOS wildcard —
 * so this is its own firewall task family (`vendor: 'cisco-asa'`), not an overlay.
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the template uses no filters, so the preview is always `exact`.
 * The per-entry port match renders only for TCP/UDP, so an IP/ICMP rule never
 * shows an invalid `eq`. The `{{ '\n' }}` line terminators end each emitted line
 * on an *output* token so Ansible's trim_blocks keeps the break.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.asa-acl.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.asa-acl.field.name.label',
          help: 'task.asa-acl.field.name.help',
          required: true,
          placeholder: 'OUTSIDE-IN',
        },
        {
          type: 'list',
          name: 'entries',
          label: 'task.asa-acl.field.entries.label',
          help: 'task.asa-acl.field.entries.help',
          required: true,
          minRows: 1,
          addLabel: 'task.asa-acl.entries.add',
          removeLabel: 'task.asa-acl.entries.remove',
          itemLabel: 'task.asa-acl.entries.item',
          fields: [
            {
              type: 'select',
              name: 'action',
              label: 'task.asa-acl.field.action.label',
              help: 'task.asa-acl.field.action.help',
              default: 'permit',
              options: [
                { value: 'permit', label: 'task.asa-acl.action.permit' },
                { value: 'deny', label: 'task.asa-acl.action.deny' },
              ],
            },
            {
              type: 'select',
              name: 'protocol',
              label: 'task.asa-acl.field.protocol.label',
              help: 'task.asa-acl.field.protocol.help',
              default: 'ip',
              options: [
                { value: 'ip', label: 'task.asa-acl.protocol.ip' },
                { value: 'tcp', label: 'task.asa-acl.protocol.tcp' },
                { value: 'udp', label: 'task.asa-acl.protocol.udp' },
                { value: 'icmp', label: 'task.asa-acl.protocol.icmp' },
              ],
            },
            {
              type: 'text',
              name: 'source',
              label: 'task.asa-acl.field.source.label',
              help: 'task.asa-acl.field.source.help',
              required: true,
              placeholder: 'any',
            },
            {
              type: 'text',
              name: 'destination',
              label: 'task.asa-acl.field.destination.label',
              help: 'task.asa-acl.field.destination.help',
              required: true,
              placeholder: 'host 203.0.113.10',
            },
            {
              type: 'number',
              name: 'port',
              label: 'task.asa-acl.field.port.label',
              help: 'task.asa-acl.field.port.help',
              min: 1,
              max: 65535,
              omitWhenBlank: true,
            },
            {
              type: 'text',
              name: 'remark',
              label: 'task.asa-acl.field.remark.label',
              help: 'task.asa-acl.field.remark.help',
              placeholder: 'Allow HTTPS to web server',
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco ASA. Each ACE is a flat `access-list NAME extended …` line; an
// optional remark prints as its own `access-list NAME remark …` line just above.
const template =
  '{% for e in entries %}' +
  "{% if e.remark %}access-list {{ name }} remark {{ e.remark }}{{ '\\n' }}{% endif %}" +
  'access-list {{ name }} extended {{ e.action }} {{ e.protocol }} {{ e.source }} {{ e.destination }}' +
  "{% if e.port and (e.protocol == 'tcp' or e.protocol == 'udp') %} eq {{ e.port }}{% endif %}" +
  "{{ '\\n' }}{% endfor %}";

export const task: TaskModule = {
  definition: {
    slug: 'asa-acl',
    title: 'Cisco ASA access list (ACL)',
    description:
      'Generate Ansible group_vars and a Cisco ASA extended access list — one or more entries of action, protocol, source, destination, and an optional port — with a live device-CLI preview.',
    vendor: 'cisco-asa',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.asa-acl.legend': 'Access list',
      'task.asa-acl.field.name.label': 'ACL name',
      'task.asa-acl.field.name.help': 'Name shared by every entry, e.g. OUTSIDE-IN.',
      'task.asa-acl.field.entries.label': 'Entries',
      'task.asa-acl.field.entries.help': 'One or more access-list entries, applied in order.',
      'task.asa-acl.entries.add': 'Add entry',
      'task.asa-acl.entries.item': 'Entry {index}',
      'task.asa-acl.entries.remove': 'Remove entry {index}',
      'task.asa-acl.field.action.label': 'Action',
      'task.asa-acl.field.action.help': 'Permit or deny the matching traffic.',
      'task.asa-acl.field.protocol.label': 'Protocol',
      'task.asa-acl.field.protocol.help': 'IP matches all; TCP/UDP allow an optional port.',
      'task.asa-acl.field.source.label': 'Source',
      'task.asa-acl.field.source.help':
        'Source spec: any, host 203.0.113.10, or 10.0.0.0 255.255.255.0 (ASA uses a subnet mask, not a wildcard).',
      'task.asa-acl.field.destination.label': 'Destination',
      'task.asa-acl.field.destination.help':
        'Destination spec: any, host 203.0.113.10, or 10.0.0.0 255.255.255.0 (subnet mask, not a wildcard).',
      'task.asa-acl.field.port.label': 'Destination port',
      'task.asa-acl.field.port.help': 'Optional TCP/UDP port (e.g. 443). Ignored for IP/ICMP.',
      'task.asa-acl.field.remark.label': 'Remark',
      'task.asa-acl.field.remark.help': 'Optional remark line. Omitted from the vars when blank.',
      'task.asa-acl.action.permit': 'permit',
      'task.asa-acl.action.deny': 'deny',
      'task.asa-acl.protocol.ip': 'IP',
      'task.asa-acl.protocol.tcp': 'TCP',
      'task.asa-acl.protocol.udp': 'UDP',
      'task.asa-acl.protocol.icmp': 'ICMP',
    },
    fr: {
      'task.asa-acl.legend': 'Liste d’accès',
      'task.asa-acl.field.name.label': 'Nom de l’ACL',
      'task.asa-acl.field.name.help': 'Nom partagé par toutes les entrées, par ex. OUTSIDE-IN.',
      'task.asa-acl.field.entries.label': 'Entrées',
      'task.asa-acl.field.entries.help':
        'Une ou plusieurs entrées de liste d’accès, appliquées dans l’ordre.',
      'task.asa-acl.entries.add': 'Ajouter une entrée',
      'task.asa-acl.entries.item': 'Entrée {index}',
      'task.asa-acl.entries.remove': 'Supprimer l’entrée {index}',
      'task.asa-acl.field.action.label': 'Action',
      'task.asa-acl.field.action.help': 'Autoriser ou refuser le trafic correspondant.',
      'task.asa-acl.field.protocol.label': 'Protocole',
      'task.asa-acl.field.protocol.help':
        'IP correspond à tout ; TCP/UDP autorisent un port facultatif.',
      'task.asa-acl.field.source.label': 'Source',
      'task.asa-acl.field.source.help':
        'Spécification source : any, host 203.0.113.10 ou 10.0.0.0 255.255.255.0 (l’ASA utilise un masque de sous-réseau, pas un masque générique).',
      'task.asa-acl.field.destination.label': 'Destination',
      'task.asa-acl.field.destination.help':
        'Spécification destination : any, host 203.0.113.10 ou 10.0.0.0 255.255.255.0 (masque de sous-réseau, pas générique).',
      'task.asa-acl.field.port.label': 'Port de destination',
      'task.asa-acl.field.port.help': 'Port TCP/UDP facultatif (par ex. 443). Ignoré pour IP/ICMP.',
      'task.asa-acl.field.remark.label': 'Remarque',
      'task.asa-acl.field.remark.help':
        'Ligne de remarque facultative. Omise des variables si vide.',
      'task.asa-acl.action.permit': 'permit',
      'task.asa-acl.action.deny': 'deny',
      'task.asa-acl.protocol.ip': 'IP',
      'task.asa-acl.protocol.tcp': 'TCP',
      'task.asa-acl.protocol.udp': 'UDP',
      'task.asa-acl.protocol.icmp': 'ICMP',
    },
  },
};
