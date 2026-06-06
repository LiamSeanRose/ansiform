/**
 * Curated task: Cisco IOS NTP with authentication keys (issue #22).
 *
 * Two list-shaped tables on the #20 `list` field type: the MD5 authentication
 * keys, and the NTP servers that reference them by key id. The key material is a
 * `secret` sub-field (§5) — never seeded, masked in the preview, carried in the
 * YAML the user then vaults.
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — each list becomes a YAML sequence of per-row mappings
 * with omit-on-blank inside each row. No filters, so the preview is `exact`. The
 * server line ends in an optional `key`, so its newline is an explicit
 * `{{ '\n' }}` output that trim_blocks cannot swallow.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

// Dotted IPv4, e.g. 192.0.2.10.
const IPV4 = '^(\\d{1,3}\\.){3}\\d{1,3}$';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.ntp-auth.legend',
      fields: [
        {
          type: 'boolean',
          name: 'authenticate',
          label: 'task.ntp-auth.field.authenticate.label',
          help: 'task.ntp-auth.field.authenticate.help',
          default: true,
        },
        {
          type: 'list',
          name: 'keys',
          label: 'task.ntp-auth.field.keys.label',
          help: 'task.ntp-auth.field.keys.help',
          minRows: 1,
          addLabel: 'task.ntp-auth.field.keys.add',
          itemLabel: 'task.ntp-auth.field.keys.item',
          fields: [
            {
              type: 'number',
              name: 'id',
              label: 'task.ntp-auth.field.keys.id.label',
              help: 'task.ntp-auth.field.keys.id.help',
              required: true,
              min: 1,
              max: 65535,
            },
            {
              type: 'secret',
              name: 'secret',
              label: 'task.ntp-auth.field.keys.secret.label',
              help: 'task.ntp-auth.field.keys.secret.help',
            },
          ],
        },
        {
          type: 'list',
          name: 'servers',
          label: 'task.ntp-auth.field.servers.label',
          help: 'task.ntp-auth.field.servers.help',
          minRows: 1,
          addLabel: 'task.ntp-auth.field.servers.add',
          itemLabel: 'task.ntp-auth.field.servers.item',
          fields: [
            {
              type: 'text',
              name: 'host',
              label: 'task.ntp-auth.field.servers.host.label',
              help: 'task.ntp-auth.field.servers.host.help',
              required: true,
              pattern: IPV4,
              placeholder: '192.0.2.10',
            },
            {
              type: 'number',
              name: 'key_id',
              label: 'task.ntp-auth.field.servers.key_id.label',
              help: 'task.ntp-auth.field.servers.key_id.help',
              min: 1,
              max: 65535,
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). Key
// lines end in an output (newline survives); the server line ends in an optional
// `key`, so its newline is emitted explicitly with `{{ '\n' }}`.
const template = [
  '{% if authenticate %}ntp authenticate',
  '{% endif %}{% for k in keys %}ntp authentication-key {{ k.id }} md5 {{ k.secret }}',
  "{% endfor %}{% for s in servers %}ntp server {{ s.host }}{% if s.key_id %} key {{ s.key_id }}{% endif %}{{ '\\n' }}{% endfor %}",
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'ntp-auth',
    title: 'Cisco IOS NTP with authentication',
    description:
      'Generate Ansible group_vars and a Cisco IOS authenticated NTP configuration — MD5 authentication keys and the NTP servers that reference them — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.ntp-auth.legend': 'NTP authentication',
      'task.ntp-auth.field.authenticate.label': 'Require authentication',
      'task.ntp-auth.field.authenticate.help':
        'When on, emits `ntp authenticate` so the device only synchronizes with servers presenting a trusted key.',
      'task.ntp-auth.field.keys.label': 'Authentication keys',
      'task.ntp-auth.field.keys.help': 'MD5 keys the device trusts, one per row.',
      'task.ntp-auth.field.keys.add': 'Add key',
      'task.ntp-auth.field.keys.item': 'Key {index}',
      'task.ntp-auth.field.keys.id.label': 'Key ID',
      'task.ntp-auth.field.keys.id.help': 'Numeric key identifier (1–65535), referenced by a server below.',
      'task.ntp-auth.field.keys.secret.label': 'Key (MD5)',
      'task.ntp-auth.field.keys.secret.help':
        'Shared MD5 key string. Treated as a secret — never stored or logged; present in the YAML you then vault.',
      'task.ntp-auth.field.servers.label': 'NTP servers',
      'task.ntp-auth.field.servers.help': 'NTP servers to synchronize with, one per row.',
      'task.ntp-auth.field.servers.add': 'Add server',
      'task.ntp-auth.field.servers.item': 'Server {index}',
      'task.ntp-auth.field.servers.host.label': 'Server IP',
      'task.ntp-auth.field.servers.host.help': 'IPv4 address of the NTP server, e.g. 192.0.2.10.',
      'task.ntp-auth.field.servers.key_id.label': 'Key ID',
      'task.ntp-auth.field.servers.key_id.help':
        'Optional authentication key id this server is reached with. Omitted when blank.',
    },
    fr: {
      'task.ntp-auth.legend': 'Authentification NTP',
      'task.ntp-auth.field.authenticate.label': 'Exiger l’authentification',
      'task.ntp-auth.field.authenticate.help':
        'Si activé, émet « ntp authenticate » pour que l’équipement ne se synchronise qu’avec des serveurs présentant une clé de confiance.',
      'task.ntp-auth.field.keys.label': 'Clés d’authentification',
      'task.ntp-auth.field.keys.help': 'Clés MD5 de confiance de l’équipement, une par ligne.',
      'task.ntp-auth.field.keys.add': 'Ajouter une clé',
      'task.ntp-auth.field.keys.item': 'Clé {index}',
      'task.ntp-auth.field.keys.id.label': 'ID de clé',
      'task.ntp-auth.field.keys.id.help': 'Identifiant numérique de la clé (1–65535), référencé par un serveur ci-dessous.',
      'task.ntp-auth.field.keys.secret.label': 'Clé (MD5)',
      'task.ntp-auth.field.keys.secret.help':
        'Chaîne de clé MD5 partagée. Traitée comme un secret — jamais stockée ni journalisée ; présente dans le YAML que vous chiffrez ensuite avec Vault.',
      'task.ntp-auth.field.servers.label': 'Serveurs NTP',
      'task.ntp-auth.field.servers.help': 'Serveurs NTP avec qui se synchroniser, un par ligne.',
      'task.ntp-auth.field.servers.add': 'Ajouter un serveur',
      'task.ntp-auth.field.servers.item': 'Serveur {index}',
      'task.ntp-auth.field.servers.host.label': 'IP du serveur',
      'task.ntp-auth.field.servers.host.help': 'Adresse IPv4 du serveur NTP, par ex. 192.0.2.10.',
      'task.ntp-auth.field.servers.key_id.label': 'ID de clé',
      'task.ntp-auth.field.servers.key_id.help':
        'Identifiant de clé d’authentification facultatif avec lequel ce serveur est joint. Omis si vide.',
    },
  },
};
