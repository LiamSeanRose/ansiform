/**
 * Curated task: Cisco IOS VLAN definition (issue #7).
 *
 * A VLAN database entry — id, name, state — at group scope (a VLAN database is
 * usually shared across a group of switches). Cloned from the `interface-ip`
 * reference pattern (#6); drop-in under `src/tasks/vlan/` so it auto-registers.
 *
 * Correctness model (council §4): the YAML vars come straight from the field
 * values and are always correct. The preview template uses **no filters at all**
 * (plain outputs plus a `state == 'suspend'` comparison), so it renders at
 * `exact` fidelity — the device CLI matches real Ansible output.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.vlan.legend',
      fields: [
        {
          type: 'number',
          name: 'vlan_id',
          label: 'task.vlan.field.vlan_id.label',
          help: 'task.vlan.field.vlan_id.help',
          required: true,
          min: 1,
          max: 4094,
        },
        {
          type: 'text',
          name: 'name',
          label: 'task.vlan.field.name.label',
          help: 'task.vlan.field.name.help',
          // Cisco IOS VLAN names are a single token, up to 32 characters.
          pattern: '^\\S{1,32}$',
          placeholder: 'SALES',
          omitWhenBlank: true,
        },
        {
          type: 'select',
          name: 'state',
          label: 'task.vlan.field.state.label',
          help: 'task.vlan.field.state.help',
          default: 'active',
          options: [
            { value: 'active', label: 'task.vlan.field.state.option.active' },
            { value: 'suspend', label: 'task.vlan.field.state.option.suspend' },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline after each `{% endif %}` is swallowed, so optional lines leave no gap.
// `state active` is the device default, so — like `show running-config` — only a
// suspended VLAN emits a state line.
const template = [
  'vlan {{ vlan_id }}',
  '{% if name %} name {{ name }}',
  "{% endif %}{% if state == 'suspend' %} state suspend",
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'vlan',
    title: 'Cisco IOS VLAN definition',
    description:
      'Generate Ansible group_vars and a Cisco IOS VLAN configuration — set the VLAN ID, name, and state — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'switches' },
  },
  messages: {
    en: {
      'task.vlan.legend': 'VLAN definition',
      'task.vlan.field.vlan_id.label': 'VLAN ID',
      'task.vlan.field.vlan_id.help': 'VLAN number (1–4094).',
      'task.vlan.field.name.label': 'Name',
      'task.vlan.field.name.help':
        'Optional VLAN name — a single token, up to 32 characters. Omitted from the vars when left blank.',
      'task.vlan.field.state.label': 'State',
      'task.vlan.field.state.help':
        'Active VLANs forward traffic; suspended VLANs are defined but do not. Cisco IOS omits the line for the default (active) state.',
      'task.vlan.field.state.option.active': 'Active',
      'task.vlan.field.state.option.suspend': 'Suspended',
    },
    fr: {
      'task.vlan.legend': 'Définition de VLAN',
      'task.vlan.field.vlan_id.label': 'ID de VLAN',
      'task.vlan.field.vlan_id.help': 'Numéro de VLAN (1–4094).',
      'task.vlan.field.name.label': 'Nom',
      'task.vlan.field.name.help':
        'Nom de VLAN facultatif — un seul mot, jusqu’à 32 caractères. Omis des variables si laissé vide.',
      'task.vlan.field.state.label': 'État',
      'task.vlan.field.state.help':
        'Les VLAN actifs acheminent le trafic ; les VLAN suspendus sont définis mais ne le font pas. Cisco IOS omet la ligne pour l’état par défaut (actif).',
      'task.vlan.field.state.option.active': 'Actif',
      'task.vlan.field.state.option.suspend': 'Suspendu',
    },
  },
};
