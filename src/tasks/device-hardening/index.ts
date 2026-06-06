/**
 * Curated task: Cisco IOS device hardening toggles (issue #23).
 *
 * Generic management-plane safeguards built from PUBLIC Cisco hardening / DISA
 * guidance. Each toggle is transparent: its help text names the exact line it
 * emits — this is a set of individually-reviewable options, NOT a magic "secure"
 * button, and it makes **no compliance or certification claim** and produces no
 * report artifact (that would invite egress — spine §). Cloned from the
 * interface-ip reference (#6); auto-registers via the registry.
 *
 * Correctness (council §4): the YAML vars come straight from the values and are
 * always correct; the template uses no filters, so the preview is always exact.
 * Booleans default to a sensible hardened baseline; the user toggles off anything
 * not wanted (CDP stays opt-in since disabling it can break discovery/voice).
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.device-hardening.legend',
      fields: [
        {
          type: 'boolean',
          name: 'service_password_encryption',
          label: 'task.device-hardening.field.service_password_encryption.label',
          help: 'task.device-hardening.field.service_password_encryption.help',
          default: true,
        },
        {
          type: 'number',
          name: 'password_min_length',
          label: 'task.device-hardening.field.password_min_length.label',
          help: 'task.device-hardening.field.password_min_length.help',
          min: 1,
          max: 127,
          omitWhenBlank: true,
        },
        {
          type: 'boolean',
          name: 'disable_http_server',
          label: 'task.device-hardening.field.disable_http_server.label',
          help: 'task.device-hardening.field.disable_http_server.help',
          default: true,
        },
        {
          type: 'boolean',
          name: 'disable_source_route',
          label: 'task.device-hardening.field.disable_source_route.label',
          help: 'task.device-hardening.field.disable_source_route.help',
          default: true,
        },
        {
          type: 'boolean',
          name: 'disable_cdp',
          label: 'task.device-hardening.field.disable_cdp.label',
          help: 'task.device-hardening.field.disable_cdp.help',
          default: false,
        },
        {
          type: 'boolean',
          name: 'tcp_keepalives',
          label: 'task.device-hardening.field.tcp_keepalives.label',
          help: 'task.device-hardening.field.tcp_keepalives.help',
          default: true,
        },
        {
          type: 'boolean',
          name: 'login_logging',
          label: 'task.device-hardening.field.login_logging.label',
          help: 'task.device-hardening.field.login_logging.help',
          default: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): each
// block's own newlines sit after its config lines (not after `{% endif %}`), so a
// disabled toggle contributes nothing and leaves no gap. No filters → exact.
const template = [
  '{% if service_password_encryption %}service password-encryption',
  '{% endif %}{% if password_min_length %}security passwords min-length {{ password_min_length }}',
  '{% endif %}{% if disable_http_server %}no ip http server',
  'no ip http secure-server',
  '{% endif %}{% if disable_source_route %}no ip source-route',
  '{% endif %}{% if disable_cdp %}no cdp run',
  '{% endif %}{% if tcp_keepalives %}service tcp-keepalives-in',
  'service tcp-keepalives-out',
  '{% endif %}{% if login_logging %}login on-failure log',
  'login on-success log',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'device-hardening',
    title: 'Cisco IOS device hardening',
    description:
      'Generate Ansible group_vars and a generic Cisco IOS hardening baseline — common management-plane safeguards, each shown as the exact configuration line it emits — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.device-hardening.legend': 'Hardening options',
      'task.device-hardening.field.service_password_encryption.label': 'Encrypt plaintext passwords',
      'task.device-hardening.field.service_password_encryption.help':
        'Emits `service password-encryption`.',
      'task.device-hardening.field.password_min_length.label': 'Minimum password length',
      'task.device-hardening.field.password_min_length.help':
        'Emits `security passwords min-length <n>` (1–127). Omitted when blank.',
      'task.device-hardening.field.disable_http_server.label': 'Disable the HTTP/HTTPS server',
      'task.device-hardening.field.disable_http_server.help':
        'Emits `no ip http server` and `no ip http secure-server`.',
      'task.device-hardening.field.disable_source_route.label': 'Disable IP source routing',
      'task.device-hardening.field.disable_source_route.help': 'Emits `no ip source-route`.',
      'task.device-hardening.field.disable_cdp.label': 'Disable CDP globally',
      'task.device-hardening.field.disable_cdp.help':
        'Emits `no cdp run`. Off by default — disabling CDP can affect device/voice discovery.',
      'task.device-hardening.field.tcp_keepalives.label': 'Enable TCP keepalives',
      'task.device-hardening.field.tcp_keepalives.help':
        'Emits `service tcp-keepalives-in` and `service tcp-keepalives-out`.',
      'task.device-hardening.field.login_logging.label': 'Log login attempts',
      'task.device-hardening.field.login_logging.help':
        'Emits `login on-failure log` and `login on-success log`.',
    },
    fr: {
      'task.device-hardening.legend': 'Options de durcissement',
      'task.device-hardening.field.service_password_encryption.label':
        'Chiffrer les mots de passe en clair',
      'task.device-hardening.field.service_password_encryption.help':
        'Émet `service password-encryption`.',
      'task.device-hardening.field.password_min_length.label': 'Longueur minimale du mot de passe',
      'task.device-hardening.field.password_min_length.help':
        'Émet `security passwords min-length <n>` (1–127). Omis si vide.',
      'task.device-hardening.field.disable_http_server.label': 'Désactiver le serveur HTTP/HTTPS',
      'task.device-hardening.field.disable_http_server.help':
        'Émet `no ip http server` et `no ip http secure-server`.',
      'task.device-hardening.field.disable_source_route.label': 'Désactiver le routage par la source',
      'task.device-hardening.field.disable_source_route.help': 'Émet `no ip source-route`.',
      'task.device-hardening.field.disable_cdp.label': 'Désactiver CDP globalement',
      'task.device-hardening.field.disable_cdp.help':
        'Émet `no cdp run`. Désactivé par défaut — couper CDP peut affecter la découverte d’équipements/voix.',
      'task.device-hardening.field.tcp_keepalives.label': 'Activer les keepalives TCP',
      'task.device-hardening.field.tcp_keepalives.help':
        'Émet `service tcp-keepalives-in` et `service tcp-keepalives-out`.',
      'task.device-hardening.field.login_logging.label': 'Journaliser les tentatives de connexion',
      'task.device-hardening.field.login_logging.help':
        'Émet `login on-failure log` et `login on-success log`.',
    },
  },
};
