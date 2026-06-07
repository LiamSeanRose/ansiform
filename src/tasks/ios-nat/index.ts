/**
 * Curated task: Cisco IOS NAT — static + PAT (issue #61).
 *
 * Designate the inside/outside interface roles, then add 1:1 static mappings
 * (`ip nat inside source static <local> <global>`) and/or interface PAT/overload
 * (`ip nat inside source list <acl> interface <outside> overload`). Static
 * mappings use the `list` field type (#20); PAT is driven by the presence of an
 * ACL, so no separate enable toggle.
 *
 * Multi-vendor (council §3, #27): IOS-XE renders the IOS CLI verbatim (exact).
 * NX-OS uses the same `ip nat inside`/`outside` roles and `ip nat inside source
 * static`, but gates NAT behind `feature nat` (and its dynamic/overload form is
 * not fully line-verified here), so it ships as an authored overlay flagged
 * `approximate`. Arista EOS is deliberately NOT overlaid: its NAT is a different
 * model (`ip nat source dynamic … pool … overload`, no inside/outside roles), so
 * it would not map — omitted rather than rendered wrong.
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; templates use no filters. Optional static rows and the PAT line
 * end on content before each block tag so trim_blocks keeps the breaks.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.ios-nat.legend',
      fields: [
        {
          type: 'text',
          name: 'inside_interface',
          label: 'task.ios-nat.field.inside_interface.label',
          help: 'task.ios-nat.field.inside_interface.help',
          required: true,
          placeholder: 'GigabitEthernet0/1',
          format: 'ifname',
        },
        {
          type: 'text',
          name: 'outside_interface',
          label: 'task.ios-nat.field.outside_interface.label',
          help: 'task.ios-nat.field.outside_interface.help',
          required: true,
          placeholder: 'GigabitEthernet0/0',
          format: 'ifname',
        },
        {
          type: 'text',
          name: 'pat_acl',
          label: 'task.ios-nat.field.pat_acl.label',
          help: 'task.ios-nat.field.pat_acl.help',
          placeholder: '1',
          omitWhenBlank: true,
        },
        {
          type: 'list',
          name: 'static_mappings',
          label: 'task.ios-nat.field.static_mappings.label',
          help: 'task.ios-nat.field.static_mappings.help',
          addLabel: 'task.ios-nat.static.add',
          removeLabel: 'task.ios-nat.static.remove',
          itemLabel: 'task.ios-nat.static.item',
          fields: [
            {
              type: 'text',
              name: 'local_ip',
              label: 'task.ios-nat.field.local_ip.label',
              help: 'task.ios-nat.field.local_ip.help',
              required: true,
              placeholder: '10.0.0.10',
              format: 'ipv4',
            },
            {
              type: 'text',
              name: 'global_ip',
              label: 'task.ios-nat.field.global_ip.label',
              help: 'task.ios-nat.field.global_ip.help',
              required: true,
              placeholder: '203.0.113.10',
              format: 'ipv4',
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Interface roles, then any static mappings, then the PAT
// (overload) line when an ACL is given. IOS-XE renders this verbatim.
const template = [
  'interface {{ inside_interface }}',
  ' ip nat inside',
  'interface {{ outside_interface }}',
  ' ip nat outside',
  '{% for s in static_mappings %}ip nat inside source static {{ s.local_ip }} {{ s.global_ip }}',
  '{% endfor %}{% if pat_acl %}ip nat inside source list {{ pat_acl }} interface {{ outside_interface }} overload',
  '{% endif %}',
].join('\n');

// NX-OS: same inside/outside roles and `ip nat inside source static`, but NAT is
// gated behind `feature nat`. Authored from Cisco's Nexus NAT guide; shipped
// approximate (the interface-overload PAT form is not device-verified here).
const templateNxos = [
  'feature nat',
  'interface {{ inside_interface }}',
  ' ip nat inside',
  'interface {{ outside_interface }}',
  ' ip nat outside',
  '{% for s in static_mappings %}ip nat inside source static {{ s.local_ip }} {{ s.global_ip }}',
  '{% endfor %}{% if pat_acl %}ip nat inside source list {{ pat_acl }} interface {{ outside_interface }} overload',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'ios-nat',
    title: 'Cisco IOS NAT (static & PAT)',
    description:
      'Generate Ansible host_vars and a Cisco IOS NAT configuration — inside/outside interface roles, 1:1 static mappings, and interface PAT/overload — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE renders the IOS NAT CLI verbatim (exact). NX-OS needs `feature nat`
    // and ships approximate; EOS uses a different NAT model and is not offered.
    templates: {
      'cisco-iosxe': template,
      'cisco-nxos': { template: templateNxos, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.ios-nat.legend': 'NAT',
      'task.ios-nat.field.inside_interface.label': 'Inside interface',
      'task.ios-nat.field.inside_interface.help':
        'Interface facing the private network (ip nat inside), e.g. GigabitEthernet0/1.',
      'task.ios-nat.field.outside_interface.label': 'Outside interface',
      'task.ios-nat.field.outside_interface.help':
        'Interface facing the public network (ip nat outside), e.g. GigabitEthernet0/0.',
      'task.ios-nat.field.pat_acl.label': 'PAT ACL (overload)',
      'task.ios-nat.field.pat_acl.help':
        'ACL of inside addresses to overload onto the outside interface. Leave blank for no PAT.',
      'task.ios-nat.field.static_mappings.label': 'Static mappings',
      'task.ios-nat.field.static_mappings.help':
        'Optional 1:1 static NAT entries (inside local → inside global).',
      'task.ios-nat.static.add': 'Add static mapping',
      'task.ios-nat.static.item': 'Mapping {index}',
      'task.ios-nat.static.remove': 'Remove mapping {index}',
      'task.ios-nat.field.local_ip.label': 'Inside local',
      'task.ios-nat.field.local_ip.help': 'Private address on the inside, e.g. 10.0.0.10.',
      'task.ios-nat.field.global_ip.label': 'Inside global',
      'task.ios-nat.field.global_ip.help': 'Public address it maps to, e.g. 203.0.113.10.',
    },
    fr: {
      'task.ios-nat.legend': 'NAT',
      'task.ios-nat.field.inside_interface.label': 'Interface interne',
      'task.ios-nat.field.inside_interface.help':
        'Interface côté réseau privé (ip nat inside), par ex. GigabitEthernet0/1.',
      'task.ios-nat.field.outside_interface.label': 'Interface externe',
      'task.ios-nat.field.outside_interface.help':
        'Interface côté réseau public (ip nat outside), par ex. GigabitEthernet0/0.',
      'task.ios-nat.field.pat_acl.label': 'ACL PAT (overload)',
      'task.ios-nat.field.pat_acl.help':
        'ACL des adresses internes à surcharger sur l’interface externe. Laisser vide pour ne pas activer le PAT.',
      'task.ios-nat.field.static_mappings.label': 'Mappages statiques',
      'task.ios-nat.field.static_mappings.help':
        'Entrées NAT statiques 1:1 facultatives (interne local → interne global).',
      'task.ios-nat.static.add': 'Ajouter un mappage statique',
      'task.ios-nat.static.item': 'Mappage {index}',
      'task.ios-nat.static.remove': 'Supprimer le mappage {index}',
      'task.ios-nat.field.local_ip.label': 'Interne local',
      'task.ios-nat.field.local_ip.help': 'Adresse privée interne, par ex. 10.0.0.10.',
      'task.ios-nat.field.global_ip.label': 'Interne global',
      'task.ios-nat.field.global_ip.help': 'Adresse publique correspondante, par ex. 203.0.113.10.',
    },
  },
};
