/**
 * Curated task: Cisco IOS HSRP (first-hop redundancy) (issue #22).
 *
 * A list-shaped, interface-scoped task on the #20 `list` field type: one
 * interface carrying a repeating table of HSRP standby groups, each with a
 * virtual IP and optional priority/preempt. (VRRP is a natural sibling task; the
 * `standby` keyword here is HSRP-specific.)
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
      legend: 'task.hsrp.legend',
      fields: [
        {
          type: 'text',
          name: 'interface',
          label: 'task.hsrp.field.interface.label',
          help: 'task.hsrp.field.interface.help',
          required: true,
          placeholder: 'Vlan10',
        },
        {
          type: 'list',
          name: 'groups',
          label: 'task.hsrp.field.groups.label',
          help: 'task.hsrp.field.groups.help',
          minRows: 1,
          addLabel: 'task.hsrp.field.groups.add',
          itemLabel: 'task.hsrp.field.groups.item',
          fields: [
            {
              type: 'number',
              name: 'group_id',
              label: 'task.hsrp.field.groups.group_id.label',
              help: 'task.hsrp.field.groups.group_id.help',
              required: true,
              min: 0,
              max: 255,
            },
            {
              type: 'text',
              name: 'vip',
              label: 'task.hsrp.field.groups.vip.label',
              help: 'task.hsrp.field.groups.vip.help',
              required: true,
              pattern: IPV4,
              placeholder: '10.0.10.1',
            },
            {
              type: 'number',
              name: 'priority',
              label: 'task.hsrp.field.groups.priority.label',
              help: 'task.hsrp.field.groups.priority.help',
              min: 0,
              max: 255,
              omitWhenBlank: true,
            },
            {
              type: 'boolean',
              name: 'preempt',
              label: 'task.hsrp.field.groups.preempt.label',
              help: 'task.hsrp.field.groups.preempt.help',
              default: false,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// interface header and the per-group `ip` line are always present; priority and
// preempt are optional sub-lines carrying their newline inside the `{% if %}`.
const template = [
  'interface {{ interface }}',
  '{% for g in groups %} standby {{ g.group_id }} ip {{ g.vip }}',
  '{% if g.priority %} standby {{ g.group_id }} priority {{ g.priority }}',
  '{% endif %}{% if g.preempt %} standby {{ g.group_id }} preempt',
  '{% endif %}{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'hsrp',
    title: 'Cisco IOS HSRP (first-hop redundancy)',
    description:
      'Generate Ansible host_vars and a Cisco IOS HSRP configuration — an interface carrying a repeating list of standby groups with virtual IP, priority, and preempt — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'dist1' },
  },
  messages: {
    en: {
      'task.hsrp.legend': 'HSRP',
      'task.hsrp.field.interface.label': 'Interface',
      'task.hsrp.field.interface.help': 'The interface the HSRP groups run on, e.g. Vlan10.',
      'task.hsrp.field.groups.label': 'Standby groups',
      'task.hsrp.field.groups.help': 'One HSRP standby group per row.',
      'task.hsrp.field.groups.add': 'Add group',
      'task.hsrp.field.groups.item': 'Group {index}',
      'task.hsrp.field.groups.group_id.label': 'Group number',
      'task.hsrp.field.groups.group_id.help': 'HSRP group number (0–255).',
      'task.hsrp.field.groups.vip.label': 'Virtual IP',
      'task.hsrp.field.groups.vip.help': 'The shared virtual gateway IP, e.g. 10.0.10.1.',
      'task.hsrp.field.groups.priority.label': 'Priority',
      'task.hsrp.field.groups.priority.help':
        'Optional priority (0–255, default 100); higher wins active. Omitted when blank.',
      'task.hsrp.field.groups.preempt.label': 'Preempt',
      'task.hsrp.field.groups.preempt.help':
        'When on, a higher-priority router takes over active when it comes up.',
    },
    fr: {
      'task.hsrp.legend': 'HSRP',
      'task.hsrp.field.interface.label': 'Interface',
      'task.hsrp.field.interface.help': 'L’interface sur laquelle tournent les groupes HSRP, par ex. Vlan10.',
      'task.hsrp.field.groups.label': 'Groupes standby',
      'task.hsrp.field.groups.help': 'Un groupe standby HSRP par ligne.',
      'task.hsrp.field.groups.add': 'Ajouter un groupe',
      'task.hsrp.field.groups.item': 'Groupe {index}',
      'task.hsrp.field.groups.group_id.label': 'Numéro de groupe',
      'task.hsrp.field.groups.group_id.help': 'Numéro de groupe HSRP (0–255).',
      'task.hsrp.field.groups.vip.label': 'IP virtuelle',
      'task.hsrp.field.groups.vip.help': 'L’IP de passerelle virtuelle partagée, par ex. 10.0.10.1.',
      'task.hsrp.field.groups.priority.label': 'Priorité',
      'task.hsrp.field.groups.priority.help':
        'Priorité facultative (0–255, défaut 100) ; la plus élevée devient active. Omise si vide.',
      'task.hsrp.field.groups.preempt.label': 'Préemption',
      'task.hsrp.field.groups.preempt.help':
        'Si activée, un routeur de priorité supérieure reprend le rôle actif à son démarrage.',
    },
  },
};
