/**
 * VLAN definition — Cisco IOS (issue #7).
 *
 * Curated, correct-by-construction task built on the #6 pattern: clone the
 * folder, declare a scalar `FormSchema`, a device-CLI `template`, route/SEO meta,
 * and co-located copy. All fields are scalar and the template uses no filters, so
 * the preview is `exact` (empty filter set resolves to `exact`) and the YAML is
 * byte-correct.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../types';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.vlan.group.vlan',
      fields: [
        {
          type: 'number',
          name: 'vlan_id',
          label: 'task.vlan.field.vlan_id.label',
          help: 'task.vlan.field.vlan_id.help',
          required: true,
          default: 10,
          min: 1,
          max: 4094,
        },
        {
          type: 'text',
          name: 'vlan_name',
          label: 'task.vlan.field.vlan_name.label',
          help: 'task.vlan.field.vlan_name.help',
          required: true,
          default: 'DATA',
          placeholder: 'DATA',
        },
        {
          type: 'select',
          name: 'vlan_state',
          label: 'task.vlan.field.vlan_state.label',
          help: 'task.vlan.field.vlan_state.help',
          default: 'active',
          options: [
            { value: 'active', label: 'task.vlan.field.vlan_state.option.active' },
            { value: 'suspend', label: 'task.vlan.field.vlan_state.option.suspend' },
          ],
        },
      ],
    },
  ],
};

const template = ['vlan {{ vlan_id }}', ' name {{ vlan_name }}', ' state {{ vlan_state }}', ''].join(
  '\n',
);

const vlanTask: TaskModule = {
  task: {
    slug: 'vlan',
    title: 'VLAN definition (Cisco IOS)',
    description:
      'Fill a short form and get valid Ansible group_vars plus a live Cisco IOS VLAN definition: id, name and state. Client-side and zero-egress.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'switches' },
  },
  messages: {
    en: {
      'task.vlan.group.vlan': 'VLAN',

      'task.vlan.field.vlan_id.label': 'VLAN ID',
      'task.vlan.field.vlan_id.help': 'The 802.1Q VLAN number, 1–4094.',

      'task.vlan.field.vlan_name.label': 'Name',
      'task.vlan.field.vlan_name.help': 'A short name for the VLAN, e.g. DATA or VOICE.',

      'task.vlan.field.vlan_state.label': 'State',
      'task.vlan.field.vlan_state.help': 'Whether the VLAN is active or administratively suspended.',
      'task.vlan.field.vlan_state.option.active': 'Active',
      'task.vlan.field.vlan_state.option.suspend': 'Suspended',
    },
  },
};

export default vlanTask;
