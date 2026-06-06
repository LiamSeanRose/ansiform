/**
 * Curated task: Cisco IOS VRRP (first-hop redundancy) (issue #22).
 *
 * Sibling of the `hsrp` task on the #20 `list` field type: one interface
 * carrying a repeating table of VRRP groups, each with a virtual IP and optional
 * priority/preempt. The `vrrp` keyword is the only real difference from HSRP.
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — the groups become a YAML sequence of per-row mappings
 * with omit-on-blank inside each row. No filters, so the preview is `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

// Dotted IPv4, e.g. 10.0.10.1.
const IPV4 = '^(\\d{1,3}\\.){3}\\d{1,3}$';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.vrrp.legend',
      fields: [
        {
          type: 'text',
          name: 'interface',
          label: 'task.vrrp.field.interface.label',
          help: 'task.vrrp.field.interface.help',
          required: true,
          placeholder: 'Vlan10',
        },
        {
          type: 'list',
          name: 'groups',
          label: 'task.vrrp.field.groups.label',
          help: 'task.vrrp.field.groups.help',
          minRows: 1,
          addLabel: 'task.vrrp.field.groups.add',
          itemLabel: 'task.vrrp.field.groups.item',
          fields: [
            {
              type: 'number',
              name: 'group_id',
              label: 'task.vrrp.field.groups.group_id.label',
              help: 'task.vrrp.field.groups.group_id.help',
              required: true,
              min: 1,
              max: 255,
            },
            {
              type: 'text',
              name: 'vip',
              label: 'task.vrrp.field.groups.vip.label',
              help: 'task.vrrp.field.groups.vip.help',
              required: true,
              pattern: IPV4,
              placeholder: '10.0.10.1',
            },
            {
              type: 'number',
              name: 'priority',
              label: 'task.vrrp.field.groups.priority.label',
              help: 'task.vrrp.field.groups.priority.help',
              min: 1,
              max: 254,
              omitWhenBlank: true,
            },
            {
              type: 'boolean',
              name: 'preempt',
              label: 'task.vrrp.field.groups.preempt.label',
              help: 'task.vrrp.field.groups.preempt.help',
              default: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// interface header and per-group `ip` line are always present; priority and
// preempt are optional sub-lines carrying their newline inside the `{% if %}`.
const template = [
  'interface {{ interface }}',
  '{% for g in groups %} vrrp {{ g.group_id }} ip {{ g.vip }}',
  '{% if g.priority %} vrrp {{ g.group_id }} priority {{ g.priority }}',
  '{% endif %}{% if g.preempt %} vrrp {{ g.group_id }} preempt',
  '{% endif %}{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'vrrp',
    title: 'Cisco IOS VRRP (first-hop redundancy)',
    description:
      'Generate Ansible host_vars and a Cisco IOS VRRP configuration — an interface carrying a repeating list of VRRP groups with virtual IP, priority, and preempt — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'dist1' },
  },
  messages: {
    en: {
      'task.vrrp.legend': 'VRRP',
      'task.vrrp.field.interface.label': 'Interface',
      'task.vrrp.field.interface.help': 'The interface the VRRP groups run on, e.g. Vlan10.',
      'task.vrrp.field.groups.label': 'VRRP groups',
      'task.vrrp.field.groups.help': 'One VRRP group per row.',
      'task.vrrp.field.groups.add': 'Add group',
      'task.vrrp.field.groups.item': 'Group {index}',
      'task.vrrp.field.groups.group_id.label': 'Group number',
      'task.vrrp.field.groups.group_id.help': 'VRRP group number (1–255).',
      'task.vrrp.field.groups.vip.label': 'Virtual IP',
      'task.vrrp.field.groups.vip.help': 'The shared virtual gateway IP, e.g. 10.0.10.1.',
      'task.vrrp.field.groups.priority.label': 'Priority',
      'task.vrrp.field.groups.priority.help':
        'Optional priority (1–254, default 100); higher becomes master. Omitted when blank.',
      'task.vrrp.field.groups.preempt.label': 'Preempt',
      'task.vrrp.field.groups.preempt.help':
        'When on, a higher-priority router takes over master when it comes up (VRRP default).',
    },
    fr: {
      'task.vrrp.legend': 'VRRP',
      'task.vrrp.field.interface.label': 'Interface',
      'task.vrrp.field.interface.help': 'L’interface sur laquelle tournent les groupes VRRP, par ex. Vlan10.',
      'task.vrrp.field.groups.label': 'Groupes VRRP',
      'task.vrrp.field.groups.help': 'Un groupe VRRP par ligne.',
      'task.vrrp.field.groups.add': 'Ajouter un groupe',
      'task.vrrp.field.groups.item': 'Groupe {index}',
      'task.vrrp.field.groups.group_id.label': 'Numéro de groupe',
      'task.vrrp.field.groups.group_id.help': 'Numéro de groupe VRRP (1–255).',
      'task.vrrp.field.groups.vip.label': 'IP virtuelle',
      'task.vrrp.field.groups.vip.help': 'L’IP de passerelle virtuelle partagée, par ex. 10.0.10.1.',
      'task.vrrp.field.groups.priority.label': 'Priorité',
      'task.vrrp.field.groups.priority.help':
        'Priorité facultative (1–254, défaut 100) ; la plus élevée devient maître. Omise si vide.',
      'task.vrrp.field.groups.preempt.label': 'Préemption',
      'task.vrrp.field.groups.preempt.help':
        'Si activée, un routeur de priorité supérieure reprend le rôle maître à son démarrage (défaut VRRP).',
    },
  },
};
