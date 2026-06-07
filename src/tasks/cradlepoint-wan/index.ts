/**
 * Curated task: Cradlepoint NCOS cellular WAN profile (issue #55).
 *
 * The headline reason to run a Cradlepoint: a cellular WAN connection profile —
 * SIM/APN/modem auth. Like the other NCOS tasks (#40) and per the #36 preview
 * model (`docs/design/non-cli-preview.md`), this is a native task family
 * (`vendor: 'cradlepoint-ncos'`) whose template emits the platform's native
 * `set <path> <value>` form.
 *
 * Secrets (council §5): the SIM PIN and the APN auth password are `secret`
 * fields — password inputs, never stored, logged, encoded, or seeded with a
 * default. They render into the live `set` preview like any other value (the
 * preview is ephemeral), but never leave the browser.
 *
 * Honesty (council §4 + #40): the YAML vars come straight from the values and are
 * ALWAYS correct. The preview is authored from public NCOS docs, is not
 * device-verified, and addresses the profile positionally (index `0`), so the
 * task declares `fidelityFloor: 'approximate'`: the workbench/build clamp the
 * render down so the pane always shows the degrade notice and never claims
 * `exact`. Authored from generic public knowledge — no employer config.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.cradlepoint-wan.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.cradlepoint-wan.field.name.label',
          help: 'task.cradlepoint-wan.field.name.help',
          required: true,
          placeholder: 'Cellular-Primary',
        },
        {
          type: 'text',
          name: 'apn',
          label: 'task.cradlepoint-wan.field.apn.label',
          help: 'task.cradlepoint-wan.field.apn.help',
          required: true,
          placeholder: 'broadband',
        },
        {
          type: 'secret',
          name: 'sim_pin',
          label: 'task.cradlepoint-wan.field.sim_pin.label',
          help: 'task.cradlepoint-wan.field.sim_pin.help',
          omitWhenBlank: true,
        },
        {
          type: 'select',
          name: 'auth_type',
          label: 'task.cradlepoint-wan.field.auth_type.label',
          help: 'task.cradlepoint-wan.field.auth_type.help',
          default: 'none',
          options: [
            { value: 'none', label: 'task.cradlepoint-wan.auth.none' },
            { value: 'pap', label: 'task.cradlepoint-wan.auth.pap' },
            { value: 'chap', label: 'task.cradlepoint-wan.auth.chap' },
          ],
        },
        {
          type: 'text',
          name: 'username',
          label: 'task.cradlepoint-wan.field.username.label',
          help: 'task.cradlepoint-wan.field.username.help',
          placeholder: 'user@carrier',
          omitWhenBlank: true,
        },
        {
          type: 'secret',
          name: 'password',
          label: 'task.cradlepoint-wan.field.password.label',
          help: 'task.cradlepoint-wan.field.password.help',
          omitWhenBlank: true,
        },
        {
          type: 'boolean',
          name: 'roaming',
          label: 'task.cradlepoint-wan.field.roaming.label',
          help: 'task.cradlepoint-wan.field.roaming.help',
          default: false,
        },
      ],
    },
  ],
};

// Jinja2 → Cradlepoint NCOS config-CLI `set` form (preview-only, approximate).
// Optional lines (SIM PIN, APN auth, username/password) appear only when filled;
// auth lines render only when an auth type other than `none` is chosen.
const template = [
  'set wan/cellular/0/profile_name {{ name }}',
  'set wan/cellular/0/apn {{ apn }}',
  '{% if sim_pin %}set wan/cellular/0/sim_pin {{ sim_pin }}',
  "{% endif %}{% if auth_type != 'none' %}set wan/cellular/0/auth/type {{ auth_type }}",
  '{% if username %}set wan/cellular/0/auth/username {{ username }}',
  '{% endif %}{% if password %}set wan/cellular/0/auth/password {{ password }}',
  '{% endif %}{% endif %}{% if roaming %}set wan/cellular/0/roaming true',
  '{% else %}set wan/cellular/0/roaming false',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'cradlepoint-wan',
    title: 'Cradlepoint NCOS cellular WAN',
    description:
      'Generate Ansible host_vars and a Cradlepoint NCOS cellular WAN profile — APN, SIM PIN, modem authentication, and roaming — with an approximate device-config preview.',
    vendor: 'cradlepoint-ncos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.cradlepoint-wan.legend': 'Cellular WAN profile',
      'task.cradlepoint-wan.field.name.label': 'Profile name',
      'task.cradlepoint-wan.field.name.help': 'Label for the cellular WAN profile, e.g. Cellular-Primary.',
      'task.cradlepoint-wan.field.apn.label': 'APN',
      'task.cradlepoint-wan.field.apn.help': 'Carrier access point name, e.g. broadband.',
      'task.cradlepoint-wan.field.sim_pin.label': 'SIM PIN',
      'task.cradlepoint-wan.field.sim_pin.help':
        'Optional SIM unlock PIN. Treated as a secret — never stored, logged, or seeded.',
      'task.cradlepoint-wan.field.auth_type.label': 'Authentication',
      'task.cradlepoint-wan.field.auth_type.help':
        'Modem auth method required by the carrier. None skips the username/password.',
      'task.cradlepoint-wan.field.username.label': 'Auth username',
      'task.cradlepoint-wan.field.username.help':
        'APN authentication username, if the carrier requires one. Omitted when blank.',
      'task.cradlepoint-wan.field.password.label': 'Auth password',
      'task.cradlepoint-wan.field.password.help':
        'APN authentication password. Treated as a secret — never stored, logged, or seeded.',
      'task.cradlepoint-wan.field.roaming.label': 'Allow roaming',
      'task.cradlepoint-wan.field.roaming.help': 'Permit the modem to connect on roaming networks.',
      'task.cradlepoint-wan.auth.none': 'None',
      'task.cradlepoint-wan.auth.pap': 'PAP',
      'task.cradlepoint-wan.auth.chap': 'CHAP',
    },
    fr: {
      'task.cradlepoint-wan.legend': 'Profil WAN cellulaire',
      'task.cradlepoint-wan.field.name.label': 'Nom du profil',
      'task.cradlepoint-wan.field.name.help':
        'Libellé du profil WAN cellulaire, par ex. Cellular-Primary.',
      'task.cradlepoint-wan.field.apn.label': 'APN',
      'task.cradlepoint-wan.field.apn.help': 'Nom du point d’accès de l’opérateur, par ex. broadband.',
      'task.cradlepoint-wan.field.sim_pin.label': 'PIN de la SIM',
      'task.cradlepoint-wan.field.sim_pin.help':
        'Code PIN de déverrouillage de la SIM (facultatif). Traité comme un secret — jamais stocké, journalisé ni pré-rempli.',
      'task.cradlepoint-wan.field.auth_type.label': 'Authentification',
      'task.cradlepoint-wan.field.auth_type.help':
        'Méthode d’authentification du modem exigée par l’opérateur. « None » ignore le nom d’utilisateur et le mot de passe.',
      'task.cradlepoint-wan.field.username.label': 'Nom d’utilisateur',
      'task.cradlepoint-wan.field.username.help':
        'Nom d’utilisateur d’authentification APN, si l’opérateur l’exige. Omis si vide.',
      'task.cradlepoint-wan.field.password.label': 'Mot de passe',
      'task.cradlepoint-wan.field.password.help':
        'Mot de passe d’authentification APN. Traité comme un secret — jamais stocké, journalisé ni pré-rempli.',
      'task.cradlepoint-wan.field.roaming.label': 'Autoriser l’itinérance',
      'task.cradlepoint-wan.field.roaming.help':
        'Permettre au modem de se connecter sur les réseaux en itinérance.',
      'task.cradlepoint-wan.auth.none': 'Aucune',
      'task.cradlepoint-wan.auth.pap': 'PAP',
      'task.cradlepoint-wan.auth.chap': 'CHAP',
    },
  },
};
