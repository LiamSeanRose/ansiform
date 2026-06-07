/**
 * Curated task: Cisco IOS interface ranges (issue #22).
 *
 * A list-shaped task on the #20 `list` field type: a repeating table of
 * `interface range` blocks, each applying a description, switchport mode,
 * optional access VLAN, and admin state to a contiguous range of ports.
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — the ranges become a YAML sequence of per-row mappings
 * with omit-on-blank inside each row. No filters, so the preview is `exact`.
 * Optional sub-lines carry their newline inside the `{% if %}`, so an unset
 * option leaves no gap.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.interface-ranges.legend',
      fields: [
        {
          type: 'list',
          name: 'ranges',
          label: 'task.interface-ranges.field.ranges.label',
          help: 'task.interface-ranges.field.ranges.help',
          minRows: 1,
          addLabel: 'task.interface-ranges.field.ranges.add',
          itemLabel: 'task.interface-ranges.field.ranges.item',
          fields: [
            {
              type: 'text',
              name: 'range',
              label: 'task.interface-ranges.field.ranges.range.label',
              help: 'task.interface-ranges.field.ranges.range.help',
              required: true,
              placeholder: 'GigabitEthernet1/0/1 - 12',
            },
            {
              type: 'text',
              name: 'description',
              label: 'task.interface-ranges.field.ranges.description.label',
              help: 'task.interface-ranges.field.ranges.description.help',
              placeholder: 'Access ports',
              omitWhenBlank: true,
            },
            {
              type: 'select',
              name: 'mode',
              label: 'task.interface-ranges.field.ranges.mode.label',
              help: 'task.interface-ranges.field.ranges.mode.help',
              default: 'access',
              options: [
                { value: 'access', label: 'task.interface-ranges.mode.access' },
                { value: 'trunk', label: 'task.interface-ranges.mode.trunk' },
              ],
            },
            {
              type: 'number',
              name: 'access_vlan',
              label: 'task.interface-ranges.field.ranges.access_vlan.label',
              help: 'task.interface-ranges.field.ranges.access_vlan.help',
              min: 1,
              max: 4094,
              omitWhenBlank: true,
            },
            {
              type: 'boolean',
              name: 'enabled',
              label: 'task.interface-ranges.field.ranges.enabled.label',
              help: 'task.interface-ranges.field.ranges.enabled.help',
              default: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// range header line is followed by a literal newline that sits before the first
// block tag (always kept); each optional sub-line carries its newline inside its
// `{% if %}`. The admin-state line uses `{% else %}` so it is always present.
const template = [
  '{% for r in ranges %}interface range {{ r.range }}',
  '{% if r.description %} description {{ r.description }}',
  '{% endif %} switchport mode {{ r.mode }}',
  '{% if r.access_vlan %} switchport access vlan {{ r.access_vlan }}',
  '{% endif %}{% if r.enabled %} no shutdown',
  '{% else %} shutdown',
  '{% endif %}{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'interface-ranges',
    title: 'Cisco IOS interface ranges',
    description:
      'Generate Ansible group_vars and a Cisco IOS interface range configuration — a repeating list of port ranges with description, switchport mode, access VLAN, and admin state — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE renders identical interface-range/switchport CLI (exact). NX-OS/EOS
    // differ in range and switchport syntax and are intentionally NOT offered
    // here rather than shipped as a guess.
    templates: { 'cisco-iosxe': template },
    defaultScope: { kind: 'host', name: 'switch1' },
  },
  messages: {
    en: {
      'task.interface-ranges.legend': 'Interface ranges',
      'task.interface-ranges.field.ranges.label': 'Ranges',
      'task.interface-ranges.field.ranges.help': 'One interface range block per row.',
      'task.interface-ranges.field.ranges.add': 'Add range',
      'task.interface-ranges.field.ranges.item': 'Range {index}',
      'task.interface-ranges.field.ranges.range.label': 'Interface range',
      'task.interface-ranges.field.ranges.range.help':
        'Contiguous range as IOS expects it, e.g. GigabitEthernet1/0/1 - 12.',
      'task.interface-ranges.field.ranges.description.label': 'Description',
      'task.interface-ranges.field.ranges.description.help':
        'Optional description applied to every port in the range. Omitted when blank.',
      'task.interface-ranges.field.ranges.mode.label': 'Switchport mode',
      'task.interface-ranges.field.ranges.mode.help': 'Access or trunk mode for the range.',
      'task.interface-ranges.mode.access': 'access',
      'task.interface-ranges.mode.trunk': 'trunk',
      'task.interface-ranges.field.ranges.access_vlan.label': 'Access VLAN',
      'task.interface-ranges.field.ranges.access_vlan.help':
        'Optional access VLAN id (1–4094); applies in access mode. Omitted when blank.',
      'task.interface-ranges.field.ranges.enabled.label': 'Administratively enabled',
      'task.interface-ranges.field.ranges.enabled.help': 'When off, the range is shut down.',
    },
    fr: {
      'task.interface-ranges.legend': 'Plages d’interfaces',
      'task.interface-ranges.field.ranges.label': 'Plages',
      'task.interface-ranges.field.ranges.help': 'Un bloc interface range par ligne.',
      'task.interface-ranges.field.ranges.add': 'Ajouter une plage',
      'task.interface-ranges.field.ranges.item': 'Plage {index}',
      'task.interface-ranges.field.ranges.range.label': 'Plage d’interfaces',
      'task.interface-ranges.field.ranges.range.help':
        'Plage contiguë telle qu’IOS l’attend, par ex. GigabitEthernet1/0/1 - 12.',
      'task.interface-ranges.field.ranges.description.label': 'Description',
      'task.interface-ranges.field.ranges.description.help':
        'Description facultative appliquée à chaque port de la plage. Omise si vide.',
      'task.interface-ranges.field.ranges.mode.label': 'Mode switchport',
      'task.interface-ranges.field.ranges.mode.help': 'Mode access ou trunk pour la plage.',
      'task.interface-ranges.mode.access': 'access',
      'task.interface-ranges.mode.trunk': 'trunk',
      'task.interface-ranges.field.ranges.access_vlan.label': 'VLAN d’accès',
      'task.interface-ranges.field.ranges.access_vlan.help':
        'Identifiant de VLAN d’accès facultatif (1–4094) ; s’applique en mode access. Omis si vide.',
      'task.interface-ranges.field.ranges.enabled.label': 'Activée administrativement',
      'task.interface-ranges.field.ranges.enabled.help': 'Si désactivée, la plage est arrêtée (shutdown).',
    },
  },
};
