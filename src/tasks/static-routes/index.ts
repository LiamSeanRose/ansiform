/**
 * Curated task: Cisco IOS static routes (issue #22).
 *
 * A list-shaped task on the #20 `list` field type: a repeating table of static
 * routes, each rendered as one `ip route …` line. The optional administrative
 * distance is the last token on the line, so the per-row newline is emitted
 * explicitly with `{{ '\n' }}` (an output) — trim_blocks only swallows a newline
 * that follows a block tag, never one produced by an output.
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — the routes become a YAML sequence of per-row mappings
 * with omit-on-blank inside each row. No filters, so the preview is `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

// Dotted IPv4, e.g. 192.0.2.1 — used for the prefix, mask, and next hop.
const IPV4 = '^(\\d{1,3}\\.){3}\\d{1,3}$';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.static-routes.legend',
      fields: [
        {
          type: 'list',
          name: 'routes',
          label: 'task.static-routes.field.routes.label',
          help: 'task.static-routes.field.routes.help',
          minRows: 1,
          addLabel: 'task.static-routes.field.routes.add',
          itemLabel: 'task.static-routes.field.routes.item',
          fields: [
            {
              type: 'text',
              name: 'prefix',
              label: 'task.static-routes.field.routes.prefix.label',
              help: 'task.static-routes.field.routes.prefix.help',
              required: true,
              pattern: IPV4,
              placeholder: '10.0.0.0',
            },
            {
              type: 'text',
              name: 'mask',
              label: 'task.static-routes.field.routes.mask.label',
              help: 'task.static-routes.field.routes.mask.help',
              required: true,
              pattern: IPV4,
              placeholder: '255.0.0.0',
            },
            {
              type: 'text',
              name: 'next_hop',
              label: 'task.static-routes.field.routes.next_hop.label',
              help: 'task.static-routes.field.routes.next_hop.help',
              required: true,
              placeholder: '192.0.2.1',
            },
            {
              type: 'number',
              name: 'distance',
              label: 'task.static-routes.field.routes.distance.label',
              help: 'task.static-routes.field.routes.distance.help',
              min: 1,
              max: 255,
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// trailing admin distance is optional, so the line ends in a `{% if %}`; the
// row's newline is therefore emitted as an explicit `{{ '\n' }}` output, which
// trim_blocks cannot swallow (it only drops a newline right after a block tag).
const template =
  "{% for r in routes %}ip route {{ r.prefix }} {{ r.mask }} {{ r.next_hop }}{% if r.distance %} {{ r.distance }}{% endif %}{{ '\\n' }}{% endfor %}";

export const task: TaskModule = {
  definition: {
    slug: 'static-routes',
    title: 'Cisco IOS static routes',
    description:
      'Generate Ansible group_vars and a Cisco IOS static routing configuration — a repeating list of ip route entries with prefix, mask, next hop, and optional administrative distance — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.static-routes.legend': 'Static routes',
      'task.static-routes.field.routes.label': 'Routes',
      'task.static-routes.field.routes.help': 'One ip route entry per row.',
      'task.static-routes.field.routes.add': 'Add route',
      'task.static-routes.field.routes.item': 'Route {index}',
      'task.static-routes.field.routes.prefix.label': 'Destination prefix',
      'task.static-routes.field.routes.prefix.help':
        'Destination network address, e.g. 10.0.0.0 (use 0.0.0.0 with mask 0.0.0.0 for a default route).',
      'task.static-routes.field.routes.mask.label': 'Subnet mask',
      'task.static-routes.field.routes.mask.help': 'Destination subnet mask, e.g. 255.0.0.0.',
      'task.static-routes.field.routes.next_hop.label': 'Next hop',
      'task.static-routes.field.routes.next_hop.help':
        'Next-hop IP address or exit interface, e.g. 192.0.2.1.',
      'task.static-routes.field.routes.distance.label': 'Administrative distance',
      'task.static-routes.field.routes.distance.help':
        'Optional administrative distance (1–255); raise it for a floating static route. Omitted when blank.',
    },
    fr: {
      'task.static-routes.legend': 'Routes statiques',
      'task.static-routes.field.routes.label': 'Routes',
      'task.static-routes.field.routes.help': 'Une entrée ip route par ligne.',
      'task.static-routes.field.routes.add': 'Ajouter une route',
      'task.static-routes.field.routes.item': 'Route {index}',
      'task.static-routes.field.routes.prefix.label': 'Préfixe de destination',
      'task.static-routes.field.routes.prefix.help':
        'Adresse réseau de destination, par ex. 10.0.0.0 (utiliser 0.0.0.0 avec le masque 0.0.0.0 pour une route par défaut).',
      'task.static-routes.field.routes.mask.label': 'Masque de sous-réseau',
      'task.static-routes.field.routes.mask.help': 'Masque de sous-réseau de destination, par ex. 255.0.0.0.',
      'task.static-routes.field.routes.next_hop.label': 'Saut suivant',
      'task.static-routes.field.routes.next_hop.help':
        'Adresse IP du saut suivant ou interface de sortie, par ex. 192.0.2.1.',
      'task.static-routes.field.routes.distance.label': 'Distance administrative',
      'task.static-routes.field.routes.distance.help':
        'Distance administrative facultative (1–255) ; à augmenter pour une route statique flottante. Omise si vide.',
    },
  },
};
