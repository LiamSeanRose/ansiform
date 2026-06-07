/**
 * Curated task: Juniper Junos system services (issue #54).
 *
 * A native Junos task (vendor `juniper-junos`, added as a preview platform in
 * #39): host-name plus NTP servers and syslog hosts, rendered to the flat Junos
 * `set …` configuration form (the authoritative paste-able preview per the #36
 * design record). NTP servers and syslog hosts are repeating lists; host-name is
 * a single scalar.
 *
 * Honesty (#40): the YAML vars are taken straight from the values and are always
 * correct. The `set` preview is authored from public Junos knowledge but not
 * device-verified, so the task declares `fidelityFloor: 'approximate'` — the
 * workbench/build clamp the render down so the pane always shows the degrade
 * notice and the preview never claims `exact`. The template uses no filters.
 * Authored from generic public knowledge — no employer config.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.junos-system.legend',
      fields: [
        {
          type: 'text',
          name: 'hostname',
          label: 'task.junos-system.field.hostname.label',
          help: 'task.junos-system.field.hostname.help',
          required: true,
          placeholder: 'mx1',
        },
        {
          type: 'list',
          name: 'ntp_servers',
          label: 'task.junos-system.field.ntp_servers.label',
          help: 'task.junos-system.field.ntp_servers.help',
          addLabel: 'task.junos-system.ntp.add',
          removeLabel: 'task.junos-system.ntp.remove',
          itemLabel: 'task.junos-system.ntp.item',
          fields: [
            {
              type: 'text',
              name: 'server',
              label: 'task.junos-system.field.server.label',
              help: 'task.junos-system.field.server.help',
              required: true,
              placeholder: '10.0.0.1',
            },
          ],
        },
        {
          type: 'list',
          name: 'syslog_hosts',
          label: 'task.junos-system.field.syslog_hosts.label',
          help: 'task.junos-system.field.syslog_hosts.help',
          addLabel: 'task.junos-system.syslog.add',
          removeLabel: 'task.junos-system.syslog.remove',
          itemLabel: 'task.junos-system.syslog.item',
          fields: [
            {
              type: 'text',
              name: 'host',
              label: 'task.junos-system.field.host.label',
              help: 'task.junos-system.field.host.help',
              required: true,
              placeholder: '10.0.0.5',
            },
          ],
        },
      ],
    },
  ],
};

// Jinja2 → Junos `set` form (preview-only, approximate). One line per NTP server
// and per syslog host; the host-name line is always present.
const template = [
  'set system host-name {{ hostname }}',
  '{% for n in ntp_servers %}set system ntp server {{ n.server }}',
  '{% endfor %}{% for s in syslog_hosts %}set system syslog host {{ s.host }} any any',
  '{% endfor %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'junos-system',
    title: 'Juniper Junos system services',
    description:
      'Generate Ansible host_vars and Juniper Junos system services — host-name, NTP servers, and syslog hosts — with an approximate device-config preview.',
    vendor: 'juniper-junos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'host', name: 'mx1' },
  },
  messages: {
    en: {
      'task.junos-system.legend': 'System services',
      'task.junos-system.field.hostname.label': 'Host-name',
      'task.junos-system.field.hostname.help': 'The device host-name, e.g. mx1.',
      'task.junos-system.field.ntp_servers.label': 'NTP servers',
      'task.junos-system.field.ntp_servers.help': 'NTP servers to sync time from — add one per server.',
      'task.junos-system.ntp.add': 'Add NTP server',
      'task.junos-system.ntp.item': 'NTP server {index}',
      'task.junos-system.ntp.remove': 'Remove NTP server {index}',
      'task.junos-system.field.server.label': 'Server address',
      'task.junos-system.field.server.help': 'NTP server address, e.g. 10.0.0.1.',
      'task.junos-system.field.syslog_hosts.label': 'Syslog hosts',
      'task.junos-system.field.syslog_hosts.help':
        'Remote syslog collectors (logged at “any any”) — add one per host.',
      'task.junos-system.syslog.add': 'Add syslog host',
      'task.junos-system.syslog.item': 'Syslog host {index}',
      'task.junos-system.syslog.remove': 'Remove syslog host {index}',
      'task.junos-system.field.host.label': 'Host address',
      'task.junos-system.field.host.help': 'Syslog host address, e.g. 10.0.0.5.',
    },
    fr: {
      'task.junos-system.legend': 'Services système',
      'task.junos-system.field.hostname.label': 'Host-name',
      'task.junos-system.field.hostname.help': 'Le nom d’hôte de l’équipement, par ex. mx1.',
      'task.junos-system.field.ntp_servers.label': 'Serveurs NTP',
      'task.junos-system.field.ntp_servers.help':
        'Serveurs NTP pour la synchronisation horaire — ajoutez-en un par serveur.',
      'task.junos-system.ntp.add': 'Ajouter un serveur NTP',
      'task.junos-system.ntp.item': 'Serveur NTP {index}',
      'task.junos-system.ntp.remove': 'Supprimer le serveur NTP {index}',
      'task.junos-system.field.server.label': 'Adresse du serveur',
      'task.junos-system.field.server.help': 'Adresse du serveur NTP, par ex. 10.0.0.1.',
      'task.junos-system.field.syslog_hosts.label': 'Hôtes syslog',
      'task.junos-system.field.syslog_hosts.help':
        'Collecteurs syslog distants (journalisés en « any any ») — ajoutez-en un par hôte.',
      'task.junos-system.syslog.add': 'Ajouter un hôte syslog',
      'task.junos-system.syslog.item': 'Hôte syslog {index}',
      'task.junos-system.syslog.remove': 'Supprimer l’hôte syslog {index}',
      'task.junos-system.field.host.label': 'Adresse de l’hôte',
      'task.junos-system.field.host.help': 'Adresse de l’hôte syslog, par ex. 10.0.0.5.',
    },
  },
};
