/**
 * Curated task: Cisco ASA access-group — bind an ACL to an interface (issue #49).
 *
 * The companion to the `asa-acl` task: once an access list exists, `access-group`
 * applies it to an interface in a direction (`access-group OUTSIDE-IN in interface
 * outside`). A device commonly has several such bindings (one per interface and
 * direction), so this is a multi-entry `list` task (#20), one binding per row —
 * its own firewall task family (`vendor: 'cisco-asa'`), not a per-vendor overlay.
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the template uses no filters, so the preview is always `exact`.
 * The `{{ '\n' }}` terminator ends each emitted line on an *output* token so
 * Ansible's trim_blocks keeps the break.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.asa-access-group.legend',
      fields: [
        {
          type: 'list',
          name: 'bindings',
          label: 'task.asa-access-group.field.bindings.label',
          help: 'task.asa-access-group.field.bindings.help',
          required: true,
          minRows: 1,
          addLabel: 'task.asa-access-group.bindings.add',
          removeLabel: 'task.asa-access-group.bindings.remove',
          itemLabel: 'task.asa-access-group.bindings.item',
          fields: [
            {
              type: 'text',
              name: 'acl_name',
              label: 'task.asa-access-group.field.acl_name.label',
              help: 'task.asa-access-group.field.acl_name.help',
              required: true,
              placeholder: 'OUTSIDE-IN',
            },
            {
              type: 'select',
              name: 'direction',
              label: 'task.asa-access-group.field.direction.label',
              help: 'task.asa-access-group.field.direction.help',
              default: 'in',
              options: [
                { value: 'in', label: 'task.asa-access-group.direction.in' },
                { value: 'out', label: 'task.asa-access-group.direction.out' },
              ],
            },
            {
              type: 'text',
              name: 'interface',
              label: 'task.asa-access-group.field.interface.label',
              help: 'task.asa-access-group.field.interface.help',
              required: true,
              placeholder: 'outside',
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco ASA. One `access-group NAME {in|out} interface IF` line per row.
const template =
  '{% for b in bindings %}' +
  'access-group {{ b.acl_name }} {{ b.direction }} interface {{ b.interface }}' +
  "{{ '\\n' }}{% endfor %}";

export const task: TaskModule = {
  definition: {
    slug: 'asa-access-group',
    title: 'Cisco ASA access-group (apply ACL to interface)',
    description:
      'Generate Ansible group_vars and Cisco ASA access-group bindings — apply an access list to an interface in a direction (in/out) — with a live device-CLI preview.',
    vendor: 'cisco-asa',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.asa-access-group.legend': 'Access-group bindings',
      'task.asa-access-group.field.bindings.label': 'Bindings',
      'task.asa-access-group.field.bindings.help':
        'One or more access-group bindings, each applying an ACL to an interface.',
      'task.asa-access-group.bindings.add': 'Add binding',
      'task.asa-access-group.bindings.item': 'Binding {index}',
      'task.asa-access-group.bindings.remove': 'Remove binding {index}',
      'task.asa-access-group.field.acl_name.label': 'ACL name',
      'task.asa-access-group.field.acl_name.help':
        'Name of an existing access list to apply, e.g. OUTSIDE-IN.',
      'task.asa-access-group.field.direction.label': 'Direction',
      'task.asa-access-group.field.direction.help':
        'Apply the ACL to traffic entering (in) or leaving (out) the interface.',
      'task.asa-access-group.field.interface.label': 'Interface',
      'task.asa-access-group.field.interface.help':
        'The interface nameif to bind the ACL to, e.g. outside.',
      'task.asa-access-group.direction.in': 'in',
      'task.asa-access-group.direction.out': 'out',
    },
    fr: {
      'task.asa-access-group.legend': 'Liaisons access-group',
      'task.asa-access-group.field.bindings.label': 'Liaisons',
      'task.asa-access-group.field.bindings.help':
        'Une ou plusieurs liaisons access-group, chacune appliquant une ACL à une interface.',
      'task.asa-access-group.bindings.add': 'Ajouter une liaison',
      'task.asa-access-group.bindings.item': 'Liaison {index}',
      'task.asa-access-group.bindings.remove': 'Supprimer la liaison {index}',
      'task.asa-access-group.field.acl_name.label': 'Nom de l’ACL',
      'task.asa-access-group.field.acl_name.help':
        'Nom d’une liste d’accès existante à appliquer, par ex. OUTSIDE-IN.',
      'task.asa-access-group.field.direction.label': 'Direction',
      'task.asa-access-group.field.direction.help':
        'Appliquer l’ACL au trafic entrant (in) ou sortant (out) de l’interface.',
      'task.asa-access-group.field.interface.label': 'Interface',
      'task.asa-access-group.field.interface.help':
        'Le nameif de l’interface à lier à l’ACL, par ex. outside.',
      'task.asa-access-group.direction.in': 'in',
      'task.asa-access-group.direction.out': 'out',
    },
  },
};
