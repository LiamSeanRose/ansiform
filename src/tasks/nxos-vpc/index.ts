/**
 * Curated task: Cisco NX-OS vPC domain + peer-link (issue #74).
 *
 * A data-center foundation: the vPC domain (peer-keepalive, peer-gateway,
 * auto-recovery) and the peer-link port-channel that two Nexus switches use to
 * appear as one to downstream devices. Its own NX-OS task (`vendor:
 * 'cisco-nxos'`); standard, well-documented CLI, so it renders `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.nxos-vpc.legend',
      fields: [
        {
          type: 'number',
          name: 'domain_id',
          label: 'task.nxos-vpc.field.domain_id.label',
          help: 'task.nxos-vpc.field.domain_id.help',
          required: true,
          min: 1,
          max: 1000,
        },
        {
          type: 'text',
          name: 'peer_keepalive_dest',
          label: 'task.nxos-vpc.field.peer_keepalive_dest.label',
          help: 'task.nxos-vpc.field.peer_keepalive_dest.help',
          required: true,
          placeholder: '10.1.1.2',
        },
        {
          type: 'text',
          name: 'peer_keepalive_source',
          label: 'task.nxos-vpc.field.peer_keepalive_source.label',
          help: 'task.nxos-vpc.field.peer_keepalive_source.help',
          required: true,
          placeholder: '10.1.1.1',
        },
        {
          type: 'text',
          name: 'peer_keepalive_vrf',
          label: 'task.nxos-vpc.field.peer_keepalive_vrf.label',
          help: 'task.nxos-vpc.field.peer_keepalive_vrf.help',
          default: 'management',
          placeholder: 'management',
          omitWhenBlank: true,
        },
        {
          type: 'number',
          name: 'peer_link_po',
          label: 'task.nxos-vpc.field.peer_link_po.label',
          help: 'task.nxos-vpc.field.peer_link_po.help',
          required: true,
          min: 1,
          max: 4096,
        },
        {
          type: 'boolean',
          name: 'peer_gateway',
          label: 'task.nxos-vpc.field.peer_gateway.label',
          help: 'task.nxos-vpc.field.peer_gateway.help',
          default: true,
        },
        {
          type: 'boolean',
          name: 'auto_recovery',
          label: 'task.nxos-vpc.field.auto_recovery.label',
          help: 'task.nxos-vpc.field.auto_recovery.help',
          default: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco NX-OS. Enable the feature, build the domain, then mark the
// chosen port-channel as the peer-link. `{{ '\n' }}` output tokens terminate each
// line so the inline keepalive-VRF `{% endif %}` doesn't let trim_blocks swallow
// the following newline.
const template =
  "feature vpc{{ '\\n' }}" +
  "vpc domain {{ domain_id }}{{ '\\n' }}" +
  '  peer-keepalive destination {{ peer_keepalive_dest }} source {{ peer_keepalive_source }}' +
  "{% if peer_keepalive_vrf %} vrf {{ peer_keepalive_vrf }}{% endif %}{{ '\\n' }}" +
  "{% if peer_gateway %}  peer-gateway{{ '\\n' }}{% endif %}" +
  "{% if auto_recovery %}  auto-recovery{{ '\\n' }}{% endif %}" +
  "interface port-channel{{ peer_link_po }}{{ '\\n' }}" +
  '  vpc peer-link';

export const task: TaskModule = {
  definition: {
    slug: 'nxos-vpc',
    title: 'Cisco NX-OS vPC domain & peer-link',
    description:
      'Generate Ansible group_vars and a Cisco NX-OS vPC configuration — domain, peer-keepalive, peer-gateway, auto-recovery, and the peer-link port-channel — with a live device-CLI preview.',
    vendor: 'cisco-nxos',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'leaf-switches' },
  },
  messages: {
    en: {
      'task.nxos-vpc.legend': 'vPC domain',
      'task.nxos-vpc.field.domain_id.label': 'Domain ID',
      'task.nxos-vpc.field.domain_id.help': 'vPC domain number (1–1000), shared by both peers.',
      'task.nxos-vpc.field.peer_keepalive_dest.label': 'Peer-keepalive destination',
      'task.nxos-vpc.field.peer_keepalive_dest.help': 'The peer switch’s keepalive IP, e.g. 10.1.1.2.',
      'task.nxos-vpc.field.peer_keepalive_source.label': 'Peer-keepalive source',
      'task.nxos-vpc.field.peer_keepalive_source.help': 'This switch’s keepalive IP, e.g. 10.1.1.1.',
      'task.nxos-vpc.field.peer_keepalive_vrf.label': 'Keepalive VRF',
      'task.nxos-vpc.field.peer_keepalive_vrf.help':
        'VRF carrying the keepalive (usually management). Omitted when blank.',
      'task.nxos-vpc.field.peer_link_po.label': 'Peer-link port-channel',
      'task.nxos-vpc.field.peer_link_po.help':
        'Existing port-channel number to mark as the vPC peer-link, e.g. 1.',
      'task.nxos-vpc.field.peer_gateway.label': 'Peer-gateway',
      'task.nxos-vpc.field.peer_gateway.help':
        'Let each peer route for the other’s MAC — needed by some devices that send to the peer’s MAC.',
      'task.nxos-vpc.field.auto_recovery.label': 'Auto-recovery',
      'task.nxos-vpc.field.auto_recovery.help':
        'Bring vPCs up if the peer never returns after a dual reload.',
    },
    fr: {
      'task.nxos-vpc.legend': 'Domaine vPC',
      'task.nxos-vpc.field.domain_id.label': 'ID de domaine',
      'task.nxos-vpc.field.domain_id.help': 'Numéro de domaine vPC (1–1000), partagé par les deux pairs.',
      'task.nxos-vpc.field.peer_keepalive_dest.label': 'Destination du peer-keepalive',
      'task.nxos-vpc.field.peer_keepalive_dest.help': 'IP de keepalive du switch pair, par ex. 10.1.1.2.',
      'task.nxos-vpc.field.peer_keepalive_source.label': 'Source du peer-keepalive',
      'task.nxos-vpc.field.peer_keepalive_source.help': 'IP de keepalive de ce switch, par ex. 10.1.1.1.',
      'task.nxos-vpc.field.peer_keepalive_vrf.label': 'VRF du keepalive',
      'task.nxos-vpc.field.peer_keepalive_vrf.help':
        'VRF transportant le keepalive (généralement management). Omise si vide.',
      'task.nxos-vpc.field.peer_link_po.label': 'Port-channel du peer-link',
      'task.nxos-vpc.field.peer_link_po.help':
        'Numéro de port-channel existant à marquer comme peer-link vPC, par ex. 1.',
      'task.nxos-vpc.field.peer_gateway.label': 'Peer-gateway',
      'task.nxos-vpc.field.peer_gateway.help':
        'Laisse chaque pair router pour la MAC de l’autre — requis par certains équipements.',
      'task.nxos-vpc.field.auto_recovery.label': 'Auto-recovery',
      'task.nxos-vpc.field.auto_recovery.help':
        'Réactive les vPC si le pair ne revient jamais après un double redémarrage.',
    },
  },
};
