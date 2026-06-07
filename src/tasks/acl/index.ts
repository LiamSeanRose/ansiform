/**
 * Curated task: Cisco IOS extended access list — multi-entry (issues #10, #25).
 *
 * A named extended ACL with one or more entries (ACEs), built on the `list`
 * field type (#20). Cloned from the interface-ip reference (#6).
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the template uses no filters, so the preview is always `exact`.
 * The per-entry port match renders only for TCP/UDP, so an IP/ICMP rule never
 * shows an invalid `eq`. The `{{ '' }}` after the port `{% endif %}` is a newline
 * guard: it ends the ACE line on an *output* token so Ansible's trim_blocks
 * (which strips a newline right after a block tag) keeps the line break.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.acl.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.acl.field.name.label',
          help: 'task.acl.field.name.help',
          required: true,
          placeholder: 'MGMT-IN',
        },
        {
          type: 'list',
          name: 'entries',
          label: 'task.acl.field.entries.label',
          help: 'task.acl.field.entries.help',
          required: true,
          minRows: 1,
          addLabel: 'task.acl.entries.add',
          removeLabel: 'task.acl.entries.remove',
          itemLabel: 'task.acl.entries.item',
          fields: [
            {
              type: 'select',
              name: 'action',
              label: 'task.acl.field.action.label',
              help: 'task.acl.field.action.help',
              default: 'permit',
              options: [
                { value: 'permit', label: 'task.acl.action.permit' },
                { value: 'deny', label: 'task.acl.action.deny' },
              ],
            },
            {
              type: 'select',
              name: 'protocol',
              label: 'task.acl.field.protocol.label',
              help: 'task.acl.field.protocol.help',
              default: 'ip',
              options: [
                { value: 'ip', label: 'task.acl.protocol.ip' },
                { value: 'tcp', label: 'task.acl.protocol.tcp' },
                { value: 'udp', label: 'task.acl.protocol.udp' },
                { value: 'icmp', label: 'task.acl.protocol.icmp' },
              ],
            },
            {
              type: 'text',
              name: 'source',
              label: 'task.acl.field.source.label',
              help: 'task.acl.field.source.help',
              required: true,
              placeholder: '10.0.0.0 0.0.0.255',
            },
            {
              type: 'text',
              name: 'destination',
              label: 'task.acl.field.destination.label',
              help: 'task.acl.field.destination.help',
              required: true,
              placeholder: 'any',
            },
            {
              type: 'number',
              name: 'port',
              label: 'task.acl.field.port.label',
              help: 'task.acl.field.port.help',
              min: 1,
              max: 65535,
              omitWhenBlank: true,
            },
            {
              type: 'text',
              name: 'remark',
              label: 'task.acl.field.remark.label',
              help: 'task.acl.field.remark.help',
              placeholder: 'Allow SSH from management',
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

const template = [
  'ip access-list extended {{ name }}',
  '{% for e in entries %}{% if e.remark %} remark {{ e.remark }}',
  "{% endif %} {{ e.action }} {{ e.protocol }} {{ e.source }} {{ e.destination }}" +
    "{% if e.port and (e.protocol == 'tcp' or e.protocol == 'udp') %} eq {{ e.port }}{% endif %}{{ '' }}",
  '{% endfor %}',
].join('\n');

// NX-OS and Arista EOS name an extended ACL without the `extended` keyword
// (`ip access-list NAME`); the per-entry body is identical. This has not had a
// curated-correctness pass, so it ships `approximate` and the preview shows the
// degrade banner — an un-vetted vendor render is never mistaken for ground truth.
const namedAclTemplate = [
  'ip access-list {{ name }}',
  '{% for e in entries %}{% if e.remark %} remark {{ e.remark }}',
  "{% endif %} {{ e.action }} {{ e.protocol }} {{ e.source }} {{ e.destination }}" +
    "{% if e.port and (e.protocol == 'tcp' or e.protocol == 'udp') %} eq {{ e.port }}{% endif %}{{ '' }}",
  '{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'acl',
    title: 'Cisco IOS access list (ACL)',
    description:
      'Generate Ansible group_vars and a Cisco IOS extended access list — one or more entries of action, protocol, source, destination, and an optional port — with a live device-CLI preview.',
    schema,
    template,
    templates: {
      // IOS-XE renders an identical extended-ACL CLI (#27): an explicit per-vendor
      // claim, not an inference — same schema, same vars, only the label changes.
      'cisco-iosxe': template,
      'cisco-nxos': { template: namedAclTemplate, fidelity: 'approximate' },
      'arista-eos': { template: namedAclTemplate, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.acl.legend': 'Access list',
      'task.acl.field.name.label': 'ACL name',
      'task.acl.field.name.help': 'Name of the extended access list, e.g. MGMT-IN.',
      'task.acl.field.entries.label': 'Entries',
      'task.acl.field.entries.help': 'One or more access-list entries, applied in order.',
      'task.acl.entries.add': 'Add entry',
      'task.acl.entries.item': 'Entry {index}',
      'task.acl.entries.remove': 'Remove entry {index}',
      'task.acl.field.action.label': 'Action',
      'task.acl.field.action.help': 'Permit or deny the matching traffic.',
      'task.acl.field.protocol.label': 'Protocol',
      'task.acl.field.protocol.help': 'IP matches all; TCP/UDP allow an optional port.',
      'task.acl.field.source.label': 'Source',
      'task.acl.field.source.help': 'Source spec: any, host 10.0.0.1, or 10.0.0.0 0.0.0.255.',
      'task.acl.field.destination.label': 'Destination',
      'task.acl.field.destination.help':
        'Destination spec: any, host 10.0.0.1, or 10.0.0.0 0.0.0.255.',
      'task.acl.field.port.label': 'Destination port',
      'task.acl.field.port.help': 'Optional TCP/UDP port (e.g. 22). Ignored for IP/ICMP.',
      'task.acl.field.remark.label': 'Remark',
      'task.acl.field.remark.help': 'Optional remark line. Omitted from the vars when blank.',
      'task.acl.action.permit': 'permit',
      'task.acl.action.deny': 'deny',
      'task.acl.protocol.ip': 'IP',
      'task.acl.protocol.tcp': 'TCP',
      'task.acl.protocol.udp': 'UDP',
      'task.acl.protocol.icmp': 'ICMP',
    },
    fr: {
      'task.acl.legend': 'Liste d’accès',
      'task.acl.field.name.label': 'Nom de l’ACL',
      'task.acl.field.name.help': 'Nom de la liste d’accès étendue, par ex. MGMT-IN.',
      'task.acl.field.entries.label': 'Entrées',
      'task.acl.field.entries.help': 'Une ou plusieurs entrées de liste d’accès, appliquées dans l’ordre.',
      'task.acl.entries.add': 'Ajouter une entrée',
      'task.acl.entries.item': 'Entrée {index}',
      'task.acl.entries.remove': 'Supprimer l’entrée {index}',
      'task.acl.field.action.label': 'Action',
      'task.acl.field.action.help': 'Autoriser ou refuser le trafic correspondant.',
      'task.acl.field.protocol.label': 'Protocole',
      'task.acl.field.protocol.help':
        'IP correspond à tout ; TCP/UDP autorisent un port facultatif.',
      'task.acl.field.source.label': 'Source',
      'task.acl.field.source.help':
        'Spécification source : any, host 10.0.0.1 ou 10.0.0.0 0.0.0.255.',
      'task.acl.field.destination.label': 'Destination',
      'task.acl.field.destination.help':
        'Spécification destination : any, host 10.0.0.1 ou 10.0.0.0 0.0.0.255.',
      'task.acl.field.port.label': 'Port de destination',
      'task.acl.field.port.help': 'Port TCP/UDP facultatif (par ex. 22). Ignoré pour IP/ICMP.',
      'task.acl.field.remark.label': 'Remarque',
      'task.acl.field.remark.help': 'Ligne de remarque facultative. Omise des variables si vide.',
      'task.acl.action.permit': 'permit',
      'task.acl.action.deny': 'deny',
      'task.acl.protocol.ip': 'IP',
      'task.acl.protocol.tcp': 'TCP',
      'task.acl.protocol.udp': 'UDP',
      'task.acl.protocol.icmp': 'ICMP',
    },
  },
};
