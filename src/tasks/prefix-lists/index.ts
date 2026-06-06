/**
 * Curated task: Cisco IOS IP prefix-list (issue #22).
 *
 * A list-shaped task on the #20 `list` field type: a named prefix-list built
 * from a repeating table of entries, each `ip prefix-list NAME seq N {permit|deny}
 * PREFIX [ge X] [le Y]`. (Route-maps that match these are a deeper sibling task.)
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — the entries become a YAML sequence of per-row mappings
 * with omit-on-blank inside each row. No filters, so the preview is `exact`. The
 * line ends in the optional `le`, so its newline is an explicit `{{ '\n' }}`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.prefix-lists.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.prefix-lists.field.name.label',
          help: 'task.prefix-lists.field.name.help',
          required: true,
          placeholder: 'MGMT-NETS',
        },
        {
          type: 'list',
          name: 'entries',
          label: 'task.prefix-lists.field.entries.label',
          help: 'task.prefix-lists.field.entries.help',
          minRows: 1,
          addLabel: 'task.prefix-lists.field.entries.add',
          itemLabel: 'task.prefix-lists.field.entries.item',
          fields: [
            {
              type: 'number',
              name: 'seq',
              label: 'task.prefix-lists.field.entries.seq.label',
              help: 'task.prefix-lists.field.entries.seq.help',
              required: true,
              min: 1,
              max: 4294967294,
            },
            {
              type: 'select',
              name: 'action',
              label: 'task.prefix-lists.field.entries.action.label',
              help: 'task.prefix-lists.field.entries.action.help',
              default: 'permit',
              options: [
                { value: 'permit', label: 'task.prefix-lists.action.permit' },
                { value: 'deny', label: 'task.prefix-lists.action.deny' },
              ],
            },
            {
              type: 'text',
              name: 'prefix',
              label: 'task.prefix-lists.field.entries.prefix.label',
              help: 'task.prefix-lists.field.entries.prefix.help',
              required: true,
              placeholder: '10.0.0.0/8',
            },
            {
              type: 'number',
              name: 'ge',
              label: 'task.prefix-lists.field.entries.ge.label',
              help: 'task.prefix-lists.field.entries.ge.help',
              min: 1,
              max: 32,
              omitWhenBlank: true,
            },
            {
              type: 'number',
              name: 'le',
              label: 'task.prefix-lists.field.entries.le.label',
              help: 'task.prefix-lists.field.entries.le.help',
              min: 1,
              max: 32,
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// entry line ends in the optional `le`, so the row newline is an explicit
// `{{ '\n' }}` output that trim_blocks cannot swallow.
const template =
  "{% for e in entries %}ip prefix-list {{ name }} seq {{ e.seq }} {{ e.action }} {{ e.prefix }}{% if e.ge %} ge {{ e.ge }}{% endif %}{% if e.le %} le {{ e.le }}{% endif %}{{ '\\n' }}{% endfor %}";

export const task: TaskModule = {
  definition: {
    slug: 'prefix-lists',
    title: 'Cisco IOS IP prefix-list',
    description:
      'Generate Ansible group_vars and a Cisco IOS IP prefix-list — a named list of permit/deny entries with sequence, prefix, and optional ge/le bounds — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.prefix-lists.legend': 'IP prefix-list',
      'task.prefix-lists.field.name.label': 'Prefix-list name',
      'task.prefix-lists.field.name.help': 'Name shared by every entry, e.g. MGMT-NETS.',
      'task.prefix-lists.field.entries.label': 'Entries',
      'task.prefix-lists.field.entries.help': 'One prefix-list entry per row.',
      'task.prefix-lists.field.entries.add': 'Add entry',
      'task.prefix-lists.field.entries.item': 'Entry {index}',
      'task.prefix-lists.field.entries.seq.label': 'Sequence',
      'task.prefix-lists.field.entries.seq.help': 'Sequence number that orders the entries.',
      'task.prefix-lists.field.entries.action.label': 'Action',
      'task.prefix-lists.field.entries.action.help': 'Permit or deny prefixes matching this entry.',
      'task.prefix-lists.action.permit': 'permit',
      'task.prefix-lists.action.deny': 'deny',
      'task.prefix-lists.field.entries.prefix.label': 'Prefix',
      'task.prefix-lists.field.entries.prefix.help': 'Network and length, e.g. 10.0.0.0/8.',
      'task.prefix-lists.field.entries.ge.label': 'ge (greater-or-equal)',
      'task.prefix-lists.field.entries.ge.help':
        'Optional lower bound on prefix length to match (1–32). Omitted when blank.',
      'task.prefix-lists.field.entries.le.label': 'le (less-or-equal)',
      'task.prefix-lists.field.entries.le.help':
        'Optional upper bound on prefix length to match (1–32). Omitted when blank.',
    },
    fr: {
      'task.prefix-lists.legend': 'Liste de préfixes IP',
      'task.prefix-lists.field.name.label': 'Nom de la liste de préfixes',
      'task.prefix-lists.field.name.help': 'Nom partagé par toutes les entrées, par ex. MGMT-NETS.',
      'task.prefix-lists.field.entries.label': 'Entrées',
      'task.prefix-lists.field.entries.help': 'Une entrée de liste de préfixes par ligne.',
      'task.prefix-lists.field.entries.add': 'Ajouter une entrée',
      'task.prefix-lists.field.entries.item': 'Entrée {index}',
      'task.prefix-lists.field.entries.seq.label': 'Séquence',
      'task.prefix-lists.field.entries.seq.help': 'Numéro de séquence qui ordonne les entrées.',
      'task.prefix-lists.field.entries.action.label': 'Action',
      'task.prefix-lists.field.entries.action.help': 'Autoriser (permit) ou refuser (deny) les préfixes correspondant à cette entrée.',
      'task.prefix-lists.action.permit': 'permit',
      'task.prefix-lists.action.deny': 'deny',
      'task.prefix-lists.field.entries.prefix.label': 'Préfixe',
      'task.prefix-lists.field.entries.prefix.help': 'Réseau et longueur, par ex. 10.0.0.0/8.',
      'task.prefix-lists.field.entries.ge.label': 'ge (supérieur ou égal)',
      'task.prefix-lists.field.entries.ge.help':
        'Borne inférieure facultative sur la longueur de préfixe à matcher (1–32). Omise si vide.',
      'task.prefix-lists.field.entries.le.label': 'le (inférieur ou égal)',
      'task.prefix-lists.field.entries.le.help':
        'Borne supérieure facultative sur la longueur de préfixe à matcher (1–32). Omise si vide.',
    },
  },
};
