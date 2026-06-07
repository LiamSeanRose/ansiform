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
    fr: {
      slug: 'group-vars-vs-host-vars',
      title: 'group_vars vs host_vars dans Ansible : quand utiliser chacun',
      description:
        'group_vars définit une valeur pour tout un groupe d’inventaire ; host_vars la surcharge pour un hôte. Leurs différences, comment la précédence règle les conflits, et l’organisation des fichiers.',
      lede: 'Les `group_vars` et les `host_vars` contiennent tous deux des variables d’inventaire, et ce sont de simples fichiers YAML qu’Ansible charge automatiquement. La différence est la portée : l’un s’applique à un groupe d’hôtes, l’autre à un seul hôte — et en cas de désaccord, host_vars l’emporte.',
      sections: [
        {
          id: 'what-they-are',
          heading: 'Ce qu’est chacun',
          blocks: [
            {
              kind: 'p',
              text: '`group_vars/<group>.yml` définit des variables pour chaque hôte d’un groupe d’inventaire — par exemple un groupe `core-switches` ou le groupe intégré `all`. `host_vars/<host>.yml` définit des variables pour un hôte précis. Ansible les découvre automatiquement par nom de répertoire ; vous n’avez jamais à les importer.',
            },
            {
              kind: 'p',
              text: 'Les deux se trouvent à côté de votre inventaire (ou de votre playbook). Un fichier sous `group_vars/` est indexé par nom de groupe ; un fichier sous `host_vars/` est indexé par le nom d’inventaire de l’hôte.',
            },
          ],
        },
        {
          id: 'precedence',
          heading: 'Lequel l’emporte',
          blocks: [
            {
              kind: 'p',
              text: 'Quand la même variable est définie aux deux endroits, `host_vars` a la priorité sur `group_vars`, car la portée hôte est plus spécifique que la portée groupe. Entre groupes, un groupe enfant surcharge son parent, et `all` est le groupe le plus large (priorité la plus basse). Rien n’est fusionné par défaut — la valeur de priorité supérieure remplace purement et simplement la valeur inférieure.',
            },
            {
              kind: 'p',
              text: 'C’est précisément cet ordre qui permet de superposer la configuration : une valeur par défaut sensée pour tout le groupe, surchargée par équipement seulement là où un équipement diffère.',
            },
          ],
        },
        {
          id: 'layout',
          heading: 'L’organisation des fichiers en un coup d’œil',
          blocks: [
            {
              kind: 'table',
              columns: ['Chemin', 'S’applique à', 'Usage typique'],
              rows: [
                ['`group_vars/all.yml`', 'chaque hôte', 'valeurs par défaut de l’organisation (DNS, NTP, syslog)'],
                ['`group_vars/<group>.yml`', 'hôtes de ce groupe', 'réglages par rôle ou par site'],
                ['`host_vars/<host>.yml`', 'un seul hôte', 'valeurs par équipement (adresse IP, hostname)'],
              ],
            },
          ],
        },
        {
          id: 'when',
          heading: 'Quand utiliser l’un ou l’autre',
          blocks: [
            {
              kind: 'list',
              items: [
                'Utilisez `group_vars` pour tout ce qui est partagé par un ensemble d’équipements — un serveur syslog, un pool NTP, une ACL standard. Modifiez-le une fois et chaque membre suit.',
                'Utilisez `host_vars` pour les valeurs propres à un équipement — son IP de gestion, son router-id OSPF, son hostname.',
                'En cas de doute, commencez large : placez-le dans `group_vars` et ne promouvez une clé vers `host_vars` que lorsqu’un hôte a réellement besoin d’une valeur différente.',
                'Évitez de définir la même clé aux deux endroits sauf si vous voulez que l’hôte surcharge le groupe — c’est la duplication qui rend la précédence surprenante.',
              ],
            },
          ],
        },
        {
          id: 'example',
          heading: 'Un petit exemple',
          blocks: [
            {
              kind: 'p',
              text: 'Valeur par défaut du groupe pour chaque switch de cœur, avec un hôte qui surcharge le MTU :',
            },
            {
              kind: 'code',
              text: '# group_vars/core-switches.yml\nmtu: 1500\nntp_server: 10.0.0.1\n\n# host_vars/switch1.yml\nmtu: 9216   # this host runs jumbo frames; overrides the group',
            },
            {
              kind: 'p',
              text: 'Ansiform écrit exactement ces fichiers. Choisissez une portée `group_vars` ou `host_vars` pour chaque tâche, remplissez le formulaire et téléchargez le résultat — ouvrez la bibliothèque de tâches depuis l’en-tête pour commencer. Pour l’ordre complet entre toutes les sources, voir le guide sur la précédence des variables.',
            },
          ],
        },
      ],
    },
  },
};
