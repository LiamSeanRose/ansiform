/**
 * Curated task: Cisco IOS route-map (issue #22).
 *
 * The deepest list-shaped task: a named route-map built from a repeating table
 * of sequences, each a `route-map NAME {permit|deny} SEQ` header followed by
 * optional match and set clauses. Pairs with the shipped `prefix-lists`/`acl`
 * tasks (a sequence can match an IP prefix-list by name).
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — the sequences become a YAML sequence of per-row
 * mappings with omit-on-blank inside each row. No filters, so the preview is
 * `exact`. Each clause is its own sub-line carrying its newline inside the
 * `{% if %}`, so unset clauses leave no gap.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.route-maps.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.route-maps.field.name.label',
          help: 'task.route-maps.field.name.help',
          required: true,
          placeholder: 'SET-LOCALPREF',
        },
        {
          type: 'list',
          name: 'sequences',
          label: 'task.route-maps.field.sequences.label',
          help: 'task.route-maps.field.sequences.help',
          minRows: 1,
          addLabel: 'task.route-maps.field.sequences.add',
          itemLabel: 'task.route-maps.field.sequences.item',
          fields: [
            {
              type: 'number',
              name: 'seq',
              label: 'task.route-maps.field.sequences.seq.label',
              help: 'task.route-maps.field.sequences.seq.help',
              required: true,
              min: 1,
              max: 65535,
            },
            {
              type: 'select',
              name: 'action',
              label: 'task.route-maps.field.sequences.action.label',
              help: 'task.route-maps.field.sequences.action.help',
              default: 'permit',
              options: [
                { value: 'permit', label: 'task.route-maps.action.permit' },
                { value: 'deny', label: 'task.route-maps.action.deny' },
              ],
            },
            {
              type: 'text',
              name: 'match_prefix_list',
              label: 'task.route-maps.field.sequences.match_prefix_list.label',
              help: 'task.route-maps.field.sequences.match_prefix_list.help',
              placeholder: 'MGMT-NETS',
              omitWhenBlank: true,
            },
            {
              type: 'number',
              name: 'set_local_pref',
              label: 'task.route-maps.field.sequences.set_local_pref.label',
              help: 'task.route-maps.field.sequences.set_local_pref.help',
              min: 0,
              max: 4294967295,
              omitWhenBlank: true,
            },
            {
              type: 'number',
              name: 'set_metric',
              label: 'task.route-maps.field.sequences.set_metric.label',
              help: 'task.route-maps.field.sequences.set_metric.help',
              min: 0,
              max: 4294967295,
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// `route-map` header is always present (ends in an output, newline survives);
// each match/set clause is its own sub-line whose newline lives inside the
// `{% if %}`, so an unset clause leaves no gap.
const template = [
  '{% for s in sequences %}route-map {{ name }} {{ s.action }} {{ s.seq }}',
  '{% if s.match_prefix_list %} match ip address prefix-list {{ s.match_prefix_list }}',
  '{% endif %}{% if s.set_local_pref %} set local-preference {{ s.set_local_pref }}',
  '{% endif %}{% if s.set_metric %} set metric {{ s.set_metric }}',
  '{% endif %}{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'route-maps',
    title: 'Cisco IOS route-map',
    description:
      'Generate Ansible group_vars and a Cisco IOS route-map — a named policy of permit/deny sequences with match (IP prefix-list) and set (local-preference, metric) clauses — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.route-maps.legend': 'Route-map',
      'task.route-maps.field.name.label': 'Route-map name',
      'task.route-maps.field.name.help': 'Name shared by every sequence, e.g. SET-LOCALPREF.',
      'task.route-maps.field.sequences.label': 'Sequences',
      'task.route-maps.field.sequences.help': 'One route-map sequence per row, evaluated in order.',
      'task.route-maps.field.sequences.add': 'Add sequence',
      'task.route-maps.field.sequences.item': 'Sequence {index}',
      'task.route-maps.field.sequences.seq.label': 'Sequence number',
      'task.route-maps.field.sequences.seq.help': 'Sequence number that orders evaluation (1–65535).',
      'task.route-maps.field.sequences.action.label': 'Action',
      'task.route-maps.field.sequences.action.help':
        'Permit (apply set clauses / pass) or deny (drop) routes matching this sequence.',
      'task.route-maps.action.permit': 'permit',
      'task.route-maps.action.deny': 'deny',
      'task.route-maps.field.sequences.match_prefix_list.label': 'Match IP prefix-list',
      'task.route-maps.field.sequences.match_prefix_list.help':
        'Optional name of an IP prefix-list to match, e.g. MGMT-NETS. Omitted when blank (matches all).',
      'task.route-maps.field.sequences.set_local_pref.label': 'Set local-preference',
      'task.route-maps.field.sequences.set_local_pref.help':
        'Optional BGP local-preference to set on matched routes. Omitted when blank.',
      'task.route-maps.field.sequences.set_metric.label': 'Set metric',
      'task.route-maps.field.sequences.set_metric.help':
        'Optional metric (MED) to set on matched routes. Omitted when blank.',
    },
    fr: {
      'task.route-maps.legend': 'Route-map',
      'task.route-maps.field.name.label': 'Nom de la route-map',
      'task.route-maps.field.name.help': 'Nom partagé par toutes les séquences, par ex. SET-LOCALPREF.',
      'task.route-maps.field.sequences.label': 'Séquences',
      'task.route-maps.field.sequences.help': 'Une séquence de route-map par ligne, évaluée dans l’ordre.',
      'task.route-maps.field.sequences.add': 'Ajouter une séquence',
      'task.route-maps.field.sequences.item': 'Séquence {index}',
      'task.route-maps.field.sequences.seq.label': 'Numéro de séquence',
      'task.route-maps.field.sequences.seq.help': 'Numéro de séquence qui ordonne l’évaluation (1–65535).',
      'task.route-maps.field.sequences.action.label': 'Action',
      'task.route-maps.field.sequences.action.help':
        'Autoriser (permit : appliquer les clauses set / laisser passer) ou refuser (deny : rejeter) les routes correspondant à cette séquence.',
      'task.route-maps.action.permit': 'permit',
      'task.route-maps.action.deny': 'deny',
      'task.route-maps.field.sequences.match_prefix_list.label': 'Match liste de préfixes IP',
      'task.route-maps.field.sequences.match_prefix_list.help':
        'Nom facultatif d’une liste de préfixes IP à matcher, par ex. MGMT-NETS. Omis si vide (matche tout).',
      'task.route-maps.field.sequences.set_local_pref.label': 'Set local-preference',
      'task.route-maps.field.sequences.set_local_pref.help':
        'Local-preference BGP facultative à appliquer aux routes correspondantes. Omise si vide.',
      'task.route-maps.field.sequences.set_metric.label': 'Set metric',
      'task.route-maps.field.sequences.set_metric.help':
        'Métrique (MED) facultative à appliquer aux routes correspondantes. Omise si vide.',
    },
  },
};
