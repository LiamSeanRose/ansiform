/**
 * Curated task: Cisco ASA management access + AAA (issue #50).
 *
 * Who may manage the firewall, and how it authenticates them: permitted
 * `ssh`/`http`/`telnet` source subnets per interface, the ASDM `http server`,
 * SSH settings, AAA authentication source, and a local admin user. Its own ASA
 * family (`vendor: 'cisco-asa'`).
 *
 * Secrets (§5): the local user `password` is a first-class `secret` — never
 * stored, logged, or encoded, masked out of the preview, and emitted only into
 * the YAML file the user vaults. Correctness (§4): no filters → the preview is
 * `exact`; `{{ '\n' }}` terminators keep line breaks under trim_blocks.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.asa-management.legend',
      fields: [
        {
          type: 'list',
          name: 'access',
          label: 'task.asa-management.field.access.label',
          help: 'task.asa-management.field.access.help',
          required: true,
          minRows: 1,
          addLabel: 'task.asa-management.access.add',
          removeLabel: 'task.asa-management.access.remove',
          itemLabel: 'task.asa-management.access.item',
          fields: [
            {
              type: 'select',
              name: 'protocol',
              label: 'task.asa-management.field.protocol.label',
              help: 'task.asa-management.field.protocol.help',
              default: 'ssh',
              options: [
                { value: 'ssh', label: 'task.asa-management.protocol.ssh' },
                { value: 'http', label: 'task.asa-management.protocol.http' },
                { value: 'telnet', label: 'task.asa-management.protocol.telnet' },
              ],
            },
            {
              type: 'text',
              name: 'network',
              label: 'task.asa-management.field.network.label',
              help: 'task.asa-management.field.network.help',
              required: true,
              placeholder: '10.0.0.0',
              format: 'ipv4',
            },
            {
              type: 'text',
              name: 'mask',
              label: 'task.asa-management.field.mask.label',
              help: 'task.asa-management.field.mask.help',
              required: true,
              placeholder: '255.255.255.0',
            },
            {
              type: 'text',
              name: 'interface',
              label: 'task.asa-management.field.interface.label',
              help: 'task.asa-management.field.interface.help',
              required: true,
              placeholder: 'inside',
            },
          ],
        },
        {
          type: 'boolean',
          name: 'http_server',
          label: 'task.asa-management.field.http_server.label',
          help: 'task.asa-management.field.http_server.help',
          default: true,
        },
        {
          type: 'number',
          name: 'ssh_timeout',
          label: 'task.asa-management.field.ssh_timeout.label',
          help: 'task.asa-management.field.ssh_timeout.help',
          min: 1,
          max: 60,
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'aaa_group',
          label: 'task.asa-management.field.aaa_group.label',
          help: 'task.asa-management.field.aaa_group.help',
          default: 'LOCAL',
          placeholder: 'LOCAL',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'username',
          label: 'task.asa-management.field.username.label',
          help: 'task.asa-management.field.username.help',
          placeholder: 'admin',
          omitWhenBlank: true,
        },
        {
          type: 'secret',
          name: 'password',
          label: 'task.asa-management.field.password.label',
          help: 'task.asa-management.field.password.help',
        },
        {
          type: 'number',
          name: 'privilege',
          label: 'task.asa-management.field.privilege.label',
          help: 'task.asa-management.field.privilege.help',
          default: 15,
          min: 0,
          max: 15,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco ASA. Access rules first, then the ASDM/SSH settings, AAA source,
// and an optional local admin user. `ssh version 2` is always set. The secret
// `password` renders masked in the preview (workbench §5) but carries its real
// value into the vaulted YAML.
const template =
  '{% for a in access %}' +
  "{{ a.protocol }} {{ a.network }} {{ a.mask }} {{ a.interface }}{{ '\\n' }}" +
  '{% endfor %}' +
  "{% if http_server %}http server enable{{ '\\n' }}{% endif %}" +
  "ssh version 2{{ '\\n' }}" +
  "{% if ssh_timeout %}ssh timeout {{ ssh_timeout }}{{ '\\n' }}{% endif %}" +
  '{% if aaa_group %}' +
  "aaa authentication ssh console {{ aaa_group }}{{ '\\n' }}" +
  "aaa authentication enable console {{ aaa_group }}{{ '\\n' }}" +
  '{% endif %}' +
  '{% if username %}' +
  "username {{ username }} password {{ password }} privilege {{ privilege }}{{ '\\n' }}" +
  '{% endif %}';

export const task: TaskModule = {
  definition: {
    slug: 'asa-management',
    title: 'Cisco ASA management access & AAA',
    description:
      'Generate Ansible group_vars and a Cisco ASA management-access configuration — permitted SSH/HTTP/Telnet source subnets, the ASDM server, AAA authentication source, and a local admin user — with a live device-CLI preview.',
    vendor: 'cisco-asa',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.asa-management.legend': 'Management access & AAA',
      'task.asa-management.field.access.label': 'Permitted management sources',
      'task.asa-management.field.access.help':
        'One or more source subnets allowed to manage the firewall, per protocol and interface.',
      'task.asa-management.access.add': 'Add source',
      'task.asa-management.access.item': 'Source {index}',
      'task.asa-management.access.remove': 'Remove source {index}',
      'task.asa-management.field.protocol.label': 'Protocol',
      'task.asa-management.field.protocol.help': 'SSH, HTTP (ASDM), or Telnet (discouraged).',
      'task.asa-management.protocol.ssh': 'SSH',
      'task.asa-management.protocol.http': 'HTTP (ASDM)',
      'task.asa-management.protocol.telnet': 'Telnet',
      'task.asa-management.field.network.label': 'Source network',
      'task.asa-management.field.network.help': 'Network address, e.g. 10.0.0.0.',
      'task.asa-management.field.mask.label': 'Mask',
      'task.asa-management.field.mask.help': 'Subnet mask, e.g. 255.255.255.0 (not a wildcard).',
      'task.asa-management.field.interface.label': 'Interface',
      'task.asa-management.field.interface.help': 'Interface the source connects on, e.g. inside.',
      'task.asa-management.field.http_server.label': 'Enable ASDM (http server)',
      'task.asa-management.field.http_server.help':
        'When on, emit http server enable so ASDM/HTTPS management is active.',
      'task.asa-management.field.ssh_timeout.label': 'SSH timeout (minutes)',
      'task.asa-management.field.ssh_timeout.help': 'Optional idle timeout (1–60). Omitted when blank.',
      'task.asa-management.field.aaa_group.label': 'AAA authentication source',
      'task.asa-management.field.aaa_group.help':
        'Server-group or LOCAL used to authenticate SSH and enable access. Omitted when blank.',
      'task.asa-management.field.username.label': 'Local admin user',
      'task.asa-management.field.username.help':
        'Optional local username (needed when the AAA source is LOCAL). Omitted when blank.',
      'task.asa-management.field.password.label': 'Local admin password',
      'task.asa-management.field.password.help':
        'Password for the local user — a secret: never stored, logged, or shown in the preview; it goes only into the vaulted vars file.',
      'task.asa-management.field.privilege.label': 'Privilege level',
      'task.asa-management.field.privilege.help': 'Local user privilege level, 0–15 (15 = full admin).',
    },
    fr: {
      'task.asa-management.legend': 'Accès de gestion et AAA',
      'task.asa-management.field.access.label': 'Sources de gestion autorisées',
      'task.asa-management.field.access.help':
        'Un ou plusieurs sous-réseaux source autorisés à gérer le pare-feu, par protocole et interface.',
      'task.asa-management.access.add': 'Ajouter une source',
      'task.asa-management.access.item': 'Source {index}',
      'task.asa-management.access.remove': 'Supprimer la source {index}',
      'task.asa-management.field.protocol.label': 'Protocole',
      'task.asa-management.field.protocol.help': 'SSH, HTTP (ASDM) ou Telnet (déconseillé).',
      'task.asa-management.protocol.ssh': 'SSH',
      'task.asa-management.protocol.http': 'HTTP (ASDM)',
      'task.asa-management.protocol.telnet': 'Telnet',
      'task.asa-management.field.network.label': 'Réseau source',
      'task.asa-management.field.network.help': 'Adresse réseau, par ex. 10.0.0.0.',
      'task.asa-management.field.mask.label': 'Masque',
      'task.asa-management.field.mask.help': 'Masque de sous-réseau, par ex. 255.255.255.0 (pas générique).',
      'task.asa-management.field.interface.label': 'Interface',
      'task.asa-management.field.interface.help':
        'Interface sur laquelle la source se connecte, par ex. inside.',
      'task.asa-management.field.http_server.label': 'Activer ASDM (http server)',
      'task.asa-management.field.http_server.help':
        'Si activé, émet http server enable pour activer la gestion ASDM/HTTPS.',
      'task.asa-management.field.ssh_timeout.label': 'Délai SSH (minutes)',
      'task.asa-management.field.ssh_timeout.help':
        'Délai d’inactivité facultatif (1–60). Omis si vide.',
      'task.asa-management.field.aaa_group.label': 'Source d’authentification AAA',
      'task.asa-management.field.aaa_group.help':
        'Groupe de serveurs ou LOCAL utilisé pour authentifier SSH et enable. Omis si vide.',
      'task.asa-management.field.username.label': 'Utilisateur admin local',
      'task.asa-management.field.username.help':
        'Nom d’utilisateur local facultatif (requis si la source AAA est LOCAL). Omis si vide.',
      'task.asa-management.field.password.label': 'Mot de passe admin local',
      'task.asa-management.field.password.help':
        'Mot de passe de l’utilisateur local — un secret : jamais stocké, journalisé ni affiché dans l’aperçu ; il n’entre que dans le fichier de variables chiffré.',
      'task.asa-management.field.privilege.label': 'Niveau de privilège',
      'task.asa-management.field.privilege.help':
        'Niveau de privilège de l’utilisateur local, 0–15 (15 = admin complet).',
    },
  },
};
