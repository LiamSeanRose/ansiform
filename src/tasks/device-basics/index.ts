/**
 * Curated task: Cisco IOS device basics — SNMP / NTP / TACACS+ (issue #11).
 *
 * Cloned from the interface-ip reference (#6). A grab-bag of the management-plane
 * basics most devices need; every field is optional, so the form emits only the
 * blocks you fill in (`default(omit)` on every key).
 *
 * Secrets (§5): the SNMP community and the TACACS+ key are `secret` fields — a
 * read-only SNMP community string is a credential, and the TACACS+ key is one
 * outright. They are never seeded (no `default`), masked in the preview by the
 * workbench (#6), and — by design — present in the YAML the user then vaults.
 *
 * Correctness (council §4): the YAML vars come straight from the field values and
 * are always correct. The template uses no filters, so the device-CLI preview is
 * always `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

// Dotted IPv4, e.g. 192.0.2.10.
const IPV4 = '^(\\d{1,3}\\.){3}\\d{1,3}$';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.device-basics.legend.snmp',
      fields: [
        {
          type: 'secret',
          name: 'snmp_community',
          label: 'task.device-basics.field.snmp_community.label',
          help: 'task.device-basics.field.snmp_community.help',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'snmp_location',
          label: 'task.device-basics.field.snmp_location.label',
          help: 'task.device-basics.field.snmp_location.help',
          placeholder: 'HQ-IDF1',
          omitWhenBlank: true,
        },
      ],
    },
    {
      legend: 'task.device-basics.legend.ntp',
      fields: [
        {
          type: 'text',
          name: 'ntp_server',
          label: 'task.device-basics.field.ntp_server.label',
          help: 'task.device-basics.field.ntp_server.help',
          pattern: IPV4,
          placeholder: '192.0.2.10',
          omitWhenBlank: true,
        },
      ],
    },
    {
      legend: 'task.device-basics.legend.tacacs',
      fields: [
        {
          type: 'text',
          name: 'tacacs_server',
          label: 'task.device-basics.field.tacacs_server.label',
          help: 'task.device-basics.field.tacacs_server.help',
          pattern: IPV4,
          placeholder: '192.0.2.20',
          omitWhenBlank: true,
        },
        {
          type: 'secret',
          name: 'tacacs_key',
          label: 'task.device-basics.field.tacacs_key.label',
          help: 'task.device-basics.field.tacacs_key.help',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline after each `{% endif %}` is swallowed, so an unset block leaves no gap.
// Each feature renders only when its primary field is set; the TACACS+ key is its
// own line (modern `tacacs server` block), which also keeps preview newlines clean.
const template = [
  '{% if snmp_community %}snmp-server community {{ snmp_community }} RO',
  '{% endif %}{% if snmp_location %}snmp-server location {{ snmp_location }}',
  '{% endif %}{% if ntp_server %}ntp server {{ ntp_server }}',
  '{% endif %}{% if tacacs_server %}tacacs server TAC1',
  ' address ipv4 {{ tacacs_server }}',
  '{% if tacacs_key %} key {{ tacacs_key }}',
  '{% endif %}{% endif %}',
].join('\n');

// Arista EOS: SNMP/NTP lines match IOS (community uses lowercase `ro`), but
// TACACS+ is a flat `tacacs-server host <ip> key <key>` line rather than a named
// block. Verified exact against Arista's EOS manuals: `snmp-server community
// <name> ro`, `ntp server <ip>`, and a host TACACS+ line whose encryption-type
// digit is optional (so a bare cleartext key is valid).
const templateEos = [
  '{% if snmp_community %}snmp-server community {{ snmp_community }} ro',
  '{% endif %}{% if snmp_location %}snmp-server location {{ snmp_location }}',
  '{% endif %}{% if ntp_server %}ntp server {{ ntp_server }}',
  '{% endif %}{% if tacacs_server %}tacacs-server host {{ tacacs_server }}{% if tacacs_key %} key {{ tacacs_key }}{% endif %}',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'device-basics',
    title: 'Cisco IOS device basics (SNMP, NTP, TACACS+)',
    description:
      'Generate Ansible group_vars and Cisco IOS management-plane basics — SNMP community and location, NTP server, and a TACACS+ server with key — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE shares this management-plane CLI verbatim. EOS differs only in the
    // TACACS+ form and lowercase `ro`, verified exact against Arista's manuals (#34).
    templates: {
      'cisco-iosxe': template,
      'arista-eos': templateEos,
    },
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.device-basics.legend.snmp': 'SNMP',
      'task.device-basics.legend.ntp': 'NTP',
      'task.device-basics.legend.tacacs': 'TACACS+',
      'task.device-basics.field.snmp_community.label': 'SNMP community (read-only)',
      'task.device-basics.field.snmp_community.help':
        'Read-only SNMP community string. Treated as a secret — never stored or logged; omitted when blank.',
      'task.device-basics.field.snmp_location.label': 'SNMP location',
      'task.device-basics.field.snmp_location.help':
        'Optional sysLocation, e.g. HQ-IDF1. Omitted from the vars when left blank.',
      'task.device-basics.field.ntp_server.label': 'NTP server',
      'task.device-basics.field.ntp_server.help':
        'IPv4 address of an NTP server, e.g. 192.0.2.10. Omitted when blank.',
      'task.device-basics.field.tacacs_server.label': 'TACACS+ server',
      'task.device-basics.field.tacacs_server.help':
        'IPv4 address of a TACACS+ server, e.g. 192.0.2.20. Omitted when blank.',
      'task.device-basics.field.tacacs_key.label': 'TACACS+ key',
      'task.device-basics.field.tacacs_key.help':
        'Shared secret for the TACACS+ server. Never stored or logged; omitted when blank.',
    },
    fr: {
      'task.device-basics.legend.snmp': 'SNMP',
      'task.device-basics.legend.ntp': 'NTP',
      'task.device-basics.legend.tacacs': 'TACACS+',
      'task.device-basics.field.snmp_community.label': 'Communauté SNMP (lecture seule)',
      'task.device-basics.field.snmp_community.help':
        'Chaîne de communauté SNMP en lecture seule. Traitée comme un secret — jamais stockée ni journalisée ; omise si vide.',
      'task.device-basics.field.snmp_location.label': 'Emplacement SNMP',
      'task.device-basics.field.snmp_location.help':
        'sysLocation facultatif, par ex. HQ-IDF1. Omis des variables si laissé vide.',
      'task.device-basics.field.ntp_server.label': 'Serveur NTP',
      'task.device-basics.field.ntp_server.help':
        'Adresse IPv4 d’un serveur NTP, par ex. 192.0.2.10. Omise si vide.',
      'task.device-basics.field.tacacs_server.label': 'Serveur TACACS+',
      'task.device-basics.field.tacacs_server.help':
        'Adresse IPv4 d’un serveur TACACS+, par ex. 192.0.2.20. Omise si vide.',
      'task.device-basics.field.tacacs_key.label': 'Clé TACACS+',
      'task.device-basics.field.tacacs_key.help':
        'Secret partagé du serveur TACACS+. Jamais stocké ni journalisé ; omis si vide.',
    },
  },
};
