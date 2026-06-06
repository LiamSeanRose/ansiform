/**
 * Curated task: Cisco IOS access list — single entry, v1 (issue #10).
 *
 * Cloned from the interface-ip reference (#6). ACLs are inherently list-shaped,
 * but `FormSchema` has only scalar field types and adding a `list` type would
 * unfreeze the core contracts (#1) mid-wave. Per the #18 design-review decision
 * this is the **single-entry v1 cut**: one extended-ACL entry built from scalar
 * fields — correct-by-construction, byte-correct YAML, and an exact preview
 * (no filters). Multi-entry waits on a future `list` field-type issue.
 *
 * The port match only renders for TCP/UDP, so the preview can never show an
 * invalid `eq` on an IP/ICMP rule (the YAML still carries whatever was entered —
 * the vars are always correct; the playbook template decides how to use them).
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
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline after each `{% endif %}` is swallowed, so the optional remark line
// leaves no gap. The port match renders inline and only for TCP/UDP.
const template = [
  'ip access-list extended {{ name }}',
  '{% if remark %} remark {{ remark }}',
  '{% endif %} {{ action }} {{ protocol }} {{ source }} {{ destination }}' +
    "{% if port and (protocol == 'tcp' or protocol == 'udp') %} eq {{ port }}{% endif %}",
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'acl',
    title: 'Cisco IOS access list (ACL)',
    description:
      'Generate Ansible group_vars and a Cisco IOS extended access-list entry — action, protocol, source, destination, and an optional port — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.acl.legend': 'Access list entry',
      'task.acl.field.name.label': 'ACL name',
      'task.acl.field.name.help': 'Name of the extended access list, e.g. MGMT-IN.',
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
      'task.acl.legend': 'Entrée de liste d’accès',
      'task.acl.field.name.label': 'Nom de l’ACL',
      'task.acl.field.name.help': 'Nom de la liste d’accès étendue, par ex. MGMT-IN.',
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
