/**
 * Curated task: Juniper Junos OSPF (issue #52).
 *
 * Junos config is `set`-style / hierarchical rather than Cisco line CLI, so —
 * like the Cradlepoint device class (#40) and per the #36 preview-model record
 * (`docs/design/non-cli-preview.md`) — this is a native task family
 * (`vendor: 'juniper-junos'`) whose template emits the platform's native `set …`
 * form: `set protocols ospf area <a> interface <i>`, plus an optional global
 * reference-bandwidth and a per-interface `passive` flag.
 *
 * Honesty (council §4 + #40): the YAML vars come straight from the values and are
 * ALWAYS correct. The preview is authored from public Junos docs and is not
 * device-verified, so the task declares `fidelityFloor: 'approximate'`: the
 * workbench/build clamp the render down so the pane always shows the degrade
 * notice and the preview never claims `exact`. The `{{ '\n' }}`-free lines end on
 * content before each block tag, so Ansible's trim_blocks keeps the breaks.
 * Authored from generic public knowledge — no employer config.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.junos-ospf.legend',
      fields: [
        {
          type: 'text',
          name: 'reference_bandwidth',
          label: 'task.junos-ospf.field.reference_bandwidth.label',
          help: 'task.junos-ospf.field.reference_bandwidth.help',
          placeholder: '10g',
          omitWhenBlank: true,
        },
        {
          type: 'list',
          name: 'interfaces',
          label: 'task.junos-ospf.field.interfaces.label',
          help: 'task.junos-ospf.field.interfaces.help',
          required: true,
          minRows: 1,
          addLabel: 'task.junos-ospf.interfaces.add',
          removeLabel: 'task.junos-ospf.interfaces.remove',
          itemLabel: 'task.junos-ospf.interfaces.item',
          fields: [
            {
              type: 'text',
              name: 'interface',
              label: 'task.junos-ospf.field.interface.label',
              help: 'task.junos-ospf.field.interface.help',
              required: true,
              placeholder: 'ge-0/0/0.0',
            },
            {
              type: 'text',
              name: 'area',
              label: 'task.junos-ospf.field.area.label',
              help: 'task.junos-ospf.field.area.help',
              required: true,
              placeholder: '0',
            },
            {
              type: 'boolean',
              name: 'passive',
              label: 'task.junos-ospf.field.passive.label',
              help: 'task.junos-ospf.field.passive.help',
              default: false,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Junos `set` form (preview-only, approximate). One area/interface line
// per row, plus an optional global reference-bandwidth and per-interface passive.
const template = [
  '{% if reference_bandwidth %}set protocols ospf reference-bandwidth {{ reference_bandwidth }}',
  '{% endif %}{% for i in interfaces %}set protocols ospf area {{ i.area }} interface {{ i.interface }}',
  '{% if i.passive %}set protocols ospf area {{ i.area }} interface {{ i.interface }} passive',
  '{% endif %}{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'junos-ospf',
    title: 'Juniper Junos OSPF',
    description:
      'Generate Ansible host_vars and a Juniper Junos OSPF configuration — interfaces by area, an optional reference bandwidth, and per-interface passive mode — with an approximate device-config preview.',
    vendor: 'juniper-junos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.junos-ospf.legend': 'OSPF',
      'task.junos-ospf.field.reference_bandwidth.label': 'Reference bandwidth',
      'task.junos-ospf.field.reference_bandwidth.help':
        'Optional OSPF reference bandwidth, e.g. 10g. Omitted from the vars when blank.',
      'task.junos-ospf.field.interfaces.label': 'Interfaces',
      'task.junos-ospf.field.interfaces.help':
        'One or more interfaces to run OSPF on, each placed in an area.',
      'task.junos-ospf.interfaces.add': 'Add interface',
      'task.junos-ospf.interfaces.item': 'Interface {index}',
      'task.junos-ospf.interfaces.remove': 'Remove interface {index}',
      'task.junos-ospf.field.interface.label': 'Interface',
      'task.junos-ospf.field.interface.help': 'Junos interface unit, e.g. ge-0/0/0.0.',
      'task.junos-ospf.field.area.label': 'Area',
      'task.junos-ospf.field.area.help': 'OSPF area, e.g. 0 or 0.0.0.0.',
      'task.junos-ospf.field.passive.label': 'Passive',
      'task.junos-ospf.field.passive.help':
        'When on, advertise the interface but send no OSPF hellos on it.',
    },
    fr: {
      'task.junos-ospf.legend': 'OSPF',
      'task.junos-ospf.field.reference_bandwidth.label': 'Bande passante de référence',
      'task.junos-ospf.field.reference_bandwidth.help':
        'Bande passante de référence OSPF facultative, par ex. 10g. Omise des variables si vide.',
      'task.junos-ospf.field.interfaces.label': 'Interfaces',
      'task.junos-ospf.field.interfaces.help':
        'Une ou plusieurs interfaces sur lesquelles activer OSPF, chacune placée dans une aire.',
      'task.junos-ospf.interfaces.add': 'Ajouter une interface',
      'task.junos-ospf.interfaces.item': 'Interface {index}',
      'task.junos-ospf.interfaces.remove': 'Supprimer l’interface {index}',
      'task.junos-ospf.field.interface.label': 'Interface',
      'task.junos-ospf.field.interface.help': 'Unité d’interface Junos, par ex. ge-0/0/0.0.',
      'task.junos-ospf.field.area.label': 'Aire',
      'task.junos-ospf.field.area.help': 'Aire OSPF, par ex. 0 ou 0.0.0.0.',
      'task.junos-ospf.field.passive.label': 'Passive',
      'task.junos-ospf.field.passive.help':
        'Si activé, annoncer l’interface sans envoyer de paquets hello OSPF.',
    },
  },
};
