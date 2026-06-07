/**
 * Curated task: Cisco IOS OSPF — multi-network (issues #9, #25).
 *
 * A single OSPF process with an optional router-id and one or more `network …
 * area …` statements, built on the `list` field type (#20). Cloned from the
 * interface-ip reference (#6).
 *
 * Correctness (council §4): the YAML vars come straight from the field values and
 * are always correct. The template uses no filters, so the device-CLI preview is
 * always `exact`. Each network line ends on an output token, so Ansible's
 * trim_blocks keeps the per-line break.
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
        {
          type: 'list',
          name: 'networks',
          label: 'task.ospf.field.networks.label',
          help: 'task.ospf.field.networks.help',
          required: true,
          minRows: 1,
          addLabel: 'task.ospf.networks.add',
          removeLabel: 'task.ospf.networks.remove',
          itemLabel: 'task.ospf.networks.item',
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
    },
  ],
};

const template = [
  'router ospf {{ process_id }}',
  '{% if router_id %} router-id {{ router_id }}',
  '{% endif %}{% for n in networks %} network {{ n.network }} {{ n.wildcard }} area {{ n.area }}',
  '{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'ospf',
    title: 'Cisco IOS OSPF',
    description:
      'Generate Ansible host_vars and a Cisco IOS OSPF configuration — process ID, router ID, and one or more network/area statements — with a live device-CLI preview.',
    schema,
    template,
    templates: {
      // IOS-XE renders identical `router ospf` + `network … area` CLI (#27): an
      // explicit per-vendor claim, not an inference. (NX-OS advertises networks
      // per-interface rather than with `network` statements, so it is omitted
      // rather than rendered wrong.)
      'cisco-iosxe': template,
    },
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.ospf.legend.process': 'OSPF process',
      'task.ospf.field.process_id.label': 'Process ID',
      'task.ospf.field.process_id.help': 'OSPF process ID, local to the device (1–65535).',
      'task.ospf.field.router_id.label': 'Router ID',
      'task.ospf.field.router_id.help':
        'Optional OSPF router ID in IPv4 form, e.g. 1.1.1.1. Omitted from the vars when left blank.',
      'task.ospf.field.networks.label': 'Networks',
      'task.ospf.field.networks.help':
        'One or more networks to advertise; each is a network address, wildcard mask, and area.',
      'task.ospf.networks.add': 'Add network',
      'task.ospf.networks.item': 'Network {index}',
      'task.ospf.networks.remove': 'Remove network {index}',
      'task.ospf.field.network.label': 'Network',
      'task.ospf.field.network.help': 'Network address to advertise, e.g. 10.0.0.0.',
      'task.ospf.field.wildcard.label': 'Wildcard mask',
      'task.ospf.field.wildcard.help': 'Inverse (wildcard) mask, e.g. 0.0.0.255 for a /24.',
      'task.ospf.field.area.label': 'Area',
      'task.ospf.field.area.help': 'OSPF area number (0 is the backbone area).',
    },
    fr: {
      'task.ospf.legend.process': 'Processus OSPF',
      'task.ospf.field.process_id.label': 'ID de processus',
      'task.ospf.field.process_id.help': 'ID de processus OSPF, local à l’équipement (1–65535).',
      'task.ospf.field.router_id.label': 'Identifiant de routeur (Router ID)',
      'task.ospf.field.router_id.help':
        'Router ID OSPF facultatif au format IPv4, par ex. 1.1.1.1. Omis des variables si laissé vide.',
      'task.ospf.field.networks.label': 'Réseaux',
      'task.ospf.field.networks.help':
        'Un ou plusieurs réseaux à annoncer ; chacun avec adresse réseau, masque générique et aire.',
      'task.ospf.networks.add': 'Ajouter un réseau',
      'task.ospf.networks.item': 'Réseau {index}',
      'task.ospf.networks.remove': 'Supprimer le réseau {index}',
      'task.ospf.field.network.label': 'Réseau',
      'task.ospf.field.network.help': 'Adresse réseau à annoncer, par ex. 10.0.0.0.',
      'task.ospf.field.wildcard.label': 'Masque générique (wildcard)',
      'task.ospf.field.wildcard.help': 'Masque inverse (wildcard), par ex. 0.0.0.255 pour un /24.',
      'task.ospf.field.area.label': 'Aire',
      'task.ospf.field.area.help': 'Numéro d’aire OSPF (0 est l’aire de backbone).',
    },
  },
};
