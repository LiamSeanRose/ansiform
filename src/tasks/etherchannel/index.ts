/**
 * Curated task: EtherChannel / port-channel (issue #58).
 *
 * Bundle physical interfaces into a logical Port-channel: a `interface
 * Port-channel<n>` plus each member's `channel-group <n> mode active|passive|on`
 * (active/passive = LACP, on = static). Built on the `list` field type (#20).
 *
 * Multi-vendor (council §3, #27): IOS-XE renders the IOS CLI verbatim (an exact
 * per-vendor claim). NX-OS and EOS share the per-member `channel-group … mode`
 * line but differ in the port-channel interface (NX-OS `interface port-channel`,
 * lowercase, and needs `feature lacp` for LACP modes; EOS `interface
 * Port-Channel`), so they ship as authored overlays flagged `approximate` — not
 * device-verified, so the preview degrades visibly rather than claim exact.
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; templates use no filters. The member lines end on content
 * before each block tag so Ansible's trim_blocks keeps the breaks.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.etherchannel.legend',
      fields: [
        {
          type: 'number',
          name: 'channel_id',
          label: 'task.etherchannel.field.channel_id.label',
          help: 'task.etherchannel.field.channel_id.help',
          required: true,
          min: 1,
          max: 4096,
        },
        {
          type: 'text',
          name: 'description',
          label: 'task.etherchannel.field.description.label',
          help: 'task.etherchannel.field.description.help',
          placeholder: 'Uplink bundle to core',
          omitWhenBlank: true,
        },
        {
          type: 'select',
          name: 'mode',
          label: 'task.etherchannel.field.mode.label',
          help: 'task.etherchannel.field.mode.help',
          default: 'active',
          options: [
            { value: 'active', label: 'task.etherchannel.mode.active' },
            { value: 'passive', label: 'task.etherchannel.mode.passive' },
            { value: 'on', label: 'task.etherchannel.mode.on' },
          ],
        },
        {
          type: 'list',
          name: 'members',
          label: 'task.etherchannel.field.members.label',
          help: 'task.etherchannel.field.members.help',
          required: true,
          minRows: 1,
          addLabel: 'task.etherchannel.members.add',
          removeLabel: 'task.etherchannel.members.remove',
          itemLabel: 'task.etherchannel.members.item',
          fields: [
            {
              type: 'text',
              name: 'interface',
              label: 'task.etherchannel.field.interface.label',
              help: 'task.etherchannel.field.interface.help',
              required: true,
              placeholder: 'GigabitEthernet0/1',
              format: 'ifname',
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. The Port-channel interface, then each member with its
// channel-group line. IOS-XE renders this verbatim.
const template = [
  'interface Port-channel{{ channel_id }}',
  '{% if description %} description {{ description }}',
  '{% endif %}{% for m in members %}interface {{ m.interface }}',
  ' channel-group {{ channel_id }} mode {{ mode }}',
  '{% endfor %}',
].join('\n');

// NX-OS: lowercase `interface port-channel`, and LACP modes need `feature lacp`
// first (static `on` does not). Authored from Cisco's Nexus interfaces guide;
// shipped approximate (not device-verified).
const templateNxos = [
  "{% if mode != 'on' %}feature lacp",
  '{% endif %}interface port-channel{{ channel_id }}',
  '{% if description %} description {{ description }}',
  '{% endif %}{% for m in members %}interface {{ m.interface }}',
  ' channel-group {{ channel_id }} mode {{ mode }}',
  '{% endfor %}',
].join('\n');

// Arista EOS: `interface Port-Channel` (capitalised); the per-member channel-group
// line matches IOS and no feature toggle is needed. Authored from Arista's
// Port-Channels & LACP manual; shipped approximate (not device-verified).
const templateEos = [
  'interface Port-Channel{{ channel_id }}',
  '{% if description %} description {{ description }}',
  '{% endif %}{% for m in members %}interface {{ m.interface }}',
  ' channel-group {{ channel_id }} mode {{ mode }}',
  '{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'etherchannel',
    title: 'EtherChannel / port-channel',
    description:
      'Generate Ansible host_vars and an EtherChannel (port-channel) configuration — the logical channel, its mode (LACP active/passive or static on), and member interfaces — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE renders the IOS CLI verbatim (exact). NX-OS/EOS diverge on the
    // port-channel interface line and ship approximate so the preview degrades.
    templates: {
      'cisco-iosxe': template,
      'cisco-nxos': { template: templateNxos, fidelity: 'approximate' },
      'arista-eos': { template: templateEos, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'host', name: 'switch1' },
  },
  messages: {
    en: {
      'task.etherchannel.legend': 'EtherChannel',
      'task.etherchannel.field.channel_id.label': 'Channel number',
      'task.etherchannel.field.channel_id.help': 'Port-channel number, e.g. 10.',
      'task.etherchannel.field.description.label': 'Description',
      'task.etherchannel.field.description.help':
        'Optional description for the port-channel. Omitted from the vars when blank.',
      'task.etherchannel.field.mode.label': 'Mode',
      'task.etherchannel.field.mode.help':
        'active/passive negotiate with LACP; on is a static bundle (no LACP).',
      'task.etherchannel.field.members.label': 'Member interfaces',
      'task.etherchannel.field.members.help': 'One or more physical interfaces to bundle.',
      'task.etherchannel.members.add': 'Add member',
      'task.etherchannel.members.item': 'Member {index}',
      'task.etherchannel.members.remove': 'Remove member {index}',
      'task.etherchannel.field.interface.label': 'Interface',
      'task.etherchannel.field.interface.help': 'Member interface, e.g. GigabitEthernet0/1.',
      'task.etherchannel.mode.active': 'active (LACP)',
      'task.etherchannel.mode.passive': 'passive (LACP)',
      'task.etherchannel.mode.on': 'on (static)',
    },
    fr: {
      'task.etherchannel.legend': 'EtherChannel',
      'task.etherchannel.field.channel_id.label': 'Numéro de canal',
      'task.etherchannel.field.channel_id.help': 'Numéro du port-channel, par ex. 10.',
      'task.etherchannel.field.description.label': 'Description',
      'task.etherchannel.field.description.help':
        'Description facultative du port-channel. Omise des variables si vide.',
      'task.etherchannel.field.mode.label': 'Mode',
      'task.etherchannel.field.mode.help':
        'active/passive négocient via LACP ; on est un agrégat statique (sans LACP).',
      'task.etherchannel.field.members.label': 'Interfaces membres',
      'task.etherchannel.field.members.help': 'Une ou plusieurs interfaces physiques à agréger.',
      'task.etherchannel.members.add': 'Ajouter un membre',
      'task.etherchannel.members.item': 'Membre {index}',
      'task.etherchannel.members.remove': 'Supprimer le membre {index}',
      'task.etherchannel.field.interface.label': 'Interface',
      'task.etherchannel.field.interface.help': 'Interface membre, par ex. GigabitEthernet0/1.',
      'task.etherchannel.mode.active': 'active (LACP)',
      'task.etherchannel.mode.passive': 'passive (LACP)',
      'task.etherchannel.mode.on': 'on (statique)',
    },
  },
};
