/**
 * Curated task: Cisco ASA interface — nameif / security-level / IP (issue #38).
 *
 * The ASA analog of the `interface-ip` reference (#6). ASA is line-CLI, so it
 * renders through the SAME Jinja2→device-CLI preview, but its config model is a
 * firewall's, not a router's: an interface carries a `nameif` and a
 * `security-level` alongside its address. So it is its own task family
 * (`vendor: 'cisco-asa'`), not a per-vendor overlay on an IOS interface.
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the preview uses only the `exact`-tier `ipaddr` filter (ASA
 * takes a dotted subnet mask, exactly what `ipaddr('netmask')` yields), so the
 * rendered CLI is `exact`. Authored from public ASA knowledge — no employer
 * config. Template authored for Ansible's environment (trim_blocks=True): the
 * newline after each `{% endif %}` is swallowed, so an absent description leaves
 * no gap.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.asa-interface.legend',
      fields: [
        {
          type: 'text',
          name: 'interface',
          label: 'task.asa-interface.field.interface.label',
          help: 'task.asa-interface.field.interface.help',
          required: true,
          placeholder: 'GigabitEthernet0/0',
        },
        {
          type: 'text',
          name: 'description',
          label: 'task.asa-interface.field.description.label',
          help: 'task.asa-interface.field.description.help',
          placeholder: 'Outside / ISP uplink',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'nameif',
          label: 'task.asa-interface.field.nameif.label',
          help: 'task.asa-interface.field.nameif.help',
          required: true,
          placeholder: 'outside',
        },
        {
          type: 'number',
          name: 'security_level',
          label: 'task.asa-interface.field.security_level.label',
          help: 'task.asa-interface.field.security_level.help',
          required: true,
          min: 0,
          max: 100,
        },
        {
          type: 'text',
          name: 'ip_address',
          label: 'task.asa-interface.field.ip_address.label',
          help: 'task.asa-interface.field.ip_address.help',
          required: true,
          placeholder: '203.0.113.1/24',
        },
        {
          type: 'boolean',
          name: 'enabled',
          label: 'task.asa-interface.field.enabled.label',
          help: 'task.asa-interface.field.enabled.help',
          default: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco ASA. ASA brings the interface up with `no shutdown` (its ports
// default to administratively down), and addresses it with a dotted mask.
const template = [
  'interface {{ interface }}',
  '{% if description %} description {{ description }}',
  '{% endif %} nameif {{ nameif }}',
  ' security-level {{ security_level }}',
  " ip address {{ ip_address | ipaddr('address') }} {{ ip_address | ipaddr('netmask') }}",
  '{% if enabled %} no shutdown',
  '{% else %} shutdown',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'asa-interface',
    title: 'Cisco ASA interface',
    description:
      'Generate Ansible host_vars and a Cisco ASA interface configuration — nameif, security-level, IPv4 address, and admin state — with a live device-CLI preview.',
    vendor: 'cisco-asa',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'asa1' },
  },
  messages: {
    en: {
      'task.asa-interface.legend': 'Interface',
      'task.asa-interface.field.interface.label': 'Interface',
      'task.asa-interface.field.interface.help':
        'The physical or logical interface, e.g. GigabitEthernet0/0.',
      'task.asa-interface.field.description.label': 'Description',
      'task.asa-interface.field.description.help':
        'Optional interface description. Omitted from the vars when left blank.',
      'task.asa-interface.field.nameif.label': 'Interface name (nameif)',
      'task.asa-interface.field.nameif.help':
        'The logical name traffic policy refers to, e.g. outside, inside, dmz.',
      'task.asa-interface.field.security_level.label': 'Security level',
      'task.asa-interface.field.security_level.help':
        'Trust level 0–100; higher is more trusted (inside is typically 100, outside 0).',
      'task.asa-interface.field.ip_address.label': 'IP address',
      'task.asa-interface.field.ip_address.help':
        'IPv4 address with prefix, e.g. 203.0.113.1/24. Rendered as ASA address + mask.',
      'task.asa-interface.field.enabled.label': 'Administratively enabled',
      'task.asa-interface.field.enabled.help':
        'ASA ports default to shut; when off, the interface is shut down.',
    },
    fr: {
      'task.asa-interface.legend': 'Interface',
      'task.asa-interface.field.interface.label': 'Interface',
      'task.asa-interface.field.interface.help':
        'L’interface physique ou logique, par ex. GigabitEthernet0/0.',
      'task.asa-interface.field.description.label': 'Description',
      'task.asa-interface.field.description.help':
        'Description facultative de l’interface. Omise des variables si laissée vide.',
      'task.asa-interface.field.nameif.label': 'Nom d’interface (nameif)',
      'task.asa-interface.field.nameif.help':
        'Le nom logique utilisé par la politique de trafic, par ex. outside, inside, dmz.',
      'task.asa-interface.field.security_level.label': 'Niveau de sécurité',
      'task.asa-interface.field.security_level.help':
        'Niveau de confiance 0–100 ; plus élevé = plus de confiance (inside souvent 100, outside 0).',
      'task.asa-interface.field.ip_address.label': 'Adresse IP',
      'task.asa-interface.field.ip_address.help':
        'Adresse IPv4 avec préfixe, par ex. 203.0.113.1/24. Rendue en adresse + masque ASA.',
      'task.asa-interface.field.enabled.label': 'Activée administrativement',
      'task.asa-interface.field.enabled.help':
        'Les ports ASA sont arrêtés par défaut ; si désactivée, l’interface est arrêtée (shutdown).',
    },
  },
};
