/**
 * Curated task: Cisco ASA site-to-site IPsec VPN, IKEv2 (issue #75).
 *
 * A companion to the ASA firewall family. Emits a complete LAN-to-LAN IKEv2
 * tunnel: the IKEv2 policy and IPsec proposal, the protected-network ACL, the
 * `ipsec-l2l` tunnel-group with its pre-shared key, and the crypto map bound to
 * the outside interface. Its own firewall task family (`vendor: 'cisco-asa'`),
 * no per-vendor overlay.
 *
 * Secrets (council §5): the pre-shared key is a `secret` field — a password input
 * that is never stored, logged, encoded, or seeded with a default. It renders into
 * the live preview like any value (the preview is ephemeral and masks it in the
 * workbench), but never leaves the browser.
 *
 * Fidelity: the template uses no filters, so the preview is `exact`. Integrity is
 * fixed at SHA-256 — note ASA's own spelling quirk, `integrity sha256` in the
 * IKEv2 policy vs `protocol esp integrity sha-256` in the IPsec proposal — so the
 * encryption suite and DH group are the configurable knobs.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.asa-vpn.legend',
      fields: [
        {
          type: 'text',
          name: 'peer_ip',
          label: 'task.asa-vpn.field.peer_ip.label',
          help: 'task.asa-vpn.field.peer_ip.help',
          required: true,
          placeholder: '203.0.113.2',
          format: 'ipv4',
        },
        {
          type: 'secret',
          name: 'psk',
          label: 'task.asa-vpn.field.psk.label',
          help: 'task.asa-vpn.field.psk.help',
          required: true,
        },
        {
          type: 'text',
          name: 'local_network',
          label: 'task.asa-vpn.field.local_network.label',
          help: 'task.asa-vpn.field.local_network.help',
          required: true,
          placeholder: '10.0.0.0 255.255.255.0',
        },
        {
          type: 'text',
          name: 'remote_network',
          label: 'task.asa-vpn.field.remote_network.label',
          help: 'task.asa-vpn.field.remote_network.help',
          required: true,
          placeholder: '172.16.0.0 255.255.255.0',
        },
        {
          type: 'select',
          name: 'encryption',
          label: 'task.asa-vpn.field.encryption.label',
          help: 'task.asa-vpn.field.encryption.help',
          default: 'aes-256',
          options: [
            { value: 'aes-256', label: 'task.asa-vpn.enc.aes256' },
            { value: 'aes-192', label: 'task.asa-vpn.enc.aes192' },
            { value: 'aes', label: 'task.asa-vpn.enc.aes' },
          ],
        },
        {
          type: 'select',
          name: 'dh_group',
          label: 'task.asa-vpn.field.dh_group.label',
          help: 'task.asa-vpn.field.dh_group.help',
          default: '14',
          options: [
            { value: '14', label: 'task.asa-vpn.dh.14' },
            { value: '19', label: 'task.asa-vpn.dh.19' },
            { value: '20', label: 'task.asa-vpn.dh.20' },
            { value: '21', label: 'task.asa-vpn.dh.21' },
          ],
        },
        {
          type: 'text',
          name: 'outside_interface',
          label: 'task.asa-vpn.field.outside_interface.label',
          help: 'task.asa-vpn.field.outside_interface.help',
          default: 'outside',
        },
        {
          type: 'text',
          name: 'crypto_map',
          label: 'task.asa-vpn.field.crypto_map.label',
          help: 'task.asa-vpn.field.crypto_map.help',
          default: 'OUTSIDE_MAP',
        },
        {
          type: 'number',
          name: 'map_seq',
          label: 'task.asa-vpn.field.map_seq.label',
          help: 'task.asa-vpn.field.map_seq.help',
          default: 10,
          min: 1,
          max: 65535,
        },
        {
          type: 'text',
          name: 'acl_name',
          label: 'task.asa-vpn.field.acl_name.label',
          help: 'task.asa-vpn.field.acl_name.help',
          default: 'VPN-ACL',
        },
      ],
    },
  ],
};

// Jinja2 → Cisco ASA. A complete LAN-to-LAN IKEv2 tunnel; no filters, fixed
// ordering, so the preview is exact. Integrity is SHA-256 in both contexts, using
// ASA's two spellings (`sha256` for the IKEv2 policy, `sha-256` for ESP).
const template = [
  'crypto ikev2 policy 1',
  ' encryption {{ encryption }}',
  ' integrity sha256',
  ' group {{ dh_group }}',
  ' prf sha256',
  ' lifetime seconds 86400',
  'crypto ikev2 enable {{ outside_interface }}',
  'crypto ipsec ikev2 ipsec-proposal IKEV2-PROPOSAL',
  ' protocol esp encryption {{ encryption }}',
  ' protocol esp integrity sha-256',
  'access-list {{ acl_name }} extended permit ip {{ local_network }} {{ remote_network }}',
  'tunnel-group {{ peer_ip }} type ipsec-l2l',
  'tunnel-group {{ peer_ip }} ipsec-attributes',
  ' ikev2 remote-authentication pre-shared-key {{ psk }}',
  ' ikev2 local-authentication pre-shared-key {{ psk }}',
  'crypto map {{ crypto_map }} {{ map_seq }} match address {{ acl_name }}',
  'crypto map {{ crypto_map }} {{ map_seq }} set peer {{ peer_ip }}',
  'crypto map {{ crypto_map }} {{ map_seq }} set ikev2 ipsec-proposal IKEV2-PROPOSAL',
  'crypto map {{ crypto_map }} interface {{ outside_interface }}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'asa-vpn',
    title: 'Cisco ASA site-to-site VPN (IKEv2)',
    description:
      'Generate Ansible host_vars and a Cisco ASA site-to-site IKEv2 IPsec VPN — IKEv2 policy and proposal, protected-network ACL, tunnel-group with pre-shared key, and crypto map — with a live device-CLI preview.',
    vendor: 'cisco-asa',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'firewall1' },
  },
  messages: {
    en: {
      'task.asa-vpn.legend': 'Site-to-site IKEv2 VPN',
      'task.asa-vpn.field.peer_ip.label': 'Peer IP',
      'task.asa-vpn.field.peer_ip.help': 'Public IP of the remote VPN peer.',
      'task.asa-vpn.field.psk.label': 'Pre-shared key',
      'task.asa-vpn.field.psk.help':
        'IKEv2 pre-shared key, used for both local and remote authentication. Treated as a secret — never stored, logged, or seeded.',
      'task.asa-vpn.field.local_network.label': 'Local network',
      'task.asa-vpn.field.local_network.help':
        'Protected local subnet as address + mask, e.g. 10.0.0.0 255.255.255.0.',
      'task.asa-vpn.field.remote_network.label': 'Remote network',
      'task.asa-vpn.field.remote_network.help':
        'Protected remote subnet as address + mask, e.g. 172.16.0.0 255.255.255.0.',
      'task.asa-vpn.field.encryption.label': 'Encryption',
      'task.asa-vpn.field.encryption.help': 'Cipher for the IKEv2 policy and the ESP proposal.',
      'task.asa-vpn.field.dh_group.label': 'DH group',
      'task.asa-vpn.field.dh_group.help': 'Diffie-Hellman group for the IKEv2 policy.',
      'task.asa-vpn.field.outside_interface.label': 'Outside interface',
      'task.asa-vpn.field.outside_interface.help':
        'Interface nameif that terminates the tunnel and carries the crypto map, e.g. outside.',
      'task.asa-vpn.field.crypto_map.label': 'Crypto map name',
      'task.asa-vpn.field.crypto_map.help':
        'Name of the interface crypto map; must match any existing map on that interface.',
      'task.asa-vpn.field.map_seq.label': 'Crypto map sequence',
      'task.asa-vpn.field.map_seq.help': 'Sequence number for this peer entry in the crypto map.',
      'task.asa-vpn.field.acl_name.label': 'Protected-traffic ACL name',
      'task.asa-vpn.field.acl_name.help': 'Name of the ACL that matches local-to-remote traffic.',
      'task.asa-vpn.enc.aes256': 'AES-256',
      'task.asa-vpn.enc.aes192': 'AES-192',
      'task.asa-vpn.enc.aes': 'AES-128',
      'task.asa-vpn.dh.14': 'Group 14 (2048-bit)',
      'task.asa-vpn.dh.19': 'Group 19 (256-bit ECP)',
      'task.asa-vpn.dh.20': 'Group 20 (384-bit ECP)',
      'task.asa-vpn.dh.21': 'Group 21 (521-bit ECP)',
    },
    fr: {
      'task.asa-vpn.legend': 'VPN IKEv2 site à site',
      'task.asa-vpn.field.peer_ip.label': 'IP du pair',
      'task.asa-vpn.field.peer_ip.help': 'IP publique du pair VPN distant.',
      'task.asa-vpn.field.psk.label': 'Clé pré-partagée',
      'task.asa-vpn.field.psk.help':
        'Clé pré-partagée IKEv2, utilisée pour l’authentification locale et distante. Traitée comme un secret — jamais stockée, journalisée ni pré-remplie.',
      'task.asa-vpn.field.local_network.label': 'Réseau local',
      'task.asa-vpn.field.local_network.help':
        'Sous-réseau local protégé sous forme adresse + masque, par ex. 10.0.0.0 255.255.255.0.',
      'task.asa-vpn.field.remote_network.label': 'Réseau distant',
      'task.asa-vpn.field.remote_network.help':
        'Sous-réseau distant protégé sous forme adresse + masque, par ex. 172.16.0.0 255.255.255.0.',
      'task.asa-vpn.field.encryption.label': 'Chiffrement',
      'task.asa-vpn.field.encryption.help': 'Algorithme pour la politique IKEv2 et la proposition ESP.',
      'task.asa-vpn.field.dh_group.label': 'Groupe DH',
      'task.asa-vpn.field.dh_group.help': 'Groupe Diffie-Hellman pour la politique IKEv2.',
      'task.asa-vpn.field.outside_interface.label': 'Interface externe',
      'task.asa-vpn.field.outside_interface.help':
        'Nameif de l’interface qui termine le tunnel et porte le crypto map, par ex. outside.',
      'task.asa-vpn.field.crypto_map.label': 'Nom du crypto map',
      'task.asa-vpn.field.crypto_map.help':
        'Nom du crypto map d’interface ; doit correspondre à un map existant sur cette interface.',
      'task.asa-vpn.field.map_seq.label': 'Séquence du crypto map',
      'task.asa-vpn.field.map_seq.help': 'Numéro de séquence de cette entrée de pair dans le crypto map.',
      'task.asa-vpn.field.acl_name.label': 'Nom de l’ACL de trafic protégé',
      'task.asa-vpn.field.acl_name.help': 'Nom de l’ACL qui correspond au trafic local vers distant.',
      'task.asa-vpn.enc.aes256': 'AES-256',
      'task.asa-vpn.enc.aes192': 'AES-192',
      'task.asa-vpn.enc.aes': 'AES-128',
      'task.asa-vpn.dh.14': 'Groupe 14 (2048 bits)',
      'task.asa-vpn.dh.19': 'Groupe 19 (ECP 256 bits)',
      'task.asa-vpn.dh.20': 'Groupe 20 (ECP 384 bits)',
      'task.asa-vpn.dh.21': 'Groupe 21 (ECP 521 bits)',
    },
  },
};
