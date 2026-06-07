/**
 * Curated task: Cisco ASA network objects & object-group (issue #47).
 *
 * `object network …` definitions — the building blocks ACLs and NAT reference —
 * plus an optional `object-group network …` that bundles every object by name.
 * Built on the `list` field type (#20); its own ASA family (`vendor: 'cisco-asa'`),
 * not an overlay.
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the template uses no filters, so the preview is always `exact`.
 * Each object renders only the body line matching its `type`, and the `{{ '\n' }}`
 * terminators end each emitted line on an output token so Ansible's trim_blocks
 * keeps the break.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.asa-objects.legend',
      fields: [
        {
          type: 'list',
          name: 'objects',
          label: 'task.asa-objects.field.objects.label',
          help: 'task.asa-objects.field.objects.help',
          required: true,
          minRows: 1,
          addLabel: 'task.asa-objects.objects.add',
          removeLabel: 'task.asa-objects.objects.remove',
          itemLabel: 'task.asa-objects.objects.item',
          fields: [
            {
              type: 'text',
              name: 'name',
              label: 'task.asa-objects.field.name.label',
              help: 'task.asa-objects.field.name.help',
              required: true,
              placeholder: 'WEB-SERVER',
            },
            {
              type: 'select',
              name: 'type',
              label: 'task.asa-objects.field.type.label',
              help: 'task.asa-objects.field.type.help',
              default: 'host',
              options: [
                { value: 'host', label: 'task.asa-objects.type.host' },
                { value: 'subnet', label: 'task.asa-objects.type.subnet' },
                { value: 'range', label: 'task.asa-objects.type.range' },
                { value: 'fqdn', label: 'task.asa-objects.type.fqdn' },
              ],
            },
            {
              type: 'text',
              name: 'value',
              label: 'task.asa-objects.field.value.label',
              help: 'task.asa-objects.field.value.help',
              required: true,
              placeholder: '203.0.113.10',
            },
            {
              type: 'text',
              name: 'description',
              label: 'task.asa-objects.field.description.label',
              help: 'task.asa-objects.field.description.help',
              placeholder: 'Public web server',
              omitWhenBlank: true,
            },
          ],
        },
        {
          type: 'text',
          name: 'group_name',
          label: 'task.asa-objects.field.group_name.label',
          help: 'task.asa-objects.field.group_name.help',
          placeholder: 'WEB-SERVERS',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco ASA. One `object network NAME` block per row (body keyed by
// type), then an optional `object-group network` bundling every object by name.
const template =
  '{% for o in objects %}' +
  "object network {{ o.name }}{{ '\\n' }}" +
  "{% if o.type == 'host' %} host {{ o.value }}{{ '\\n' }}{% endif %}" +
  "{% if o.type == 'subnet' %} subnet {{ o.value }}{{ '\\n' }}{% endif %}" +
  "{% if o.type == 'range' %} range {{ o.value }}{{ '\\n' }}{% endif %}" +
  "{% if o.type == 'fqdn' %} fqdn {{ o.value }}{{ '\\n' }}{% endif %}" +
  "{% if o.description %} description {{ o.description }}{{ '\\n' }}{% endif %}" +
  '{% endfor %}' +
  "{% if group_name %}object-group network {{ group_name }}{{ '\\n' }}" +
  "{% for o in objects %} network-object object {{ o.name }}{{ '\\n' }}{% endfor %}{% endif %}";

export const task: TaskModule = {
  definition: {
    slug: 'asa-objects',
    title: 'Cisco ASA network objects & object-group',
    description:
      'Generate Ansible group_vars and Cisco ASA network objects — host, subnet, range, or FQDN — plus an optional object-group that bundles them, with a live device-CLI preview.',
    vendor: 'cisco-asa',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.asa-objects.legend': 'Network objects',
      'task.asa-objects.field.objects.label': 'Objects',
      'task.asa-objects.field.objects.help':
        'One or more named network objects that ACLs, NAT, and groups can reference.',
      'task.asa-objects.objects.add': 'Add object',
      'task.asa-objects.objects.item': 'Object {index}',
      'task.asa-objects.objects.remove': 'Remove object {index}',
      'task.asa-objects.field.name.label': 'Object name',
      'task.asa-objects.field.name.help': 'Name referenced elsewhere, e.g. WEB-SERVER.',
      'task.asa-objects.field.type.label': 'Type',
      'task.asa-objects.field.type.help':
        'host (one IP), subnet (network + mask), range (start end), or fqdn (a hostname).',
      'task.asa-objects.field.value.label': 'Value',
      'task.asa-objects.field.value.help':
        'Matches the type: 203.0.113.10 (host), 10.0.0.0 255.255.255.0 (subnet), 10.0.0.1 10.0.0.10 (range), or www.example.com (fqdn).',
      'task.asa-objects.field.description.label': 'Description',
      'task.asa-objects.field.description.help':
        'Optional description for this object. Omitted from the vars when blank.',
      'task.asa-objects.type.host': 'Host',
      'task.asa-objects.type.subnet': 'Subnet',
      'task.asa-objects.type.range': 'Range',
      'task.asa-objects.type.fqdn': 'FQDN',
      'task.asa-objects.field.group_name.label': 'Object-group name',
      'task.asa-objects.field.group_name.help':
        'Optional. When set, bundle every object above into object-group network <name>. Omitted when blank.',
    },
    fr: {
      'task.asa-objects.legend': 'Objets réseau',
      'task.asa-objects.field.objects.label': 'Objets',
      'task.asa-objects.field.objects.help':
        'Un ou plusieurs objets réseau nommés, référençables par les ACL, le NAT et les groupes.',
      'task.asa-objects.objects.add': 'Ajouter un objet',
      'task.asa-objects.objects.item': 'Objet {index}',
      'task.asa-objects.objects.remove': 'Supprimer l’objet {index}',
      'task.asa-objects.field.name.label': 'Nom de l’objet',
      'task.asa-objects.field.name.help': 'Nom référencé ailleurs, par ex. WEB-SERVER.',
      'task.asa-objects.field.type.label': 'Type',
      'task.asa-objects.field.type.help':
        'host (une IP), subnet (réseau + masque), range (début fin) ou fqdn (un nom d’hôte).',
      'task.asa-objects.field.value.label': 'Valeur',
      'task.asa-objects.field.value.help':
        'Selon le type : 203.0.113.10 (host), 10.0.0.0 255.255.255.0 (subnet), 10.0.0.1 10.0.0.10 (range) ou www.example.com (fqdn).',
      'task.asa-objects.field.description.label': 'Description',
      'task.asa-objects.field.description.help':
        'Description facultative de cet objet. Omise des variables si vide.',
      'task.asa-objects.type.host': 'Host',
      'task.asa-objects.type.subnet': 'Subnet',
      'task.asa-objects.type.range': 'Range',
      'task.asa-objects.type.fqdn': 'FQDN',
      'task.asa-objects.field.group_name.label': 'Nom de l’object-group',
      'task.asa-objects.field.group_name.help':
        'Facultatif. Si renseigné, regroupe tous les objets ci-dessus dans object-group network <nom>. Omis si vide.',
    },
  },
};
