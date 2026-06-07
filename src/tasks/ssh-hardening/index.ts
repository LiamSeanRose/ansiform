/**
 * Curated task: Cisco IOS SSH service + VTY line hardening (issue #22).
 *
 * Cloned from the interface-ip reference (#6). A scalar management-plane
 * hardening task: force the SSH service version, bound its negotiation timeout
 * and auth retries, then lock down the VTY lines (exec-timeout, inbound
 * transport, local/AAA login, and an optional inbound access-class).
 *
 * Scope (council §scope): this is the scalar v1 cut — one VTY range `0 N`,
 * single inbound ACL. A per-line-block list shape waits on the `list` field
 * type (#20). Everything here is correct-by-construction.
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct. The template uses no filters, so the device-CLI
 * preview is always `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.ssh-hardening.legend.ssh',
      fields: [
        {
          type: 'select',
          name: 'ssh_version',
          label: 'task.ssh-hardening.field.ssh_version.label',
          help: 'task.ssh-hardening.field.ssh_version.help',
          default: '2',
          options: [
            { value: '2', label: 'task.ssh-hardening.ssh_version.v2' },
            { value: '1.99', label: 'task.ssh-hardening.ssh_version.v199' },
          ],
        },
        {
          type: 'number',
          name: 'ssh_timeout',
          label: 'task.ssh-hardening.field.ssh_timeout.label',
          help: 'task.ssh-hardening.field.ssh_timeout.help',
          min: 1,
          max: 120,
          default: 120,
        },
        {
          type: 'number',
          name: 'ssh_auth_retries',
          label: 'task.ssh-hardening.field.ssh_auth_retries.label',
          help: 'task.ssh-hardening.field.ssh_auth_retries.help',
          min: 0,
          max: 5,
          default: 3,
        },
      ],
    },
    {
      legend: 'task.ssh-hardening.legend.vty',
      fields: [
        {
          type: 'number',
          name: 'vty_last',
          label: 'task.ssh-hardening.field.vty_last.label',
          help: 'task.ssh-hardening.field.vty_last.help',
          min: 0,
          max: 15,
          default: 4,
        },
        {
          type: 'number',
          name: 'exec_timeout_min',
          label: 'task.ssh-hardening.field.exec_timeout_min.label',
          help: 'task.ssh-hardening.field.exec_timeout_min.help',
          min: 0,
          max: 35791,
          default: 5,
        },
        {
          type: 'number',
          name: 'exec_timeout_sec',
          label: 'task.ssh-hardening.field.exec_timeout_sec.label',
          help: 'task.ssh-hardening.field.exec_timeout_sec.help',
          min: 0,
          max: 59,
          default: 0,
        },
        {
          type: 'select',
          name: 'transport_input',
          label: 'task.ssh-hardening.field.transport_input.label',
          help: 'task.ssh-hardening.field.transport_input.help',
          default: 'ssh',
          options: [
            { value: 'ssh', label: 'task.ssh-hardening.transport_input.ssh' },
            { value: 'ssh telnet', label: 'task.ssh-hardening.transport_input.ssh_telnet' },
            { value: 'none', label: 'task.ssh-hardening.transport_input.none' },
          ],
        },
        {
          type: 'boolean',
          name: 'login_local',
          label: 'task.ssh-hardening.field.login_local.label',
          help: 'task.ssh-hardening.field.login_local.help',
          default: true,
        },
        {
          type: 'text',
          name: 'access_class',
          label: 'task.ssh-hardening.field.access_class.label',
          help: 'task.ssh-hardening.field.access_class.help',
          placeholder: 'MGMT-IN',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline right after each `{% endif %}` is swallowed, so an unset optional line
// leaves no gap. The SSH service lines and the VTY range are always emitted;
// `login local` and the inbound `access-class` are the only conditional lines.
const template = [
  'ip ssh version {{ ssh_version }}',
  'ip ssh time-out {{ ssh_timeout }}',
  'ip ssh authentication-retries {{ ssh_auth_retries }}',
  'line vty 0 {{ vty_last }}',
  ' exec-timeout {{ exec_timeout_min }} {{ exec_timeout_sec }}',
  ' transport input {{ transport_input }}',
  '{% if login_local %} login local',
  '{% endif %}{% if access_class %} access-class {{ access_class }} in',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'ssh-hardening',
    title: 'Cisco IOS SSH & VTY hardening',
    description:
      'Generate Ansible group_vars and a Cisco IOS SSH service and VTY line hardening configuration — SSH version, timeout and auth retries, VTY exec-timeout, inbound transport, login, and an optional inbound access-class — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE shares the IOS SSH/VTY CLI verbatim (exact). NX-OS (`feature ssh`,
    // no `ip ssh version`) and EOS (`management ssh`) differ materially and are
    // intentionally NOT offered here rather than shipped as a guess.
    templates: { 'cisco-iosxe': template },
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.ssh-hardening.legend.ssh': 'SSH service',
      'task.ssh-hardening.legend.vty': 'VTY lines',
      'task.ssh-hardening.field.ssh_version.label': 'SSH version',
      'task.ssh-hardening.field.ssh_version.help':
        'SSH protocol version the device offers. Version 2 only is recommended.',
      'task.ssh-hardening.ssh_version.v2': '2 (SSHv2 only)',
      'task.ssh-hardening.ssh_version.v199': '1.99 (SSHv1 + SSHv2)',
      'task.ssh-hardening.field.ssh_timeout.label': 'SSH negotiation timeout (seconds)',
      'task.ssh-hardening.field.ssh_timeout.help':
        'Seconds to wait for SSH negotiation before disconnecting (1–120).',
      'task.ssh-hardening.field.ssh_auth_retries.label': 'SSH authentication retries',
      'task.ssh-hardening.field.ssh_auth_retries.help':
        'Number of authentication attempts allowed per connection (0–5).',
      'task.ssh-hardening.field.vty_last.label': 'Last VTY line',
      'task.ssh-hardening.field.vty_last.help':
        'Highest VTY line number to configure; the block applies to lines 0 through this (0–15).',
      'task.ssh-hardening.field.exec_timeout_min.label': 'Exec-timeout minutes',
      'task.ssh-hardening.field.exec_timeout_min.help':
        'Idle minutes before an interactive session is closed. With seconds at 0, set both to 0 to disable.',
      'task.ssh-hardening.field.exec_timeout_sec.label': 'Exec-timeout seconds',
      'task.ssh-hardening.field.exec_timeout_sec.help':
        'Idle seconds, added to the minutes above (0–59).',
      'task.ssh-hardening.field.transport_input.label': 'Inbound transport',
      'task.ssh-hardening.field.transport_input.help':
        'Protocols accepted on the VTY lines. SSH only is recommended.',
      'task.ssh-hardening.transport_input.ssh': 'ssh (SSH only)',
      'task.ssh-hardening.transport_input.ssh_telnet': 'ssh telnet (SSH and Telnet)',
      'task.ssh-hardening.transport_input.none': 'none (no remote access)',
      'task.ssh-hardening.field.login_local.label': 'Login with local/AAA accounts',
      'task.ssh-hardening.field.login_local.help':
        'When on, emits `login local` so the VTY lines authenticate against the local user database (or AAA). When off, the line is omitted.',
      'task.ssh-hardening.field.access_class.label': 'Inbound access-class (ACL)',
      'task.ssh-hardening.field.access_class.help':
        'Optional ACL name or number applied inbound on the VTY lines, e.g. MGMT-IN. Omitted from the vars when left blank.',
    },
    fr: {
      'task.ssh-hardening.legend.ssh': 'Service SSH',
      'task.ssh-hardening.legend.vty': 'Lignes VTY',
      'task.ssh-hardening.field.ssh_version.label': 'Version SSH',
      'task.ssh-hardening.field.ssh_version.help':
        'Version du protocole SSH proposée par l’équipement. La version 2 uniquement est recommandée.',
      'task.ssh-hardening.ssh_version.v2': '2 (SSHv2 uniquement)',
      'task.ssh-hardening.ssh_version.v199': '1.99 (SSHv1 + SSHv2)',
      'task.ssh-hardening.field.ssh_timeout.label': 'Délai de négociation SSH (secondes)',
      'task.ssh-hardening.field.ssh_timeout.help':
        'Secondes d’attente de la négociation SSH avant déconnexion (1–120).',
      'task.ssh-hardening.field.ssh_auth_retries.label': 'Tentatives d’authentification SSH',
      'task.ssh-hardening.field.ssh_auth_retries.help':
        'Nombre de tentatives d’authentification autorisées par connexion (0–5).',
      'task.ssh-hardening.field.vty_last.label': 'Dernière ligne VTY',
      'task.ssh-hardening.field.vty_last.help':
        'Numéro de la dernière ligne VTY à configurer ; le bloc s’applique aux lignes 0 à celle-ci (0–15).',
      'task.ssh-hardening.field.exec_timeout_min.label': 'Exec-timeout minutes',
      'task.ssh-hardening.field.exec_timeout_min.help':
        'Minutes d’inactivité avant fermeture d’une session interactive. Mettre minutes et secondes à 0 pour désactiver.',
      'task.ssh-hardening.field.exec_timeout_sec.label': 'Exec-timeout secondes',
      'task.ssh-hardening.field.exec_timeout_sec.help':
        'Secondes d’inactivité, ajoutées aux minutes ci-dessus (0–59).',
      'task.ssh-hardening.field.transport_input.label': 'Transport entrant',
      'task.ssh-hardening.field.transport_input.help':
        'Protocoles acceptés sur les lignes VTY. SSH uniquement est recommandé.',
      'task.ssh-hardening.transport_input.ssh': 'ssh (SSH uniquement)',
      'task.ssh-hardening.transport_input.ssh_telnet': 'ssh telnet (SSH et Telnet)',
      'task.ssh-hardening.transport_input.none': 'none (aucun accès distant)',
      'task.ssh-hardening.field.login_local.label': 'Connexion avec comptes locaux/AAA',
      'task.ssh-hardening.field.login_local.help':
        'Si activé, émet « login local » pour authentifier les lignes VTY contre la base d’utilisateurs locale (ou AAA). Si désactivé, la ligne est omise.',
      'task.ssh-hardening.field.access_class.label': 'Access-class entrante (ACL)',
      'task.ssh-hardening.field.access_class.help':
        'Nom ou numéro d’ACL facultatif appliqué en entrée sur les lignes VTY, par ex. MGMT-IN. Omis des variables si laissé vide.',
    },
  },
};
