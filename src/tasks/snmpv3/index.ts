/**
 * Curated task: Cisco IOS SNMPv3 groups & users (issue #22).
 *
 * Two list-shaped tables on the #20 `list` field type: SNMPv3 groups and the
 * users bound to them. Auth and priv pass-phrases are `secret` sub-fields (§5) —
 * never seeded, masked in the preview, carried in the YAML the user then vaults.
 *
 * A user renders authNoPriv when only an auth pass-phrase is set, authPriv when
 * a priv pass-phrase is also set, and noAuthNoPriv when neither is — so the
 * preview is always a valid command. The user line ends in optional clauses, so
 * its newline is an explicit `{{ '\n' }}` output (trim_blocks-safe).
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — each list becomes a YAML sequence of per-row mappings
 * with omit-on-blank inside each row. No filters, so the preview is `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.snmpv3.legend.groups',
      fields: [
        {
          type: 'list',
          name: 'groups',
          label: 'task.snmpv3.field.groups.label',
          help: 'task.snmpv3.field.groups.help',
          minRows: 1,
          addLabel: 'task.snmpv3.field.groups.add',
          itemLabel: 'task.snmpv3.field.groups.item',
          fields: [
            {
              type: 'text',
              name: 'name',
              label: 'task.snmpv3.field.groups.name.label',
              help: 'task.snmpv3.field.groups.name.help',
              required: true,
              placeholder: 'NETADMIN',
            },
            {
              type: 'select',
              name: 'level',
              label: 'task.snmpv3.field.groups.level.label',
              help: 'task.snmpv3.field.groups.level.help',
              default: 'priv',
              options: [
                { value: 'noauth', label: 'task.snmpv3.level.noauth' },
                { value: 'auth', label: 'task.snmpv3.level.auth' },
                { value: 'priv', label: 'task.snmpv3.level.priv' },
              ],
            },
          ],
        },
      ],
    },
    {
      legend: 'task.snmpv3.legend.users',
      fields: [
        {
          type: 'list',
          name: 'users',
          label: 'task.snmpv3.field.users.label',
          help: 'task.snmpv3.field.users.help',
          minRows: 1,
          addLabel: 'task.snmpv3.field.users.add',
          itemLabel: 'task.snmpv3.field.users.item',
          fields: [
            {
              type: 'text',
              name: 'name',
              label: 'task.snmpv3.field.users.name.label',
              help: 'task.snmpv3.field.users.name.help',
              required: true,
              placeholder: 'netops',
            },
            {
              type: 'text',
              name: 'group',
              label: 'task.snmpv3.field.users.group.label',
              help: 'task.snmpv3.field.users.group.help',
              required: true,
              placeholder: 'NETADMIN',
            },
            {
              type: 'select',
              name: 'auth_proto',
              label: 'task.snmpv3.field.users.auth_proto.label',
              help: 'task.snmpv3.field.users.auth_proto.help',
              default: 'sha',
              options: [
                { value: 'sha', label: 'task.snmpv3.auth_proto.sha' },
                { value: 'md5', label: 'task.snmpv3.auth_proto.md5' },
              ],
            },
            {
              type: 'secret',
              name: 'auth_pass',
              label: 'task.snmpv3.field.users.auth_pass.label',
              help: 'task.snmpv3.field.users.auth_pass.help',
              omitWhenBlank: true,
            },
            {
              type: 'select',
              name: 'priv_proto',
              label: 'task.snmpv3.field.users.priv_proto.label',
              help: 'task.snmpv3.field.users.priv_proto.help',
              default: 'aes 128',
              options: [
                { value: 'aes 128', label: 'task.snmpv3.priv_proto.aes128' },
                { value: 'aes 256', label: 'task.snmpv3.priv_proto.aes256' },
                { value: 'des', label: 'task.snmpv3.priv_proto.des' },
              ],
            },
            {
              type: 'secret',
              name: 'priv_pass',
              label: 'task.snmpv3.field.users.priv_pass.label',
              help: 'task.snmpv3.field.users.priv_pass.help',
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). The
// group line ends in an output (its newline survives); the user line's trailing
// auth/priv clauses are conditional, so its newline is an explicit `{{ '\n' }}`.
const template = [
  '{% for g in groups %}snmp-server group {{ g.name }} v3 {{ g.level }}',
  "{% endfor %}{% for u in users %}snmp-server user {{ u.name }} {{ u.group }} v3{% if u.auth_pass %} auth {{ u.auth_proto }} {{ u.auth_pass }}{% if u.priv_pass %} priv {{ u.priv_proto }} {{ u.priv_pass }}{% endif %}{% endif %}{{ '\\n' }}{% endfor %}",
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'snmpv3',
    title: 'Cisco IOS SNMPv3 groups & users',
    description:
      'Generate Ansible group_vars and a Cisco IOS SNMPv3 configuration — security groups and the users bound to them with auth and priv pass-phrases — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.snmpv3.legend.groups': 'SNMPv3 groups',
      'task.snmpv3.legend.users': 'SNMPv3 users',
      'task.snmpv3.field.groups.label': 'Groups',
      'task.snmpv3.field.groups.help': 'One SNMPv3 security group per row.',
      'task.snmpv3.field.groups.add': 'Add group',
      'task.snmpv3.field.groups.item': 'Group {index}',
      'task.snmpv3.field.groups.name.label': 'Group name',
      'task.snmpv3.field.groups.name.help': 'Name of the SNMPv3 group, e.g. NETADMIN.',
      'task.snmpv3.field.groups.level.label': 'Security level',
      'task.snmpv3.field.groups.level.help':
        'Minimum security the group requires: noauth, auth (authNoPriv), or priv (authPriv).',
      'task.snmpv3.level.noauth': 'noauth (no auth, no priv)',
      'task.snmpv3.level.auth': 'auth (authNoPriv)',
      'task.snmpv3.level.priv': 'priv (authPriv)',
      'task.snmpv3.field.users.label': 'Users',
      'task.snmpv3.field.users.help': 'One SNMPv3 user per row, bound to a group above.',
      'task.snmpv3.field.users.add': 'Add user',
      'task.snmpv3.field.users.item': 'User {index}',
      'task.snmpv3.field.users.name.label': 'User name',
      'task.snmpv3.field.users.name.help': 'Name of the SNMPv3 user, e.g. netops.',
      'task.snmpv3.field.users.group.label': 'Group',
      'task.snmpv3.field.users.group.help': 'Group this user belongs to, e.g. NETADMIN.',
      'task.snmpv3.field.users.auth_proto.label': 'Auth protocol',
      'task.snmpv3.field.users.auth_proto.help': 'Authentication hash used with the auth pass-phrase.',
      'task.snmpv3.auth_proto.sha': 'sha',
      'task.snmpv3.auth_proto.md5': 'md5',
      'task.snmpv3.field.users.auth_pass.label': 'Auth pass-phrase',
      'task.snmpv3.field.users.auth_pass.help':
        'Authentication pass-phrase. Treated as a secret — never stored or logged; present in the YAML you then vault. Leave blank for a noAuth user. Omitted when blank.',
      'task.snmpv3.field.users.priv_proto.label': 'Priv protocol',
      'task.snmpv3.field.users.priv_proto.help': 'Privacy (encryption) cipher used with the priv pass-phrase.',
      'task.snmpv3.priv_proto.aes128': 'aes 128',
      'task.snmpv3.priv_proto.aes256': 'aes 256',
      'task.snmpv3.priv_proto.des': 'des',
      'task.snmpv3.field.users.priv_pass.label': 'Priv pass-phrase',
      'task.snmpv3.field.users.priv_pass.help':
        'Privacy pass-phrase. Treated as a secret — never stored or logged; present in the YAML you then vault. Set it for an authPriv user. Omitted when blank.',
    },
    fr: {
      'task.snmpv3.legend.groups': 'Groupes SNMPv3',
      'task.snmpv3.legend.users': 'Utilisateurs SNMPv3',
      'task.snmpv3.field.groups.label': 'Groupes',
      'task.snmpv3.field.groups.help': 'Un groupe de sécurité SNMPv3 par ligne.',
      'task.snmpv3.field.groups.add': 'Ajouter un groupe',
      'task.snmpv3.field.groups.item': 'Groupe {index}',
      'task.snmpv3.field.groups.name.label': 'Nom du groupe',
      'task.snmpv3.field.groups.name.help': 'Nom du groupe SNMPv3, par ex. NETADMIN.',
      'task.snmpv3.field.groups.level.label': 'Niveau de sécurité',
      'task.snmpv3.field.groups.level.help':
        'Sécurité minimale exigée par le groupe : noauth, auth (authNoPriv) ou priv (authPriv).',
      'task.snmpv3.level.noauth': 'noauth (ni auth ni priv)',
      'task.snmpv3.level.auth': 'auth (authNoPriv)',
      'task.snmpv3.level.priv': 'priv (authPriv)',
      'task.snmpv3.field.users.label': 'Utilisateurs',
      'task.snmpv3.field.users.help': 'Un utilisateur SNMPv3 par ligne, rattaché à un groupe ci-dessus.',
      'task.snmpv3.field.users.add': 'Ajouter un utilisateur',
      'task.snmpv3.field.users.item': 'Utilisateur {index}',
      'task.snmpv3.field.users.name.label': 'Nom d’utilisateur',
      'task.snmpv3.field.users.name.help': 'Nom de l’utilisateur SNMPv3, par ex. netops.',
      'task.snmpv3.field.users.group.label': 'Groupe',
      'task.snmpv3.field.users.group.help': 'Groupe auquel cet utilisateur appartient, par ex. NETADMIN.',
      'task.snmpv3.field.users.auth_proto.label': 'Protocole d’authentification',
      'task.snmpv3.field.users.auth_proto.help': 'Hachage d’authentification utilisé avec la phrase d’authentification.',
      'task.snmpv3.auth_proto.sha': 'sha',
      'task.snmpv3.auth_proto.md5': 'md5',
      'task.snmpv3.field.users.auth_pass.label': 'Phrase d’authentification',
      'task.snmpv3.field.users.auth_pass.help':
        'Phrase secrète d’authentification. Traitée comme un secret — jamais stockée ni journalisée ; présente dans le YAML que vous chiffrez avec Vault. Laisser vide pour un utilisateur noAuth. Omise si vide.',
      'task.snmpv3.field.users.priv_proto.label': 'Protocole de chiffrement',
      'task.snmpv3.field.users.priv_proto.help': 'Algorithme de confidentialité utilisé avec la phrase de chiffrement.',
      'task.snmpv3.priv_proto.aes128': 'aes 128',
      'task.snmpv3.priv_proto.aes256': 'aes 256',
      'task.snmpv3.priv_proto.des': 'des',
      'task.snmpv3.field.users.priv_pass.label': 'Phrase de chiffrement',
      'task.snmpv3.field.users.priv_pass.help':
        'Phrase secrète de chiffrement. Traitée comme un secret — jamais stockée ni journalisée ; présente dans le YAML que vous chiffrez avec Vault. À définir pour un utilisateur authPriv. Omise si vide.',
    },
  },
};
