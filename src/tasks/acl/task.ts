/**
 * ACL — Cisco IOS extended access-list (issue #10).
 *
 * The canonical `list`-of-records task (the #1 amendment): each access-list
 * entry is a record (action / protocol / source / destination), rendered with a
 * `{% for %}` loop and attribute access. No filters, so the preview is `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../types';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.acl.group.acl',
      fields: [
        {
          type: 'text',
          name: 'acl_name',
          label: 'task.acl.field.acl_name.label',
          help: 'task.acl.field.acl_name.help',
          required: true,
          default: 'BLOCK_RFC1918',
          placeholder: 'BLOCK_RFC1918',
        },
        {
          type: 'list',
          name: 'acl_entries',
          label: 'task.acl.field.acl_entries.label',
          help: 'task.acl.field.acl_entries.help',
          addLabel: 'task.acl.field.acl_entries.add',
          required: true,
          default: [
            { action: 'permit', protocol: 'ip', source: '10.0.0.0 0.0.0.255', destination: 'any' },
          ],
          item: [
            {
              type: 'select',
              name: 'action',
              label: 'task.acl.field.acl_entries.action.label',
              default: 'permit',
              options: [
                { value: 'permit', label: 'task.acl.field.acl_entries.action.permit' },
                { value: 'deny', label: 'task.acl.field.acl_entries.action.deny' },
              ],
            },
            {
              type: 'select',
              name: 'protocol',
              label: 'task.acl.field.acl_entries.protocol.label',
              default: 'ip',
              options: [
                { value: 'ip', label: 'task.acl.field.acl_entries.protocol.ip' },
                { value: 'tcp', label: 'task.acl.field.acl_entries.protocol.tcp' },
                { value: 'udp', label: 'task.acl.field.acl_entries.protocol.udp' },
                { value: 'icmp', label: 'task.acl.field.acl_entries.protocol.icmp' },
              ],
            },
            {
              type: 'text',
              name: 'source',
              label: 'task.acl.field.acl_entries.source.label',
              required: true,
              placeholder: '10.0.0.0 0.0.0.255',
            },
            {
              type: 'text',
              name: 'destination',
              label: 'task.acl.field.acl_entries.destination.label',
              required: true,
              default: 'any',
              placeholder: 'any',
            },
          ],
        },
      ],
    },
  ],
};

const template = [
  'ip access-list extended {{ acl_name }}',
  '{% for e in acl_entries %}',
  ' {{ e.action }} {{ e.protocol }} {{ e.source }} {{ e.destination }}',
  '{% endfor %}',
  '',
].join('\n');

const aclTask: TaskModule = {
  task: {
    slug: 'acl',
    title: 'Access list / ACL (Cisco IOS)',
    description:
      'Fill a short form and get valid Ansible group_vars plus a live Cisco IOS extended access-list: name it and add any number of permit/deny entries. Client-side and zero-egress.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'firewalls' },
  },
  messages: {
    en: {
      'task.acl.group.acl': 'Access list',

      'task.acl.field.acl_name.label': 'ACL name',
      'task.acl.field.acl_name.help': 'The named extended access-list, e.g. BLOCK_RFC1918.',

      'task.acl.field.acl_entries.label': 'Entries',
      'task.acl.field.acl_entries.help': 'Rules are applied top-to-bottom; order matters.',
      'task.acl.field.acl_entries.add': 'Add entry',
      'task.acl.field.acl_entries.action.label': 'Action',
      'task.acl.field.acl_entries.action.permit': 'permit',
      'task.acl.field.acl_entries.action.deny': 'deny',
      'task.acl.field.acl_entries.protocol.label': 'Protocol',
      'task.acl.field.acl_entries.protocol.ip': 'ip',
      'task.acl.field.acl_entries.protocol.tcp': 'tcp',
      'task.acl.field.acl_entries.protocol.udp': 'udp',
      'task.acl.field.acl_entries.protocol.icmp': 'icmp',
      'task.acl.field.acl_entries.source.label': 'Source',
      'task.acl.field.acl_entries.destination.label': 'Destination',
    },
  },
};

export default aclTask;
