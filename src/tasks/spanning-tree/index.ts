/**
 * Curated task: spanning-tree mode, per-VLAN priority, and edge-port defaults
 * (issue #59).
 *
 * The STP mode, the per-VLAN bridge priority (which switch is root for a VLAN),
 * and the global edge-port safety defaults (portfast + BPDU guard). Built on the
 * `list` field type (#20) for the priorities table.
 *
 * Multi-vendor (#27): IOS-XE renders identical CLI (exact reuse). NX-OS diverges —
 * edge ports are `spanning-tree port type edge …`, not `portfast` — so its
 * overlay is flagged `approximate`. No filters → the base renders `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.spanning-tree.legend',
      fields: [
        {
          type: 'select',
          name: 'mode',
          label: 'task.spanning-tree.field.mode.label',
          help: 'task.spanning-tree.field.mode.help',
          default: 'rapid-pvst',
          options: [
            { value: 'rapid-pvst', label: 'task.spanning-tree.mode.rapid-pvst' },
            { value: 'pvst', label: 'task.spanning-tree.mode.pvst' },
            { value: 'mst', label: 'task.spanning-tree.mode.mst' },
          ],
        },
        {
          type: 'list',
          name: 'priorities',
          label: 'task.spanning-tree.field.priorities.label',
          help: 'task.spanning-tree.field.priorities.help',
          required: true,
          minRows: 1,
          addLabel: 'task.spanning-tree.priorities.add',
          removeLabel: 'task.spanning-tree.priorities.remove',
          itemLabel: 'task.spanning-tree.priorities.item',
          fields: [
            {
              type: 'number',
              name: 'vlan_id',
              label: 'task.spanning-tree.field.vlan_id.label',
              help: 'task.spanning-tree.field.vlan_id.help',
              required: true,
              min: 1,
              max: 4094,
            },
            {
              type: 'number',
              name: 'priority',
              label: 'task.spanning-tree.field.priority.label',
              help: 'task.spanning-tree.field.priority.help',
              required: true,
              min: 0,
              max: 61440,
            },
          ],
        },
        {
          type: 'boolean',
          name: 'portfast_default',
          label: 'task.spanning-tree.field.portfast_default.label',
          help: 'task.spanning-tree.field.portfast_default.help',
          default: false,
        },
        {
          type: 'boolean',
          name: 'bpduguard_default',
          label: 'task.spanning-tree.field.bpduguard_default.label',
          help: 'task.spanning-tree.field.bpduguard_default.help',
          default: false,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Mode, then one priority line per VLAN, then the optional
// global edge-port defaults.
const template = [
  'spanning-tree mode {{ mode }}',
  '{% for p in priorities %}spanning-tree vlan {{ p.vlan_id }} priority {{ p.priority }}',
  '{% endfor %}{% if portfast_default %}spanning-tree portfast default',
  '{% endif %}{% if bpduguard_default %}spanning-tree portfast bpduguard default',
  '{% endif %}',
].join('\n');

// NX-OS edge ports use `spanning-tree port type edge …` instead of `portfast`
// (mode/priority are identical). Authored from public docs, not device-verified,
// so the overlay is flagged approximate.
const nxosTemplate = [
  'spanning-tree mode {{ mode }}',
  '{% for p in priorities %}spanning-tree vlan {{ p.vlan_id }} priority {{ p.priority }}',
  '{% endfor %}{% if portfast_default %}spanning-tree port type edge default',
  '{% endif %}{% if bpduguard_default %}spanning-tree port type edge bpduguard default',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'spanning-tree',
    title: 'Cisco IOS spanning-tree',
    description:
      'Generate Ansible group_vars and a Cisco IOS spanning-tree configuration — mode, per-VLAN bridge priority, and edge-port (portfast / BPDU guard) defaults — with a live device-CLI preview.',
    schema,
    template,
    templates: {
      'cisco-iosxe': template,
      'cisco-nxos': { template: nxosTemplate, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'group', name: 'switches' },
  },
  messages: {
    en: {
      'task.spanning-tree.legend': 'Spanning-tree',
      'task.spanning-tree.field.mode.label': 'Mode',
      'task.spanning-tree.field.mode.help': 'Spanning-tree protocol mode.',
      'task.spanning-tree.mode.rapid-pvst': 'Rapid-PVST+',
      'task.spanning-tree.mode.pvst': 'PVST+',
      'task.spanning-tree.mode.mst': 'MST',
      'task.spanning-tree.field.priorities.label': 'Per-VLAN priority',
      'task.spanning-tree.field.priorities.help':
        'Bridge priority per VLAN — a lower value wins the root election for that VLAN.',
      'task.spanning-tree.priorities.add': 'Add VLAN priority',
      'task.spanning-tree.priorities.item': 'VLAN priority {index}',
      'task.spanning-tree.priorities.remove': 'Remove VLAN priority {index}',
      'task.spanning-tree.field.vlan_id.label': 'VLAN ID',
      'task.spanning-tree.field.vlan_id.help': 'VLAN number (1–4094).',
      'task.spanning-tree.field.priority.label': 'Priority',
      'task.spanning-tree.field.priority.help':
        'Bridge priority (0–61440, in steps of 4096). 4096 = a likely root.',
      'task.spanning-tree.field.portfast_default.label': 'Portfast on edge ports by default',
      'task.spanning-tree.field.portfast_default.help':
        'When on, emit spanning-tree portfast default so access ports skip the listening/learning delay.',
      'task.spanning-tree.field.bpduguard_default.label': 'BPDU guard on edge ports by default',
      'task.spanning-tree.field.bpduguard_default.help':
        'When on, emit BPDU guard on portfast ports so a switch plugged into an edge port is shut down.',
    },
    fr: {
      'task.spanning-tree.legend': 'Spanning-tree',
      'task.spanning-tree.field.mode.label': 'Mode',
      'task.spanning-tree.field.mode.help': 'Mode du protocole spanning-tree.',
      'task.spanning-tree.mode.rapid-pvst': 'Rapid-PVST+',
      'task.spanning-tree.mode.pvst': 'PVST+',
      'task.spanning-tree.mode.mst': 'MST',
      'task.spanning-tree.field.priorities.label': 'Priorité par VLAN',
      'task.spanning-tree.field.priorities.help':
        'Priorité de pont par VLAN — une valeur plus faible remporte l’élection de racine pour ce VLAN.',
      'task.spanning-tree.priorities.add': 'Ajouter une priorité de VLAN',
      'task.spanning-tree.priorities.item': 'Priorité de VLAN {index}',
      'task.spanning-tree.priorities.remove': 'Supprimer la priorité de VLAN {index}',
      'task.spanning-tree.field.vlan_id.label': 'ID de VLAN',
      'task.spanning-tree.field.vlan_id.help': 'Numéro de VLAN (1–4094).',
      'task.spanning-tree.field.priority.label': 'Priorité',
      'task.spanning-tree.field.priority.help':
        'Priorité de pont (0–61440, par pas de 4096). 4096 = racine probable.',
      'task.spanning-tree.field.portfast_default.label': 'Portfast par défaut sur les ports d’accès',
      'task.spanning-tree.field.portfast_default.help':
        'Si activé, émet spanning-tree portfast default pour que les ports d’accès évitent le délai d’écoute/apprentissage.',
      'task.spanning-tree.field.bpduguard_default.label': 'BPDU guard par défaut sur les ports d’accès',
      'task.spanning-tree.field.bpduguard_default.help':
        'Si activé, émet BPDU guard sur les ports portfast pour qu’un switch branché sur un port d’accès soit désactivé.',
    },
  },
};
