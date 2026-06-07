/**
 * Curated task: Cradlepoint NCOS site-to-site tunnel (issue #57).
 *
 * Companion to `cradlepoint-lan` / `cradlepoint-static-route`. Same non-line-CLI
 * platform and preview model (#36): the NCOS config-CLI `set <path> <value>`
 * form, arrays addressed positionally (index `0` = the first tunnel). An IPsec
 * tunnel additionally carries a pre-shared key.
 *
 * Secrets (§5): the IPsec `psk` is a first-class `secret` — never stored, logged,
 * or encoded, masked out of the preview, emitted only into the vaulted YAML.
 * Honesty (#40): the YAML vars are always correct; the preview is authored from
 * public NCOS docs, not device-verified, so the task declares
 * `fidelityFloor: 'approximate'`.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.cradlepoint-tunnel.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.cradlepoint-tunnel.field.name.label',
          help: 'task.cradlepoint-tunnel.field.name.help',
          required: true,
          placeholder: 'to-hq',
        },
        {
          type: 'select',
          name: 'type',
          label: 'task.cradlepoint-tunnel.field.type.label',
          help: 'task.cradlepoint-tunnel.field.type.help',
          default: 'ipsec',
          options: [
            { value: 'ipsec', label: 'task.cradlepoint-tunnel.type.ipsec' },
            { value: 'gre', label: 'task.cradlepoint-tunnel.type.gre' },
          ],
        },
        {
          type: 'text',
          name: 'remote_gateway',
          label: 'task.cradlepoint-tunnel.field.remote_gateway.label',
          help: 'task.cradlepoint-tunnel.field.remote_gateway.help',
          required: true,
          placeholder: '198.51.100.1',
        },
        {
          type: 'text',
          name: 'local_network',
          label: 'task.cradlepoint-tunnel.field.local_network.label',
          help: 'task.cradlepoint-tunnel.field.local_network.help',
          required: true,
          placeholder: '192.168.0.0/24',
        },
        {
          type: 'text',
          name: 'remote_network',
          label: 'task.cradlepoint-tunnel.field.remote_network.label',
          help: 'task.cradlepoint-tunnel.field.remote_network.help',
          required: true,
          placeholder: '10.0.0.0/24',
        },
        {
          type: 'secret',
          name: 'psk',
          label: 'task.cradlepoint-tunnel.field.psk.label',
          help: 'task.cradlepoint-tunnel.field.psk.help',
        },
      ],
    },
  ],
};

// Jinja2 → Cradlepoint NCOS config-CLI `set` form (preview-only, approximate).
// CIDR networks are used verbatim; the pre-shared key line appears only for
// IPsec. The secret `psk` renders masked in the preview but carries its real
// value into the vaulted YAML.
const template = [
  'set vpn/tunnels/0/name {{ name }}',
  'set vpn/tunnels/0/type {{ type }}',
  'set vpn/tunnels/0/enabled true',
  'set vpn/tunnels/0/remote_gateway {{ remote_gateway }}',
  'set vpn/tunnels/0/local_networks/0 {{ local_network }}',
  'set vpn/tunnels/0/remote_networks/0 {{ remote_network }}',
  "{% if type == 'ipsec' %}set vpn/tunnels/0/auth/psk {{ psk }}",
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'cradlepoint-tunnel',
    title: 'Cradlepoint NCOS site-to-site tunnel',
    description:
      'Generate Ansible host_vars and a Cradlepoint NCOS site-to-site tunnel — IPsec or GRE, with the remote gateway, local and remote networks, and a pre-shared key — with an approximate device-config preview.',
    vendor: 'cradlepoint-ncos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.cradlepoint-tunnel.legend': 'Site-to-site tunnel',
      'task.cradlepoint-tunnel.field.name.label': 'Tunnel name',
      'task.cradlepoint-tunnel.field.name.help': 'Label for the tunnel, e.g. to-hq.',
      'task.cradlepoint-tunnel.field.type.label': 'Type',
      'task.cradlepoint-tunnel.field.type.help':
        'IPsec (encrypted, uses a pre-shared key) or GRE (unencrypted).',
      'task.cradlepoint-tunnel.type.ipsec': 'IPsec',
      'task.cradlepoint-tunnel.type.gre': 'GRE',
      'task.cradlepoint-tunnel.field.remote_gateway.label': 'Remote gateway',
      'task.cradlepoint-tunnel.field.remote_gateway.help': 'Peer public IP, e.g. 198.51.100.1.',
      'task.cradlepoint-tunnel.field.local_network.label': 'Local network',
      'task.cradlepoint-tunnel.field.local_network.help':
        'Local subnet carried over the tunnel, in CIDR, e.g. 192.168.0.0/24.',
      'task.cradlepoint-tunnel.field.remote_network.label': 'Remote network',
      'task.cradlepoint-tunnel.field.remote_network.help':
        'Remote subnet reached over the tunnel, in CIDR, e.g. 10.0.0.0/24.',
      'task.cradlepoint-tunnel.field.psk.label': 'Pre-shared key',
      'task.cradlepoint-tunnel.field.psk.help':
        'IPsec pre-shared key — a secret: never stored, logged, or shown in the preview; it goes only into the vaulted vars file. Ignored for GRE.',
    },
    fr: {
      'task.cradlepoint-tunnel.legend': 'Tunnel site à site',
      'task.cradlepoint-tunnel.field.name.label': 'Nom du tunnel',
      'task.cradlepoint-tunnel.field.name.help': 'Libellé du tunnel, par ex. to-hq.',
      'task.cradlepoint-tunnel.field.type.label': 'Type',
      'task.cradlepoint-tunnel.field.type.help':
        'IPsec (chiffré, utilise une clé pré-partagée) ou GRE (non chiffré).',
      'task.cradlepoint-tunnel.type.ipsec': 'IPsec',
      'task.cradlepoint-tunnel.type.gre': 'GRE',
      'task.cradlepoint-tunnel.field.remote_gateway.label': 'Passerelle distante',
      'task.cradlepoint-tunnel.field.remote_gateway.help':
        'IP publique du pair, par ex. 198.51.100.1.',
      'task.cradlepoint-tunnel.field.local_network.label': 'Réseau local',
      'task.cradlepoint-tunnel.field.local_network.help':
        'Sous-réseau local transporté par le tunnel, en CIDR, par ex. 192.168.0.0/24.',
      'task.cradlepoint-tunnel.field.remote_network.label': 'Réseau distant',
      'task.cradlepoint-tunnel.field.remote_network.help':
        'Sous-réseau distant atteint par le tunnel, en CIDR, par ex. 10.0.0.0/24.',
      'task.cradlepoint-tunnel.field.psk.label': 'Clé pré-partagée',
      'task.cradlepoint-tunnel.field.psk.help':
        'Clé pré-partagée IPsec — un secret : jamais stockée, journalisée ni affichée dans l’aperçu ; elle n’entre que dans le fichier de variables chiffré. Ignorée pour GRE.',
    },
  },
};
