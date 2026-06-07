/**
 * Curated task: Cradlepoint NCOS LAN network (issue #40).
 *
 * Cradlepoint NCOS (cellular / edge routers) is a non-line-CLI platform — its
 * config is a JSON object tree. Per the #36 design record
 * (`docs/design/non-cli-preview.md`) the preview renders the platform's native
 * config-CLI `set <path> <value>` form (line-oriented, robust to optional fields,
 * paste-able), NOT a fragile JSON fragment.
 *
 * Honesty (council §4 + #40): the YAML vars are taken straight from the values and
 * are ALWAYS correct. The preview, however, is authored from public NCOS docs and
 * is not device-verified, and NCOS arrays are addressed positionally here (index
 * `0` = the first/primary entry). So the task declares `fidelityFloor:
 * 'approximate'`: the workbench/build clamp the render down so the pane always
 * shows the degrade notice and the preview never claims `exact`. Authored from
 * generic public knowledge — no employer config.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.cradlepoint-lan.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.cradlepoint-lan.field.name.label',
          help: 'task.cradlepoint-lan.field.name.help',
          required: true,
          placeholder: 'Primary-LAN',
        },
        {
          type: 'text',
          name: 'ip_address',
          label: 'task.cradlepoint-lan.field.ip_address.label',
          help: 'task.cradlepoint-lan.field.ip_address.help',
          required: true,
          placeholder: '192.168.0.1/24',
          format: 'cidr',
        },
        {
          type: 'boolean',
          name: 'dhcp_enabled',
          label: 'task.cradlepoint-lan.field.dhcp_enabled.label',
          help: 'task.cradlepoint-lan.field.dhcp_enabled.help',
          default: true,
        },
        {
          type: 'text',
          name: 'dhcp_range_start',
          label: 'task.cradlepoint-lan.field.dhcp_range_start.label',
          help: 'task.cradlepoint-lan.field.dhcp_range_start.help',
          placeholder: '192.168.0.100',
          format: 'ipv4',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'dhcp_range_end',
          label: 'task.cradlepoint-lan.field.dhcp_range_end.label',
          help: 'task.cradlepoint-lan.field.dhcp_range_end.help',
          placeholder: '192.168.0.200',
          format: 'ipv4',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cradlepoint NCOS config-CLI `set` form (preview-only, approximate).
// The address is split into NCOS's separate ip_address + netmask via the
// exact-tier ipaddr filter; the DHCP range lines appear only when filled.
const template = [
  'set lan/0/name {{ name }}',
  "set lan/0/ip_address {{ ip_address | ipaddr('address') }}",
  "set lan/0/netmask {{ ip_address | ipaddr('netmask') }}",
  '{% if dhcp_enabled %}set lan/0/dhcpd/enabled true',
  '{% else %}set lan/0/dhcpd/enabled false',
  '{% endif %}{% if dhcp_range_start %}set lan/0/dhcpd/range_start {{ dhcp_range_start }}',
  '{% endif %}{% if dhcp_range_end %}set lan/0/dhcpd/range_end {{ dhcp_range_end }}',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'cradlepoint-lan',
    title: 'Cradlepoint NCOS LAN network',
    description:
      'Generate Ansible host_vars and a Cradlepoint NCOS LAN network — name, gateway address, and DHCP pool — with an approximate device-config preview.',
    vendor: 'cradlepoint-ncos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.cradlepoint-lan.legend': 'LAN network',
      'task.cradlepoint-lan.field.name.label': 'LAN name',
      'task.cradlepoint-lan.field.name.help': 'Label for the LAN network, e.g. Primary-LAN.',
      'task.cradlepoint-lan.field.ip_address.label': 'Gateway address',
      'task.cradlepoint-lan.field.ip_address.help':
        'Router LAN address with prefix, e.g. 192.168.0.1/24. Rendered as NCOS address + netmask.',
      'task.cradlepoint-lan.field.dhcp_enabled.label': 'DHCP server enabled',
      'task.cradlepoint-lan.field.dhcp_enabled.help': 'Hand out addresses on this LAN.',
      'task.cradlepoint-lan.field.dhcp_range_start.label': 'DHCP range start',
      'task.cradlepoint-lan.field.dhcp_range_start.help':
        'First address in the DHCP pool, e.g. 192.168.0.100. Omitted from the vars when blank.',
      'task.cradlepoint-lan.field.dhcp_range_end.label': 'DHCP range end',
      'task.cradlepoint-lan.field.dhcp_range_end.help':
        'Last address in the DHCP pool, e.g. 192.168.0.200. Omitted from the vars when blank.',
    },
    fr: {
      'task.cradlepoint-lan.legend': 'Réseau LAN',
      'task.cradlepoint-lan.field.name.label': 'Nom du LAN',
      'task.cradlepoint-lan.field.name.help': 'Libellé du réseau LAN, par ex. Primary-LAN.',
      'task.cradlepoint-lan.field.ip_address.label': 'Adresse de passerelle',
      'task.cradlepoint-lan.field.ip_address.help':
        'Adresse LAN du routeur avec préfixe, par ex. 192.168.0.1/24. Rendue en adresse + masque NCOS.',
      'task.cradlepoint-lan.field.dhcp_enabled.label': 'Serveur DHCP activé',
      'task.cradlepoint-lan.field.dhcp_enabled.help': 'Distribuer des adresses sur ce LAN.',
      'task.cradlepoint-lan.field.dhcp_range_start.label': 'Début de plage DHCP',
      'task.cradlepoint-lan.field.dhcp_range_start.help':
        'Première adresse de la plage DHCP, par ex. 192.168.0.100. Omise des variables si vide.',
      'task.cradlepoint-lan.field.dhcp_range_end.label': 'Fin de plage DHCP',
      'task.cradlepoint-lan.field.dhcp_range_end.help':
        'Dernière adresse de la plage DHCP, par ex. 192.168.0.200. Omise des variables si vide.',
    },
  },
};
