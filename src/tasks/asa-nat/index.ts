/**
 * Curated task: Cisco ASA object (auto) NAT (issue #48).
 *
 * A network object with its NAT rule attached — the ASA "object NAT" / "auto NAT"
 * form: `object network NAME` carrying a `host`/`subnet` definition and a
 * `nat (real_if,mapped_if) static|dynamic MAPPED` line. Covers the two common
 * cases: a static one-to-one map (publish a host) and a dynamic PAT (hide a
 * subnet behind an interface). Companion to asa-interface / asa-acl (#38).
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the template uses no filters, so the device-CLI preview is
 * always `exact`. ASA is line-CLI, so no fidelity floor is needed. Authored from
 * public ASA knowledge — no employer config. Template authored for Ansible's
 * environment (trim_blocks=True). Manual / twice-NAT (`nat … source static …`)
 * is a structurally different statement and is intentionally out of this first
 * cut.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.asa-nat.legend',
      fields: [
        {
          type: 'text',
          name: 'object_name',
          label: 'task.asa-nat.field.object_name.label',
          help: 'task.asa-nat.field.object_name.help',
          required: true,
          placeholder: 'WEB-SERVER',
        },
        {
          type: 'select',
          name: 'real_type',
          label: 'task.asa-nat.field.real_type.label',
          help: 'task.asa-nat.field.real_type.help',
          default: 'host',
          options: [
            { value: 'host', label: 'task.asa-nat.real_type.host' },
            { value: 'subnet', label: 'task.asa-nat.real_type.subnet' },
          ],
        },
        {
          type: 'text',
          name: 'real_address',
          label: 'task.asa-nat.field.real_address.label',
          help: 'task.asa-nat.field.real_address.help',
          required: true,
          placeholder: '10.1.1.10',
        },
        {
          type: 'text',
          name: 'real_mask',
          label: 'task.asa-nat.field.real_mask.label',
          help: 'task.asa-nat.field.real_mask.help',
          placeholder: '255.255.255.0',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'real_if',
          label: 'task.asa-nat.field.real_if.label',
          help: 'task.asa-nat.field.real_if.help',
          required: true,
          placeholder: 'inside',
        },
        {
          type: 'text',
          name: 'mapped_if',
          label: 'task.asa-nat.field.mapped_if.label',
          help: 'task.asa-nat.field.mapped_if.help',
          required: true,
          placeholder: 'outside',
        },
        {
          type: 'select',
          name: 'nat_type',
          label: 'task.asa-nat.field.nat_type.label',
          help: 'task.asa-nat.field.nat_type.help',
          default: 'static',
          options: [
            { value: 'static', label: 'task.asa-nat.nat_type.static' },
            { value: 'dynamic', label: 'task.asa-nat.nat_type.dynamic' },
          ],
        },
        {
          type: 'text',
          name: 'mapped',
          label: 'task.asa-nat.field.mapped.label',
          help: 'task.asa-nat.field.mapped.help',
          required: true,
          placeholder: '203.0.113.10',
        },
      ],
    },
  ],
};

// Jinja2 → Cisco ASA object NAT. A host object takes no mask; a subnet object
// takes `subnet <addr> <mask>`. The nat line names both interfaces by nameif.
const template = [
  'object network {{ object_name }}',
  "{% if real_type == 'subnet' %} subnet {{ real_address }} {{ real_mask }}",
  '{% else %} host {{ real_address }}',
  '{% endif %} nat ({{ real_if }},{{ mapped_if }}) {{ nat_type }} {{ mapped }}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'asa-nat',
    title: 'Cisco ASA NAT (object NAT)',
    description:
      'Generate Ansible host_vars and a Cisco ASA object NAT rule — a network object with a static one-to-one map or a dynamic PAT — with a live device-CLI preview.',
    vendor: 'cisco-asa',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'asa1' },
  },
  messages: {
    en: {
      'task.asa-nat.legend': 'Object NAT',
      'task.asa-nat.field.object_name.label': 'Object name',
      'task.asa-nat.field.object_name.help': 'Name of the network object, e.g. WEB-SERVER.',
      'task.asa-nat.field.real_type.label': 'Real object type',
      'task.asa-nat.field.real_type.help': 'Whether the real object is a single host or a subnet.',
      'task.asa-nat.real_type.host': 'host',
      'task.asa-nat.real_type.subnet': 'subnet',
      'task.asa-nat.field.real_address.label': 'Real address',
      'task.asa-nat.field.real_address.help':
        'Real (private) address — a host IP, or a subnet network address.',
      'task.asa-nat.field.real_mask.label': 'Real subnet mask',
      'task.asa-nat.field.real_mask.help':
        'Subnet mask — for a subnet object only. Omitted from the vars when blank.',
      'task.asa-nat.field.real_if.label': 'Real interface',
      'task.asa-nat.field.real_if.help': 'Real interface name (nameif), e.g. inside.',
      'task.asa-nat.field.mapped_if.label': 'Mapped interface',
      'task.asa-nat.field.mapped_if.help': 'Mapped interface name (nameif), e.g. outside.',
      'task.asa-nat.field.nat_type.label': 'NAT type',
      'task.asa-nat.field.nat_type.help':
        'static maps to a fixed address; dynamic is PAT (e.g. the interface address).',
      'task.asa-nat.nat_type.static': 'static',
      'task.asa-nat.nat_type.dynamic': 'dynamic',
      'task.asa-nat.field.mapped.label': 'Mapped address',
      'task.asa-nat.field.mapped.help':
        'Mapped (public) address — a public IP for static, or interface / a pool for dynamic.',
    },
    fr: {
      'task.asa-nat.legend': 'NAT d’objet',
      'task.asa-nat.field.object_name.label': 'Nom de l’objet',
      'task.asa-nat.field.object_name.help': 'Nom de l’objet réseau, par ex. WEB-SERVER.',
      'task.asa-nat.field.real_type.label': 'Type d’objet réel',
      'task.asa-nat.field.real_type.help': 'Si l’objet réel est un hôte unique ou un sous-réseau.',
      'task.asa-nat.real_type.host': 'host',
      'task.asa-nat.real_type.subnet': 'subnet',
      'task.asa-nat.field.real_address.label': 'Adresse réelle',
      'task.asa-nat.field.real_address.help':
        'Adresse réelle (privée) — une IP d’hôte, ou une adresse réseau de sous-réseau.',
      'task.asa-nat.field.real_mask.label': 'Masque de sous-réseau réel',
      'task.asa-nat.field.real_mask.help':
        'Masque de sous-réseau — pour un objet sous-réseau uniquement. Omis des variables si vide.',
      'task.asa-nat.field.real_if.label': 'Interface réelle',
      'task.asa-nat.field.real_if.help': 'Nom d’interface réelle (nameif), par ex. inside.',
      'task.asa-nat.field.mapped_if.label': 'Interface mappée',
      'task.asa-nat.field.mapped_if.help': 'Nom d’interface mappée (nameif), par ex. outside.',
      'task.asa-nat.field.nat_type.label': 'Type de NAT',
      'task.asa-nat.field.nat_type.help':
        'static mappe vers une adresse fixe ; dynamic est du PAT (par ex. l’adresse de l’interface).',
      'task.asa-nat.nat_type.static': 'static',
      'task.asa-nat.nat_type.dynamic': 'dynamic',
      'task.asa-nat.field.mapped.label': 'Adresse mappée',
      'task.asa-nat.field.mapped.help':
        'Adresse mappée (publique) — une IP publique pour static, ou interface / un pool pour dynamic.',
    },
  },
};
