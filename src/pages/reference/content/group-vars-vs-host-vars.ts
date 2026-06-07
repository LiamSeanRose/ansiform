import type { ReferenceModule } from '../types';

/**
 * Reference page: group_vars vs host_vars.
 * Generic, public Ansible knowledge only. High-intent SEO page that funnels to
 * the task library (reachable from the header nav).
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'group-vars-vs-host-vars',
      title: 'group_vars vs host_vars in Ansible: when to use each',
      description:
        'group_vars sets a value for a whole inventory group; host_vars overrides it for one host. How they differ, how precedence resolves conflicts, and the file layout.',
      lede: 'Both `group_vars` and `host_vars` hold inventory variables, and both are just YAML files Ansible loads automatically. The difference is scope: one applies to a group of hosts, the other to a single host — and when they disagree, host_vars wins.',
      sections: [
        {
          id: 'what-they-are',
          heading: 'What each one is',
          blocks: [
            {
              kind: 'p',
              text: '`group_vars/<group>.yml` defines variables for every host in an inventory group — for example a `core-switches` group or the built-in `all` group. `host_vars/<host>.yml` defines variables for one specific host. Ansible discovers both automatically by directory name; you never have to import them.',
            },
            {
              kind: 'p',
              text: 'Both live next to your inventory (or your playbook). A file under `group_vars/` is keyed by group name; a file under `host_vars/` is keyed by the host’s inventory name.',
            },
          ],
        },
        {
          id: 'precedence',
          heading: 'Which one wins',
          blocks: [
            {
              kind: 'p',
              text: 'When the same variable is set in both places, `host_vars` takes precedence over `group_vars`, because host scope is more specific than group scope. Among groups, a child group overrides its parent, and `all` is the broadest (lowest-precedence) group. Nothing is merged by default — the higher-precedence value replaces the lower one outright.',
            },
            {
              kind: 'p',
              text: 'That ordering is exactly what lets you layer configuration: a sensible default for the whole group, overridden per device only where a device differs.',
            },
          ],
        },
        {
          id: 'layout',
          heading: 'File layout at a glance',
          blocks: [
            {
              kind: 'table',
              columns: ['Path', 'Applies to', 'Typical use'],
              rows: [
                ['`group_vars/all.yml`', 'every host', 'org-wide defaults (DNS, NTP, syslog)'],
                ['`group_vars/<group>.yml`', 'hosts in that group', 'per-role or per-site settings'],
                ['`host_vars/<host>.yml`', 'one host', 'per-device values (IP address, hostname)'],
              ],
            },
          ],
        },
        {
          id: 'when',
          heading: 'When to use which',
          blocks: [
            {
              kind: 'list',
              items: [
                'Use `group_vars` for anything shared by a set of devices — a syslog server, an NTP pool, a standard ACL. Change it once and every member follows.',
                'Use `host_vars` for the values that are unique to a device — its management IP, its OSPF router-id, its hostname.',
                'When in doubt, start broad: put it in `group_vars` and only promote a key to `host_vars` when one host genuinely needs a different value.',
                'Avoid defining the same key in both unless you intend the host to override the group — duplication is what makes precedence surprising.',
              ],
            },
          ],
        },
        {
          id: 'example',
          heading: 'A small example',
          blocks: [
            {
              kind: 'p',
              text: 'Group default for every core switch, with one host overriding the MTU:',
            },
            {
              kind: 'code',
              text: '# group_vars/core-switches.yml\nmtu: 1500\nntp_server: 10.0.0.1\n\n# host_vars/switch1.yml\nmtu: 9216   # this host runs jumbo frames; overrides the group',
            },
            {
              kind: 'p',
              text: 'Ansiform writes exactly these files. Pick a scope of `group_vars` or `host_vars` for each task, fill the form, and download the result — open the Tasks library from the header to start. For the full ordering across every source, see the variable-precedence guide.',
            },
          ],
        },
      ],
    },
  },
};
