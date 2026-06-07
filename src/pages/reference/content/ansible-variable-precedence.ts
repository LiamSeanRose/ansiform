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
    fr: {
      slug: 'ansible-variable-precedence',
      title: 'La précédence des variables Ansible, expliquée',
      description:
        'Ansible combine des variables de nombreuses sources ; la précédence décide quelle valeur l’emporte. L’ordre complet du plus faible au plus fort, la place de group_vars/host_vars, et des conseils pratiques.',
      lede: 'Quand la même variable est définie à plusieurs endroits, Ansible ne renvoie pas d’erreur — il désigne un gagnant selon un ordre de précédence fixe. Connaître cet ordre fait toute la différence entre « pourquoi ma valeur est-elle ignorée ? » et des exécutions prévisibles.',
      sections: [
        {
          id: 'why',
          heading: 'Pourquoi la précédence compte',
          blocks: [
            {
              kind: 'p',
              text: 'Un seul hôte peut hériter d’une variable depuis les defaults d’un rôle, plusieurs fichiers group_vars, host_vars, les vars de play et la ligne de commande, tout à la fois. La précédence résout le conflit, et (avec le comportement par défaut `replace`) la source de priorité supérieure l’emporte entièrement plutôt que d’être fusionnée.',
            },
          ],
        },
        {
          id: 'order',
          heading: 'L’ordre de précédence (du plus faible au plus fort)',
          blocks: [
            {
              kind: 'p',
              text: 'Les éléments plus bas surchargent les plus hauts. Voici l’ordre documenté par Ansible :',
            },
            {
              kind: 'list',
              items: [
                'defaults de rôle (`roles/<role>/defaults/main.yml`) — le plus faible, fait pour être surchargé',
                'group vars du fichier ou script d’inventaire',
                'inventaire `group_vars/all`',
                'playbook `group_vars/all`',
                'inventaire `group_vars/*`',
                'playbook `group_vars/*`',
                'host vars du fichier ou script d’inventaire',
                'inventaire `host_vars/*`',
                'playbook `host_vars/*`',
                'facts de l’hôte et résultats `set_fact` mis en cache',
                '`vars` du play',
                '`vars_prompt` du play',
                '`vars_files` du play',
                'vars de rôle (`roles/<role>/vars/main.yml`)',
                'vars de bloc (pour les tâches du bloc)',
                'vars de tâche (pour cette tâche)',
                '`include_vars`',
                '`set_fact` / variables enregistrées',
                'paramètres de rôle et `include_role`',
                'paramètres `include`',
                'extra vars (`-e` / `--extra-vars`) — l’emportent toujours',
              ],
            },
          ],
        },
        {
          id: 'group-vs-host',
          heading: 'group_vars vs host_vars (ce qu’écrit Ansiform)',
          blocks: [
            {
              kind: 'p',
              text: 'Les deux relèvent de l’inventaire, mais `host_vars` est plus haut que `group_vars` : une valeur par hôte bat donc la valeur par défaut du groupe pour cet hôte. Entre groupes, un groupe enfant surcharge un parent, et `all` est le groupe le plus large (le plus bas).',
            },
            {
              kind: 'p',
              text: 'Ansiform génère exactement ces fichiers. Placez les valeurs par défaut larges dans `group_vars/<group>.yml` et les surcharges par équipement dans `host_vars/<host>.yml` ; la précédence ci-dessus explique pourquoi cette superposition se comporte comme attendu.',
            },
          ],
        },
        {
          id: 'always-wins',
          heading: 'Les deux choses à retenir',
          blocks: [
            {
              kind: 'list',
              items: [
                'Les extra vars `-e` surchargent tout — pratique pour des exécutions ponctuelles, dangereux en habitude car elles battent silencieusement votre inventaire.',
                'Les `defaults/` de rôle sont les plus faibles par conception — réservez-les aux valeurs de repli sensées, pas aux valeurs censées tenir.',
              ],
            },
          ],
        },
        {
          id: 'tips',
          heading: 'Conseils pratiques',
          blocks: [
            {
              kind: 'list',
              items: [
                'Définissez chaque variable en aussi peu d’endroits que possible ; c’est la duplication qui rend la précédence mordante.',
                'Préférez `group_vars`/`host_vars` aux `vars` de play pour les données d’inventaire — cela garde la configuration avec l’inventaire, pas avec le playbook.',
                'Recourez à `combine` (pour les dictionnaires) ou `default(omit)` au lieu de redéfinir toute une variable à un niveau supérieur.',
                'Quand une valeur semble ignorée, parcourez la liste ci-dessus de bas en haut — quelque chose de plus haut la surcharge.',
              ],
            },
          ],
        },
      ],
    },
  },
};
