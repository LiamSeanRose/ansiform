/**
 * Curated task: Cisco IOS AAA / TACACS+ server list (issue #22).
 *
 * A list-shaped task on the #20 `list` field type: a repeating table of TACACS+
 * servers, each rendered as a modern `tacacs server NAME` block. The shared key
 * is a `secret` sub-field (§5) — never seeded, masked in the preview, carried in
 * the YAML the user then vaults. The optional key is on its own sub-line (its
 * newline lives inside the `{% if %}`), so no explicit newline output is needed.
 *
 * Correctness (council §4): the YAML vars come straight from the field values
 * and are always correct — the servers become a YAML sequence of per-row
 * mappings with omit-on-blank inside each row. No filters, so the preview is
 * `exact`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

// Dotted IPv4, e.g. 192.0.2.20.
const IPV4 = '^(\\d{1,3}\\.){3}\\d{1,3}$';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.aaa-servers.legend',
      fields: [
        {
          type: 'boolean',
          name: 'new_model',
          label: 'task.aaa-servers.field.new_model.label',
          help: 'task.aaa-servers.field.new_model.help',
          default: true,
        },
        {
          type: 'list',
          name: 'servers',
          label: 'task.aaa-servers.field.servers.label',
          help: 'task.aaa-servers.field.servers.help',
          minRows: 1,
          addLabel: 'task.aaa-servers.field.servers.add',
          itemLabel: 'task.aaa-servers.field.servers.item',
          fields: [
            {
              type: 'text',
              name: 'name',
              label: 'task.aaa-servers.field.servers.name.label',
              help: 'task.aaa-servers.field.servers.name.help',
              required: true,
              placeholder: 'TAC1',
            },
            {
              type: 'text',
              name: 'address',
              label: 'task.aaa-servers.field.servers.address.label',
              help: 'task.aaa-servers.field.servers.address.help',
              required: true,
              pattern: IPV4,
              placeholder: '192.0.2.20',
            },
            {
              type: 'secret',
              name: 'key',
              label: 'task.aaa-servers.field.servers.key.label',
              help: 'task.aaa-servers.field.servers.key.help',
              omitWhenBlank: true,
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True). Each
// server is a `tacacs server` block; the optional key is its own indented line,
// its newline carried inside the `{% if %}` (before the `{% endif %}`), so an
// unset key leaves no gap.
const template = [
  '{% if new_model %}aaa new-model',
  '{% endif %}{% for s in servers %}tacacs server {{ s.name }}',
  ' address ipv4 {{ s.address }}',
  '{% if s.key %} key {{ s.key }}',
  '{% endif %}{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'aaa-servers',
    title: 'Cisco IOS AAA / TACACS+ servers',
    description:
      'Generate Ansible group_vars and a Cisco IOS TACACS+ server configuration — aaa new-model and a repeating list of TACACS+ servers with address and shared key — with a live device-CLI preview.',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'all' },
  },
  messages: {
    en: {
      'task.aaa-servers.legend': 'AAA / TACACS+',
      'task.aaa-servers.field.new_model.label': 'Enable aaa new-model',
      'task.aaa-servers.field.new_model.help':
        'When on, emits `aaa new-model` to enable the AAA subsystem. Required before AAA method lists take effect.',
      'task.aaa-servers.field.servers.label': 'TACACS+ servers',
      'task.aaa-servers.field.servers.help': 'One TACACS+ server per row.',
      'task.aaa-servers.field.servers.add': 'Add server',
      'task.aaa-servers.field.servers.item': 'Server {index}',
      'task.aaa-servers.field.servers.name.label': 'Server name',
      'task.aaa-servers.field.servers.name.help':
        'Name for this tacacs server entry, e.g. TAC1 (the modern named-server form).',
      'task.aaa-servers.field.servers.address.label': 'Server IP',
      'task.aaa-servers.field.servers.address.help': 'IPv4 address of the TACACS+ server, e.g. 192.0.2.20.',
      'task.aaa-servers.field.servers.key.label': 'Shared key',
      'task.aaa-servers.field.servers.key.help':
        'Shared secret for this server. Treated as a secret — never stored or logged; present in the YAML you then vault. Omitted when blank.',
    },
    fr: {
      'task.aaa-servers.legend': 'AAA / TACACS+',
      'task.aaa-servers.field.new_model.label': 'Activer aaa new-model',
      'task.aaa-servers.field.new_model.help':
        'Si activé, émet « aaa new-model » pour activer le sous-système AAA. Requis avant que les listes de méthodes AAA prennent effet.',
      'task.aaa-servers.field.servers.label': 'Serveurs TACACS+',
      'task.aaa-servers.field.servers.help': 'Un serveur TACACS+ par ligne.',
      'task.aaa-servers.field.servers.add': 'Ajouter un serveur',
      'task.aaa-servers.field.servers.item': 'Serveur {index}',
      'task.aaa-servers.field.servers.name.label': 'Nom du serveur',
      'task.aaa-servers.field.servers.name.help':
        'Nom de cette entrée tacacs server, par ex. TAC1 (forme moderne à serveur nommé).',
      'task.aaa-servers.field.servers.address.label': 'IP du serveur',
      'task.aaa-servers.field.servers.address.help': 'Adresse IPv4 du serveur TACACS+, par ex. 192.0.2.20.',
      'task.aaa-servers.field.servers.key.label': 'Clé partagée',
      'task.aaa-servers.field.servers.key.help':
        'Secret partagé de ce serveur. Traité comme un secret — jamais stocké ni journalisé ; présent dans le YAML que vous chiffrez ensuite avec Vault. Omis si vide.',
    },
  },
};
