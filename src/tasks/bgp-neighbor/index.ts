/**
 * Curated task: Cisco IOS BGP neighbor (issue #8).
 *
 * Cloned from the interface-ip reference (#6): a correct-by-construction schema,
 * a Jinja2 template that renders to device CLI, task-scoped copy, and a default
 * output scope. Auto-registers via `src/tasks/registry.ts` — no shared edits.
 *
 * Correctness (council §4): the YAML vars are taken straight from the values and
 * are always correct. The template uses no filters, so the device-CLI preview is
 * always `exact`. The BGP MD5 password is a `secret` (§5): omitted from the vars
 * when blank and masked in the preview by the workbench (#6).
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.bgp-neighbor.legend',
      fields: [
        {
          type: 'number',
          name: 'local_as',
          label: 'task.bgp-neighbor.field.local_as.label',
          help: 'task.bgp-neighbor.field.local_as.help',
          required: true,
          min: 1,
          max: 4294967295,
        },
        {
          type: 'text',
          name: 'peer_ip',
          label: 'task.bgp-neighbor.field.peer_ip.label',
          help: 'task.bgp-neighbor.field.peer_ip.help',
          required: true,
          placeholder: '10.0.0.2',
          pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$',
        },
        {
          type: 'number',
          name: 'remote_as',
          label: 'task.bgp-neighbor.field.remote_as.label',
          help: 'task.bgp-neighbor.field.remote_as.help',
          required: true,
          min: 1,
          max: 4294967295,
        },
        {
          type: 'text',
          name: 'description',
          label: 'task.bgp-neighbor.field.description.label',
          help: 'task.bgp-neighbor.field.description.help',
          placeholder: 'ISP uplink',
          omitWhenBlank: true,
        },
        {
          type: 'secret',
          name: 'password',
          label: 'task.bgp-neighbor.field.password.label',
          help: 'task.bgp-neighbor.field.password.help',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Jinja2 → Cisco IOS. Authored for Ansible's environment (trim_blocks=True): the
// newline after each `{% endif %}` is swallowed, so optional lines leave no gap.
const template = [
  'router bgp {{ local_as }}',
  ' neighbor {{ peer_ip }} remote-as {{ remote_as }}',
  '{% if description %} neighbor {{ peer_ip }} description {{ description }}',
  '{% endif %}{% if password %} neighbor {{ peer_ip }} password {{ password }}',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'bgp-neighbor',
    title: 'Cisco IOS BGP neighbor',
    description:
      'Generate Ansible host_vars and a Cisco IOS BGP neighbor configuration — local AS, peer address, remote AS, description, and an optional MD5 password — with a live device-CLI preview.',
    schema,
    template,
    templates: {
      // IOS-XE renders identical BGP neighbor CLI (#27): an explicit per-vendor
      // claim, not an inference — same schema, same vars.
      'cisco-iosxe': template,
      // EOS uses the same flat `neighbor … remote-as/description/password` form,
      // but this has not had a curated-correctness pass — ship approximate so the
      // preview shows the degrade banner. (NX-OS configures the neighbor in a
      // submode, a genuinely different model, so it is omitted rather than guessed.)
      'arista-eos': { template, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.bgp-neighbor.legend': 'BGP neighbor',
      'task.bgp-neighbor.field.local_as.label': 'Local AS',
      'task.bgp-neighbor.field.local_as.help': 'This router’s BGP autonomous system number.',
      'task.bgp-neighbor.field.peer_ip.label': 'Neighbor IP',
      'task.bgp-neighbor.field.peer_ip.help': 'IPv4 address of the BGP peer, e.g. 10.0.0.2.',
      'task.bgp-neighbor.field.remote_as.label': 'Remote AS',
      'task.bgp-neighbor.field.remote_as.help': 'The neighbor’s autonomous system number.',
      'task.bgp-neighbor.field.description.label': 'Description',
      'task.bgp-neighbor.field.description.help':
        'Optional neighbor description. Omitted from the vars when left blank.',
      'task.bgp-neighbor.field.password.label': 'MD5 password',
      'task.bgp-neighbor.field.password.help':
        'Optional BGP session password. Never stored or logged; omitted when blank.',
    },
    fr: {
      'task.bgp-neighbor.legend': 'Voisin BGP',
      'task.bgp-neighbor.field.local_as.label': 'AS local',
      'task.bgp-neighbor.field.local_as.help':
        'Numéro de système autonome BGP de ce routeur.',
      'task.bgp-neighbor.field.peer_ip.label': 'IP du voisin',
      'task.bgp-neighbor.field.peer_ip.help': 'Adresse IPv4 du pair BGP, par ex. 10.0.0.2.',
      'task.bgp-neighbor.field.remote_as.label': 'AS distant',
      'task.bgp-neighbor.field.remote_as.help': 'Numéro de système autonome du voisin.',
      'task.bgp-neighbor.field.description.label': 'Description',
      'task.bgp-neighbor.field.description.help':
        'Description facultative du voisin. Omise des variables si laissée vide.',
      'task.bgp-neighbor.field.password.label': 'Mot de passe MD5',
      'task.bgp-neighbor.field.password.help':
        'Mot de passe facultatif de session BGP. Jamais stocké ni journalisé ; omis si vide.',
    },
  },
};
