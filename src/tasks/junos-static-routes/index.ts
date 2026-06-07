/**
 * Curated task: Juniper Junos static routes — multi-entry (issue #51).
 *
 * The first NATIVE Junos task (Junos had only an interface overlay before). Junos
 * config is the flat `set …` form (#36/#39): `set routing-options static route
 * <prefix> next-hop <nh>`, one line per route, built on the `list` field type
 * (#20). Junos takes the destination as CIDR verbatim — no address/mask split.
 *
 * Honesty (#39): the YAML vars are always correct; the preview is authored from
 * public Junos syntax and not device-verified, so the task declares
 * `fidelityFloor: 'approximate'` and the pane always shows the degrade notice.
 * The template uses no filters, so it renders `exact` before the floor clamps it.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.junos-static-routes.legend',
      fields: [
        {
          type: 'list',
          name: 'routes',
          label: 'task.junos-static-routes.field.routes.label',
          help: 'task.junos-static-routes.field.routes.help',
          required: true,
          minRows: 1,
          addLabel: 'task.junos-static-routes.routes.add',
          removeLabel: 'task.junos-static-routes.routes.remove',
          itemLabel: 'task.junos-static-routes.routes.item',
          fields: [
            {
              type: 'text',
              name: 'destination',
              label: 'task.junos-static-routes.field.destination.label',
              help: 'task.junos-static-routes.field.destination.help',
              required: true,
              placeholder: '10.0.0.0/24',
            },
            {
              type: 'select',
              name: 'action',
              label: 'task.junos-static-routes.field.action.label',
              help: 'task.junos-static-routes.field.action.help',
              default: 'next-hop',
              options: [
                { value: 'next-hop', label: 'task.junos-static-routes.action.next-hop' },
                { value: 'discard', label: 'task.junos-static-routes.action.discard' },
                { value: 'reject', label: 'task.junos-static-routes.action.reject' },
              ],
            },
            {
              type: 'text',
              name: 'next_hop',
              label: 'task.junos-static-routes.field.next_hop.label',
              help: 'task.junos-static-routes.field.next_hop.help',
              placeholder: '192.168.1.1',
              omitWhenBlank: true,
            },
            {
              type: 'number',
              name: 'metric',
              label: 'task.junos-static-routes.field.metric.label',
              help: 'task.junos-static-routes.field.metric.help',
              min: 0,
              max: 65535,
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Junos `set` form. One route per line; the next-hop / discard / reject
// keyword is chosen by `action`, and an optional metric appends. No filters →
// renders exact, then `fidelityFloor` clamps the preview to approximate.
const template =
  '{% for r in routes %}' +
  'set routing-options static route {{ r.destination }}' +
  "{% if r.action == 'next-hop' %} next-hop {{ r.next_hop }}{% endif %}" +
  "{% if r.action == 'discard' %} discard{% endif %}" +
  "{% if r.action == 'reject' %} reject{% endif %}" +
  '{% if r.metric %} metric {{ r.metric }}{% endif %}' +
  "{{ '\\n' }}{% endfor %}";

export const task: TaskModule = {
  definition: {
    slug: 'junos-static-routes',
    title: 'Juniper Junos static routes',
    description:
      'Generate Ansible group_vars and Juniper Junos static routes — destination prefix with a next-hop, discard, or reject action and an optional metric — with an approximate device-config preview.',
    vendor: 'juniper-junos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.junos-static-routes.legend': 'Static routes',
      'task.junos-static-routes.field.routes.label': 'Routes',
      'task.junos-static-routes.field.routes.help':
        'One or more static routes under routing-options.',
      'task.junos-static-routes.routes.add': 'Add route',
      'task.junos-static-routes.routes.item': 'Route {index}',
      'task.junos-static-routes.routes.remove': 'Remove route {index}',
      'task.junos-static-routes.field.destination.label': 'Destination',
      'task.junos-static-routes.field.destination.help':
        'Destination prefix in CIDR, e.g. 10.0.0.0/24 or 0.0.0.0/0 for a default route.',
      'task.junos-static-routes.field.action.label': 'Action',
      'task.junos-static-routes.field.action.help':
        'Forward to a next-hop, or silently discard / reject (send unreachable) the traffic.',
      'task.junos-static-routes.action.next-hop': 'Next-hop',
      'task.junos-static-routes.action.discard': 'Discard',
      'task.junos-static-routes.action.reject': 'Reject',
      'task.junos-static-routes.field.next_hop.label': 'Next-hop',
      'task.junos-static-routes.field.next_hop.help':
        'Gateway IP for a next-hop route, e.g. 192.168.1.1. Ignored for discard/reject; omitted when blank.',
      'task.junos-static-routes.field.metric.label': 'Metric',
      'task.junos-static-routes.field.metric.help':
        'Optional route metric (0–65535). Omitted from the vars when blank.',
    },
    fr: {
      'task.junos-static-routes.legend': 'Routes statiques',
      'task.junos-static-routes.field.routes.label': 'Routes',
      'task.junos-static-routes.field.routes.help':
        'Une ou plusieurs routes statiques sous routing-options.',
      'task.junos-static-routes.routes.add': 'Ajouter une route',
      'task.junos-static-routes.routes.item': 'Route {index}',
      'task.junos-static-routes.routes.remove': 'Supprimer la route {index}',
      'task.junos-static-routes.field.destination.label': 'Destination',
      'task.junos-static-routes.field.destination.help':
        'Préfixe de destination en CIDR, par ex. 10.0.0.0/24 ou 0.0.0.0/0 pour une route par défaut.',
      'task.junos-static-routes.field.action.label': 'Action',
      'task.junos-static-routes.field.action.help':
        'Transférer vers un saut suivant, ou abandonner (discard) / rejeter (reject) le trafic.',
      'task.junos-static-routes.action.next-hop': 'Saut suivant',
      'task.junos-static-routes.action.discard': 'Abandonner',
      'task.junos-static-routes.action.reject': 'Rejeter',
      'task.junos-static-routes.field.next_hop.label': 'Saut suivant',
      'task.junos-static-routes.field.next_hop.help':
        'IP de passerelle pour une route next-hop, par ex. 192.168.1.1. Ignoré pour discard/reject ; omis si vide.',
      'task.junos-static-routes.field.metric.label': 'Métrique',
      'task.junos-static-routes.field.metric.help':
        'Métrique de route facultative (0–65535). Omise des variables si vide.',
    },
  },
};
