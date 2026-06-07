/**
 * Curated task: Cradlepoint NCOS static route (issue #40).
 *
 * Companion to `cradlepoint-lan`. Same non-line-CLI platform, same preview model
 * (#36): the NCOS config-CLI `set <path> <value>` form, addressed positionally
 * (index `0` = the first static route). See `cradlepoint-lan` for the full
 * rationale.
 *
 * Honesty (#40): the YAML vars are always correct; the preview is authored from
 * public NCOS docs and not device-verified, so the task declares
 * `fidelityFloor: 'approximate'` and the pane always shows the degrade notice.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.cradlepoint-static-route.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.cradlepoint-static-route.field.name.label',
          help: 'task.cradlepoint-static-route.field.name.help',
          required: true,
          placeholder: 'to-hq',
        },
        {
          type: 'text',
          name: 'dest',
          label: 'task.cradlepoint-static-route.field.dest.label',
          help: 'task.cradlepoint-static-route.field.dest.help',
          required: true,
          placeholder: '10.0.0.0/24',
        },
        {
          type: 'text',
          name: 'gateway',
          label: 'task.cradlepoint-static-route.field.gateway.label',
          help: 'task.cradlepoint-static-route.field.gateway.help',
          required: true,
          placeholder: '192.168.0.254',
        },
        {
          type: 'number',
          name: 'metric',
          label: 'task.cradlepoint-static-route.field.metric.label',
          help: 'task.cradlepoint-static-route.field.metric.help',
          min: 0,
          max: 255,
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cradlepoint NCOS config-CLI `set` form (preview-only, approximate).
// The destination is split into NCOS's network + netmask via the exact-tier
// ipaddr filter; the metric line appears only when filled.
const template = [
  'set routing/static/0/name {{ name }}',
  "set routing/static/0/ip_network {{ dest | ipaddr('network') }}",
  "set routing/static/0/netmask {{ dest | ipaddr('netmask') }}",
  'set routing/static/0/gateway {{ gateway }}',
  '{% if metric %}set routing/static/0/metric {{ metric }}',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'cradlepoint-static-route',
    title: 'Cradlepoint NCOS static route',
    description:
      'Generate Ansible host_vars and a Cradlepoint NCOS static route — destination network, gateway, and metric — with an approximate device-config preview.',
    vendor: 'cradlepoint-ncos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.cradlepoint-static-route.legend': 'Static route',
      'task.cradlepoint-static-route.field.name.label': 'Route name',
      'task.cradlepoint-static-route.field.name.help': 'Label for the route, e.g. to-hq.',
      'task.cradlepoint-static-route.field.dest.label': 'Destination network',
      'task.cradlepoint-static-route.field.dest.help':
        'Destination network with prefix, e.g. 10.0.0.0/24. Rendered as NCOS network + netmask.',
      'task.cradlepoint-static-route.field.gateway.label': 'Gateway',
      'task.cradlepoint-static-route.field.gateway.help': 'Next-hop IP, e.g. 192.168.0.254.',
      'task.cradlepoint-static-route.field.metric.label': 'Metric',
      'task.cradlepoint-static-route.field.metric.help':
        'Optional route metric (0–255). Omitted from the vars when blank.',
    },
    fr: {
      'task.cradlepoint-static-route.legend': 'Route statique',
      'task.cradlepoint-static-route.field.name.label': 'Nom de la route',
      'task.cradlepoint-static-route.field.name.help': 'Libellé de la route, par ex. to-hq.',
      'task.cradlepoint-static-route.field.dest.label': 'Réseau de destination',
      'task.cradlepoint-static-route.field.dest.help':
        'Réseau de destination avec préfixe, par ex. 10.0.0.0/24. Rendu en réseau + masque NCOS.',
      'task.cradlepoint-static-route.field.gateway.label': 'Passerelle',
      'task.cradlepoint-static-route.field.gateway.help':
        'IP du saut suivant, par ex. 192.168.0.254.',
      'task.cradlepoint-static-route.field.metric.label': 'Métrique',
      'task.cradlepoint-static-route.field.metric.help':
        'Métrique de route facultative (0–255). Omise des variables si vide.',
    },
  },
};
