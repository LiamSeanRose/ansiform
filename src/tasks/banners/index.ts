/**
 * Curated task: Cisco IOS login banners — MOTD / login / exec (issue #22).
 *
 * Cloned from the interface-ip reference (#6). A scalar task: each banner is one
 * optional text field, emitted as an IOS banner block delimited by `^C` (the
 * conventional show-run delimiter). Every field is optional, so the form emits
 * only the banners you fill in (`default(omit)` on each key).
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct. The template uses no filters, so the device-CLI
 * preview is always `exact`. Pick a banner wording that does not contain the
 * `^C` delimiter, exactly as you would on the device.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.banners.legend',
      fields: [
        {
          type: 'text',
          name: 'motd',
          label: 'task.banners.field.motd.label',
          help: 'task.banners.field.motd.help',
          placeholder: 'Authorized access only. Activity is monitored.',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'login',
          label: 'task.banners.field.login.label',
          help: 'task.banners.field.login.help',
          placeholder: 'This system is restricted to authorized users.',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'exec',
          label: 'task.banners.field.exec.label',
          help: 'task.banners.field.exec.help',
          placeholder: 'You are now in privileged mode.',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline right after each `{% endif %}` is swallowed, so an unset banner leaves
// no gap. Each banner renders as the device shows it: the keyword and opening
// `^C`, the message on its own line, then the closing `^C`.
const template = [
  '{% if motd %}banner motd ^C',
  '{{ motd }}',
  '^C',
  '{% endif %}{% if login %}banner login ^C',
  '{{ login }}',
  '^C',
  '{% endif %}{% if exec %}banner exec ^C',
  '{{ exec }}',
  '^C',
  '{% endif %}',
].join('\n');

// Arista EOS: banners are entered without an inline delimiter and terminated by a
// lone `EOF` line; EOS has no `exec` banner, so that field is not rendered here.
// Verified exact against Arista's EOS "Managing Display Attributes" manual, where
// both `banner motd` and `banner login` end the message with `EOF` on its own line.
const templateEos = [
  '{% if motd %}banner motd',
  '{{ motd }}',
  'EOF',
  '{% endif %}{% if login %}banner login',
  '{{ login }}',
  'EOF',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'banners',
    title: 'Cisco IOS login banners (MOTD, login, exec)',
    description:
      'Generate Ansible group_vars and Cisco IOS banner configuration — message-of-the-day, login, and exec banners — with a live device-CLI preview.',
    schema,
    template,
    // IOS-XE shares the IOS banner CLI verbatim. EOS uses an `EOF`-terminated
    // form, verified exact against Arista's manual (#34).
    templates: {
      'cisco-iosxe': template,
      'arista-eos': templateEos,
    },
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.banners.legend': 'Banners',
      'task.banners.field.motd.label': 'MOTD banner',
      'task.banners.field.motd.help':
        'Message-of-the-day banner, shown before login. Omitted from the vars when left blank.',
      'task.banners.field.login.label': 'Login banner',
      'task.banners.field.login.help':
        'Banner shown at the login prompt, after the MOTD. Omitted when blank.',
      'task.banners.field.exec.label': 'Exec banner',
      'task.banners.field.exec.help':
        'Banner shown after a successful login, when the exec process starts. Omitted when blank.',
    },
    fr: {
      'task.banners.legend': 'Bannières',
      'task.banners.field.motd.label': 'Bannière MOTD',
      'task.banners.field.motd.help':
        'Bannière du message du jour, affichée avant la connexion. Omise des variables si laissée vide.',
      'task.banners.field.login.label': 'Bannière de connexion',
      'task.banners.field.login.help':
        'Bannière affichée à l’invite de connexion, après le MOTD. Omise si vide.',
      'task.banners.field.exec.label': 'Bannière exec',
      'task.banners.field.exec.help':
        'Bannière affichée après une connexion réussie, au démarrage du processus exec. Omise si vide.',
    },
  },
};
