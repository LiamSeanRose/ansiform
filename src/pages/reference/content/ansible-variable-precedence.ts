import type { ReferenceModule } from '../types';

/**
 * Reference page: Ansible variable precedence.
 * Generic, public Ansible knowledge only. The ordered list follows the official
 * Ansible precedence documentation (low → high).
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-variable-precedence',
      title: 'Ansible variable precedence, explained',
      description:
        'Ansible merges variables from many sources; precedence decides which value wins. The full order from low to high, where group_vars/host_vars sit, and practical tips.',
      lede: 'When the same variable is defined in more than one place, Ansible does not error — it picks a winner using a fixed precedence order. Knowing that order is the difference between "why is my value being ignored?" and predictable runs.',
      sections: [
        {
          id: 'why',
          heading: 'Why precedence matters',
          blocks: [
            {
              kind: 'p',
              text: 'A single host can inherit a variable from role defaults, several group_vars files, host_vars, play vars, and the command line all at once. Precedence is what resolves the conflict, and (with the default `replace` behavior) the higher-precedence source wins outright rather than being merged.',
            },
          ],
        },
        {
          id: 'order',
          heading: 'The precedence order (low to high)',
          blocks: [
            {
              kind: 'p',
              text: 'Later items override earlier ones. This is the order Ansible documents:',
            },
            {
              kind: 'list',
              items: [
                'role defaults (`roles/<role>/defaults/main.yml`) — the weakest, meant to be overridden',
                'inventory file or script group vars',
                'inventory `group_vars/all`',
                'playbook `group_vars/all`',
                'inventory `group_vars/*`',
                'playbook `group_vars/*`',
                'inventory file or script host vars',
                'inventory `host_vars/*`',
                'playbook `host_vars/*`',
                'host facts and cached `set_fact` results',
                'play `vars`',
                'play `vars_prompt`',
                'play `vars_files`',
                'role vars (`roles/<role>/vars/main.yml`)',
                'block vars (for tasks in the block)',
                'task vars (for that one task)',
                '`include_vars`',
                '`set_fact` / registered vars',
                'role and `include_role` params',
                '`include` params',
                'extra vars (`-e` / `--extra-vars`) — always win',
              ],
            },
          ],
        },
        {
          id: 'group-vs-host',
          heading: 'group_vars vs host_vars (what Ansiform writes)',
          blocks: [
            {
              kind: 'p',
              text: 'Both are inventory-scoped, but `host_vars` sits higher than `group_vars`, so a per-host value beats the group default for that host. Within groups, a child group overrides a parent, and `all` is the broadest (lowest) group.',
            },
            {
              kind: 'p',
              text: 'Ansiform generates exactly these files. Put broad defaults in `group_vars/<group>.yml` and per-device overrides in `host_vars/<host>.yml`; the precedence above is why that layering behaves the way you expect.',
            },
          ],
        },
        {
          id: 'always-wins',
          heading: 'The two things to remember',
          blocks: [
            {
              kind: 'list',
              items: [
                '`-e` extra vars override everything — handy for one-off runs, dangerous as a habit because they silently beat your inventory.',
                'role `defaults/` are the weakest by design — use them for sensible fallbacks, not for values you expect to stick.',
              ],
            },
          ],
        },
        {
          id: 'tips',
          heading: 'Practical tips',
          blocks: [
            {
              kind: 'list',
              items: [
                'Define each variable in as few places as possible; duplication is what makes precedence bite.',
                'Prefer `group_vars`/`host_vars` over play `vars` for inventory data — it keeps configuration with the inventory, not the playbook.',
                'Reach for `combine` (for dicts) or `default(omit)` instead of redefining a whole variable at a higher level.',
                'When a value seems ignored, check the list above from the bottom up — something higher is overriding it.',
              ],
            },
          ],
        },
      ],
    },
  },
};
