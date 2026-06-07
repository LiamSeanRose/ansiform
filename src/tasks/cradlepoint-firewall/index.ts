/**
 * Curated task: Cradlepoint NCOS zone firewall (issue #56).
 *
 * A security zone plus its zone-forwarding rules, rendered to the NCOS config-CLI
 * `set <path> <value>` form (the preview model from the #36 design record).
 * Companion to cradlepoint-lan / cradlepoint-static-route (#40). NCOS addresses
 * its config arrays positionally: the zone sits at index 0, and each forwarding
 * carries an explicit `seq` for its slot (the preview engine has no loop index,
 * and an operator-supplied index mirrors the NCOS array model).
 *
 * Honesty (#40): the YAML vars are always correct; the `set` preview is authored
 * from public NCOS docs and not device-verified, so the task declares
 * `fidelityFloor: 'approximate'` and the pane always shows the degrade notice.
 * The template uses no filters. Authored from generic public knowledge.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.cradlepoint-firewall.legend',
      fields: [
        {
          type: 'text',
          name: 'zone_name',
          label: 'task.cradlepoint-firewall.field.zone_name.label',
          help: 'task.cradlepoint-firewall.field.zone_name.help',
          required: true,
          placeholder: 'Primary-LAN',
        },
        {
          type: 'list',
          name: 'forwardings',
          label: 'task.cradlepoint-firewall.field.forwardings.label',
          help: 'task.cradlepoint-firewall.field.forwardings.help',
          required: true,
          minRows: 1,
          addLabel: 'task.cradlepoint-firewall.forwardings.add',
          removeLabel: 'task.cradlepoint-firewall.forwardings.remove',
          itemLabel: 'task.cradlepoint-firewall.forwardings.item',
          fields: [
            {
              type: 'number',
              name: 'seq',
              label: 'task.cradlepoint-firewall.field.seq.label',
              help: 'task.cradlepoint-firewall.field.seq.help',
              required: true,
              min: 0,
            },
            {
              type: 'text',
              name: 'dest_zone',
              label: 'task.cradlepoint-firewall.field.dest_zone.label',
              help: 'task.cradlepoint-firewall.field.dest_zone.help',
              required: true,
              placeholder: 'Internet',
            },
            {
              type: 'select',
              name: 'action',
              label: 'task.cradlepoint-firewall.field.action.label',
              help: 'task.cradlepoint-firewall.field.action.help',
              default: 'allow',
              options: [
                { value: 'allow', label: 'task.cradlepoint-firewall.action.allow' },
                { value: 'deny', label: 'task.cradlepoint-firewall.action.deny' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Cradlepoint NCOS config-CLI `set` form (preview-only, approximate).
// The zone is created at index 0; each forwarding writes three lines at its seq.
const template = [
  'set security/zfw/zones/0/name {{ zone_name }}',
  '{% for f in forwardings %}set security/zfw/forwardings/{{ f.seq }}/src_zone {{ zone_name }}',
  'set security/zfw/forwardings/{{ f.seq }}/dst_zone {{ f.dest_zone }}',
  'set security/zfw/forwardings/{{ f.seq }}/action {{ f.action }}',
  '{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'cradlepoint-firewall',
    title: 'Cradlepoint NCOS zone firewall',
    description:
      'Generate Ansible host_vars and a Cradlepoint NCOS zone firewall — a security zone and its zone-forwarding rules — with an approximate device-config preview.',
    vendor: 'cradlepoint-ncos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.cradlepoint-firewall.legend': 'Zone firewall',
      'task.cradlepoint-firewall.field.zone_name.label': 'Zone name',
      'task.cradlepoint-firewall.field.zone_name.help':
        'The security zone to define, e.g. Primary-LAN.',
      'task.cradlepoint-firewall.field.forwardings.label': 'Forwarding rules',
      'task.cradlepoint-firewall.field.forwardings.help':
        'Where traffic from this zone may go — one rule per destination zone.',
      'task.cradlepoint-firewall.forwardings.add': 'Add forwarding rule',
      'task.cradlepoint-firewall.forwardings.item': 'Forwarding rule {index}',
      'task.cradlepoint-firewall.forwardings.remove': 'Remove forwarding rule {index}',
      'task.cradlepoint-firewall.field.seq.label': 'Index',
      'task.cradlepoint-firewall.field.seq.help': 'Position of this rule in the forwardings list.',
      'task.cradlepoint-firewall.field.dest_zone.label': 'Destination zone',
      'task.cradlepoint-firewall.field.dest_zone.help':
        'The zone traffic is forwarded to, e.g. Internet.',
      'task.cradlepoint-firewall.field.action.label': 'Action',
      'task.cradlepoint-firewall.field.action.help': 'Allow or deny traffic to the destination zone.',
      'task.cradlepoint-firewall.action.allow': 'allow',
      'task.cradlepoint-firewall.action.deny': 'deny',
    },
    fr: {
      'task.cradlepoint-firewall.legend': 'Pare-feu de zones',
      'task.cradlepoint-firewall.field.zone_name.label': 'Nom de la zone',
      'task.cradlepoint-firewall.field.zone_name.help':
        'La zone de sécurité à définir, par ex. Primary-LAN.',
      'task.cradlepoint-firewall.field.forwardings.label': 'Règles de transfert',
      'task.cradlepoint-firewall.field.forwardings.help':
        'Où le trafic de cette zone peut aller — une règle par zone de destination.',
      'task.cradlepoint-firewall.forwardings.add': 'Ajouter une règle de transfert',
      'task.cradlepoint-firewall.forwardings.item': 'Règle de transfert {index}',
      'task.cradlepoint-firewall.forwardings.remove': 'Supprimer la règle de transfert {index}',
      'task.cradlepoint-firewall.field.seq.label': 'Index',
      'task.cradlepoint-firewall.field.seq.help': 'Position de cette règle dans la liste de transfert.',
      'task.cradlepoint-firewall.field.dest_zone.label': 'Zone de destination',
      'task.cradlepoint-firewall.field.dest_zone.help':
        'La zone vers laquelle le trafic est transféré, par ex. Internet.',
      'task.cradlepoint-firewall.field.action.label': 'Action',
      'task.cradlepoint-firewall.field.action.help':
        'Autoriser ou refuser le trafic vers la zone de destination.',
      'task.cradlepoint-firewall.action.allow': 'allow',
      'task.cradlepoint-firewall.action.deny': 'deny',
    },
  },
};
