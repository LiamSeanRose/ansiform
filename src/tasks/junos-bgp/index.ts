/**
 * Curated task: Juniper Junos BGP group (issue #53).
 *
 * Native Junos task (flat `set …` form, #36/#39). Junos BGP is organised into
 * groups: a group carries the session `type`, the `peer-as`, and one or more
 * neighbours that inherit it. The local AS lives under routing-options. The
 * neighbour list uses the `list` field type (#20).
 *
 * Honesty (#39): the YAML vars are always correct; the preview is authored from
 * public Junos syntax and not device-verified, so the task declares
 * `fidelityFloor: 'approximate'`. No filters → renders exact before the floor
 * clamps it.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.junos-bgp.legend',
      fields: [
        {
          type: 'number',
          name: 'local_as',
          label: 'task.junos-bgp.field.local_as.label',
          help: 'task.junos-bgp.field.local_as.help',
          required: true,
          min: 1,
          max: 4294967295,
        },
        {
          type: 'text',
          name: 'group_name',
          label: 'task.junos-bgp.field.group_name.label',
          help: 'task.junos-bgp.field.group_name.help',
          required: true,
          placeholder: 'EXTERNAL-PEERS',
        },
        {
          type: 'select',
          name: 'type',
          label: 'task.junos-bgp.field.type.label',
          help: 'task.junos-bgp.field.type.help',
          default: 'external',
          options: [
            { value: 'external', label: 'task.junos-bgp.type.external' },
            { value: 'internal', label: 'task.junos-bgp.type.internal' },
          ],
        },
        {
          type: 'number',
          name: 'peer_as',
          label: 'task.junos-bgp.field.peer_as.label',
          help: 'task.junos-bgp.field.peer_as.help',
          required: true,
          min: 1,
          max: 4294967295,
        },
        {
          type: 'list',
          name: 'neighbors',
          label: 'task.junos-bgp.field.neighbors.label',
          help: 'task.junos-bgp.field.neighbors.help',
          required: true,
          minRows: 1,
          addLabel: 'task.junos-bgp.neighbors.add',
          removeLabel: 'task.junos-bgp.neighbors.remove',
          itemLabel: 'task.junos-bgp.neighbors.item',
          fields: [
            {
              type: 'text',
              name: 'peer',
              label: 'task.junos-bgp.field.peer.label',
              help: 'task.junos-bgp.field.peer.help',
              required: true,
              placeholder: '203.0.113.1',
              format: 'ipv4',
            },
          ],
        },
        {
          type: 'text',
          name: 'local_address',
          label: 'task.junos-bgp.field.local_address.label',
          help: 'task.junos-bgp.field.local_address.help',
          placeholder: '203.0.113.2',
          format: 'ipv4',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'export_policy',
          label: 'task.junos-bgp.field.export_policy.label',
          help: 'task.junos-bgp.field.export_policy.help',
          placeholder: 'ADVERTISE-DEFAULT',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Junos `set` form. The local AS, then the group's type / peer-as /
// optional local-address + export policy, then one neighbour line per row.
const template =
  "set routing-options autonomous-system {{ local_as }}{{ '\\n' }}" +
  "set protocols bgp group {{ group_name }} type {{ type }}{{ '\\n' }}" +
  "set protocols bgp group {{ group_name }} peer-as {{ peer_as }}{{ '\\n' }}" +
  '{% if local_address %}' +
  "set protocols bgp group {{ group_name }} local-address {{ local_address }}{{ '\\n' }}" +
  '{% endif %}' +
  '{% if export_policy %}' +
  "set protocols bgp group {{ group_name }} export {{ export_policy }}{{ '\\n' }}" +
  '{% endif %}' +
  '{% for n in neighbors %}' +
  "set protocols bgp group {{ group_name }} neighbor {{ n.peer }}{{ '\\n' }}" +
  '{% endfor %}';

export const task: TaskModule = {
  definition: {
    slug: 'junos-bgp',
    title: 'Juniper Junos BGP group',
    description:
      'Generate Ansible group_vars and a Juniper Junos BGP group — local AS, session type, peer AS, neighbours, and an optional local address and export policy — with an approximate device-config preview.',
    vendor: 'juniper-junos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.junos-bgp.legend': 'BGP group',
      'task.junos-bgp.field.local_as.label': 'Local AS',
      'task.junos-bgp.field.local_as.help':
        'This router’s autonomous-system number, set under routing-options.',
      'task.junos-bgp.field.group_name.label': 'Group name',
      'task.junos-bgp.field.group_name.help': 'BGP group name, e.g. EXTERNAL-PEERS.',
      'task.junos-bgp.field.type.label': 'Session type',
      'task.junos-bgp.field.type.help':
        'external (eBGP — peer AS differs) or internal (iBGP — peer AS equals the local AS).',
      'task.junos-bgp.type.external': 'External (eBGP)',
      'task.junos-bgp.type.internal': 'Internal (iBGP)',
      'task.junos-bgp.field.peer_as.label': 'Peer AS',
      'task.junos-bgp.field.peer_as.help': 'Remote autonomous-system number for every neighbour in the group.',
      'task.junos-bgp.field.neighbors.label': 'Neighbours',
      'task.junos-bgp.field.neighbors.help': 'One or more peer addresses in this group.',
      'task.junos-bgp.neighbors.add': 'Add neighbour',
      'task.junos-bgp.neighbors.item': 'Neighbour {index}',
      'task.junos-bgp.neighbors.remove': 'Remove neighbour {index}',
      'task.junos-bgp.field.peer.label': 'Peer address',
      'task.junos-bgp.field.peer.help': 'Neighbour IP address, e.g. 203.0.113.1.',
      'task.junos-bgp.field.local_address.label': 'Local address',
      'task.junos-bgp.field.local_address.help':
        'Optional source address for the sessions. Omitted from the vars when blank.',
      'task.junos-bgp.field.export_policy.label': 'Export policy',
      'task.junos-bgp.field.export_policy.help':
        'Optional policy-statement name applied on export. Omitted when blank.',
    },
    fr: {
      'task.junos-bgp.legend': 'Groupe BGP',
      'task.junos-bgp.field.local_as.label': 'AS local',
      'task.junos-bgp.field.local_as.help':
        'Numéro d’autonomous-system de ce routeur, défini sous routing-options.',
      'task.junos-bgp.field.group_name.label': 'Nom du groupe',
      'task.junos-bgp.field.group_name.help': 'Nom du groupe BGP, par ex. EXTERNAL-PEERS.',
      'task.junos-bgp.field.type.label': 'Type de session',
      'task.junos-bgp.field.type.help':
        'external (eBGP — l’AS pair diffère) ou internal (iBGP — l’AS pair égale l’AS local).',
      'task.junos-bgp.type.external': 'Externe (eBGP)',
      'task.junos-bgp.type.internal': 'Interne (iBGP)',
      'task.junos-bgp.field.peer_as.label': 'AS pair',
      'task.junos-bgp.field.peer_as.help':
        'Numéro d’autonomous-system distant pour chaque voisin du groupe.',
      'task.junos-bgp.field.neighbors.label': 'Voisins',
      'task.junos-bgp.field.neighbors.help': 'Une ou plusieurs adresses de pairs dans ce groupe.',
      'task.junos-bgp.neighbors.add': 'Ajouter un voisin',
      'task.junos-bgp.neighbors.item': 'Voisin {index}',
      'task.junos-bgp.neighbors.remove': 'Supprimer le voisin {index}',
      'task.junos-bgp.field.peer.label': 'Adresse du pair',
      'task.junos-bgp.field.peer.help': 'Adresse IP du voisin, par ex. 203.0.113.1.',
      'task.junos-bgp.field.local_address.label': 'Adresse locale',
      'task.junos-bgp.field.local_address.help':
        'Adresse source facultative pour les sessions. Omise des variables si vide.',
      'task.junos-bgp.field.export_policy.label': 'Politique d’export',
      'task.junos-bgp.field.export_policy.help':
        'Nom de policy-statement facultatif appliqué à l’export. Omis si vide.',
    },
  },
};
