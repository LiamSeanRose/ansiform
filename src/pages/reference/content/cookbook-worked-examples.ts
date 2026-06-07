import type { ReferenceModule } from '../types';

/**
 * Reference page: worked examples / cookbook (issue #64).
 * End-to-end walkthroughs — fill a form, get the vars, reference them from a
 * playbook. Generic public knowledge only; no employer config.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'cookbook-worked-examples',
      title: 'Cookbook: from form to vars to playbook',
      description:
        'Worked end-to-end examples — fill an Ansiform form, get correct group_vars/host_vars, and reference them from a playbook. Single tasks and a composed set.',
      lede: 'Ansiform produces the inputs to your automation: you fill a friendly form, it gives you correct Ansible variables (with a device-CLI preview you can trust), and you keep the YAML. These walkthroughs show the whole loop — form → vars → playbook — for a single task, a group-wide task, and a composed multi-file set.',
      sections: [
        {
          id: 'workflow',
          heading: 'The workflow',
          blocks: [
            {
              kind: 'list',
              items: [
                'Open a task (browse them all at `/tasks`) and fill the form. The right pane previews the device CLI as you type.',
                'Copy the `group_vars`/`host_vars` YAML, or download it — the suggested file path is shown above the output.',
                'Drop the file into your inventory, then reference the variables from a playbook (examples below).',
                'Nothing you type leaves the browser; the YAML is always correct, and the preview flags itself when it can only approximate.',
              ],
            },
          ],
        },
        {
          id: 'host-vars',
          heading: 'Example 1 — an interface address (host_vars)',
          blocks: [
            {
              kind: 'p',
              text: 'Open the `interface-ip` task, set the interface to `GigabitEthernet0/1`, the address to `10.0.0.1/24`, MTU `1500`, and leave it enabled. The output pane suggests `host_vars/switch1.yml`:',
            },
            {
              kind: 'code',
              text: 'interface: GigabitEthernet0/1\nip_address: 10.0.0.1/24\nmtu: 1500\nenabled: true',
            },
            {
              kind: 'p',
              text: 'Save that as `host_vars/switch1.yml` in your inventory, then reference it from a playbook. The IP is split into address and mask exactly as the live preview showed it:',
            },
            {
              kind: 'code',
              text: "- hosts: switches\n  gather_facts: false\n  tasks:\n    - name: Configure the interface\n      cisco.ios.ios_config:\n        parents: \"interface {{ interface }}\"\n        lines:\n          - \"ip address {{ ip_address | ansible.utils.ipaddr('address') }} {{ ip_address | ansible.utils.ipaddr('netmask') }}\"\n          - \"mtu {{ mtu }}\"\n          - \"{{ 'no shutdown' if enabled else 'shutdown' }}\"",
            },
          ],
        },
        {
          id: 'group-vars',
          heading: 'Example 2 — syslog hosts for a group (group_vars)',
          blocks: [
            {
              kind: 'p',
              text: 'Some settings belong to a whole group rather than one device. Open the `syslog` task, set the trap level to `informational` and the source interface to `Loopback0`, and add a couple of hosts. The output suggests `group_vars/all.yml`:',
            },
            {
              kind: 'code',
              text: 'trap_level: informational\nsource_interface: Loopback0\nhosts:\n  - host: 192.0.2.50\n    transport: udp\n  - host: 192.0.2.51\n    vrf: Mgmt-intf\n    transport: tcp',
            },
            {
              kind: 'p',
              text: 'A loop in the playbook turns the list into one line per host:',
            },
            {
              kind: 'code',
              text: '- name: Configure syslog destinations\n  cisco.ios.ios_config:\n    lines:\n      - "logging source-interface {{ source_interface }}"\n      - "logging trap {{ trap_level }}"\n- name: Add each syslog host\n  cisco.ios.ios_config:\n    lines: "logging host {{ item.host }} transport {{ item.transport }}"\n  loop: "{{ hosts }}"',
            },
          ],
        },
        {
          id: 'compose',
          heading: 'Example 3 — compose a whole var-file set (/build)',
          blocks: [
            {
              kind: 'p',
              text: 'Real changes touch several tasks at once. The Build page (`/build`) is a task tray: add several tasks, fill each, pick a scope (group or host) per task, and it assembles a complete multi-file set in one pass.',
            },
            {
              kind: 'list',
              items: [
                'Add `interface-ip` scoped to host `switch1`, and `syslog` scoped to group `all`.',
                'Each task keeps its own preview; colliding keys across tasks are flagged by name — never silently merged.',
                'Download the set as a `.zip` and unzip it into your inventory: you get `host_vars/switch1.yml` and `group_vars/all.yml` together.',
              ],
            },
            {
              kind: 'p',
              text: 'The result is a correct, ready-to-commit `group_vars`/`host_vars` tree — not a merged or runnable playbook. You bring the playbook; Ansiform brings trustworthy variables.',
            },
          ],
        },
        {
          id: 'tips',
          heading: 'Tips that apply everywhere',
          blocks: [
            {
              kind: 'list',
              items: [
                'The YAML output is always correct — filters run at playbook runtime, not on your vars. Only the *preview* can be approximate, and it says so when it is.',
                'Switch the preview target to see another platform’s CLI (Cisco IOS / IOS-XE / IOS-XR / NX-OS / ASA, Arista EOS, Juniper Junos, Cradlepoint NCOS). The variables stay the same; only the rendered config changes.',
                'Secret fields are password inputs — never stored, logged, encoded, or shared. Keep secrets out of committed `group_vars` by using Vault or a lookup in the playbook.',
                'Already have a template? Paste it into the reader (`/reader`) to see the variables it expects before you build the form by hand.',
              ],
            },
          ],
        },
      ],
    },
    fr: {
      slug: 'cookbook-worked-examples',
      title: 'Recettes : du formulaire aux variables, puis au playbook',
      description:
        'Exemples de bout en bout — remplissez un formulaire Ansiform, obtenez des group_vars/host_vars corrects, et référencez-les depuis un playbook. Tâches simples et jeu composé.',
      lede: 'Ansiform produit les saisies de votre automatisation : vous remplissez un formulaire convivial, il vous donne des variables Ansible correctes (avec un aperçu CLI fiable), et vous conservez le YAML. Ces tutoriels montrent toute la boucle — formulaire → variables → playbook — pour une tâche simple, une tâche à l’échelle d’un groupe, et un jeu de fichiers composé.',
      sections: [
        {
          id: 'workflow',
          heading: 'Le workflow',
          blocks: [
            {
              kind: 'list',
              items: [
                'Ouvrez une tâche (toutes sont listées sur `/tasks`) et remplissez le formulaire. Le panneau de droite prévisualise la CLI de l’équipement à mesure que vous tapez.',
                'Copiez le YAML `group_vars`/`host_vars`, ou téléchargez-le — le chemin de fichier suggéré s’affiche au-dessus de la sortie.',
                'Déposez le fichier dans votre inventaire, puis référencez les variables depuis un playbook (exemples ci-dessous).',
                'Rien de ce que vous tapez ne quitte le navigateur ; le YAML est toujours correct, et l’aperçu se signale lorsqu’il ne peut qu’approcher le résultat.',
              ],
            },
          ],
        },
        {
          id: 'host-vars',
          heading: 'Exemple 1 — une adresse d’interface (host_vars)',
          blocks: [
            {
              kind: 'p',
              text: 'Ouvrez la tâche `interface-ip`, mettez l’interface à `GigabitEthernet0/1`, l’adresse à `10.0.0.1/24`, le MTU à `1500`, et laissez-la activée. Le panneau de sortie suggère `host_vars/switch1.yml` :',
            },
            {
              kind: 'code',
              text: 'interface: GigabitEthernet0/1\nip_address: 10.0.0.1/24\nmtu: 1500\nenabled: true',
            },
            {
              kind: 'p',
              text: 'Enregistrez cela sous `host_vars/switch1.yml` dans votre inventaire, puis référencez-le depuis un playbook. L’IP est scindée en adresse et masque exactement comme l’aperçu en direct le montrait :',
            },
            {
              kind: 'code',
              text: "- hosts: switches\n  gather_facts: false\n  tasks:\n    - name: Configure the interface\n      cisco.ios.ios_config:\n        parents: \"interface {{ interface }}\"\n        lines:\n          - \"ip address {{ ip_address | ansible.utils.ipaddr('address') }} {{ ip_address | ansible.utils.ipaddr('netmask') }}\"\n          - \"mtu {{ mtu }}\"\n          - \"{{ 'no shutdown' if enabled else 'shutdown' }}\"",
            },
          ],
        },
        {
          id: 'group-vars',
          heading: 'Exemple 2 — hôtes syslog pour un groupe (group_vars)',
          blocks: [
            {
              kind: 'p',
              text: 'Certains réglages relèvent d’un groupe entier plutôt que d’un seul équipement. Ouvrez la tâche `syslog`, mettez le niveau de trap à `informational` et l’interface source à `Loopback0`, puis ajoutez quelques hôtes. La sortie suggère `group_vars/all.yml` :',
            },
            {
              kind: 'code',
              text: 'trap_level: informational\nsource_interface: Loopback0\nhosts:\n  - host: 192.0.2.50\n    transport: udp\n  - host: 192.0.2.51\n    vrf: Mgmt-intf\n    transport: tcp',
            },
            {
              kind: 'p',
              text: 'Une boucle dans le playbook transforme la liste en une ligne par hôte :',
            },
            {
              kind: 'code',
              text: '- name: Configure syslog destinations\n  cisco.ios.ios_config:\n    lines:\n      - "logging source-interface {{ source_interface }}"\n      - "logging trap {{ trap_level }}"\n- name: Add each syslog host\n  cisco.ios.ios_config:\n    lines: "logging host {{ item.host }} transport {{ item.transport }}"\n  loop: "{{ hosts }}"',
            },
          ],
        },
        {
          id: 'compose',
          heading: 'Exemple 3 — composer un jeu complet de fichiers de variables (/build)',
          blocks: [
            {
              kind: 'p',
              text: 'Les vrais changements touchent plusieurs tâches à la fois. La page Build (`/build`) est un plateau de tâches : ajoutez plusieurs tâches, remplissez chacune, choisissez une portée (groupe ou hôte) par tâche, et elle assemble un jeu multi-fichiers complet en une seule passe.',
            },
            {
              kind: 'list',
              items: [
                'Ajoutez `interface-ip` avec la portée hôte `switch1`, et `syslog` avec la portée groupe `all`.',
                'Chaque tâche garde son propre aperçu ; les clés en conflit entre tâches sont signalées par leur nom — jamais fusionnées en silence.',
                'Téléchargez le jeu en `.zip` et décompressez-le dans votre inventaire : vous obtenez `host_vars/switch1.yml` et `group_vars/all.yml` ensemble.',
              ],
            },
            {
              kind: 'p',
              text: 'Le résultat est une arborescence `group_vars`/`host_vars` correcte et prête à valider — pas un playbook fusionné ni exécutable. Vous apportez le playbook ; Ansiform apporte des variables fiables.',
            },
          ],
        },
        {
          id: 'tips',
          heading: 'Des conseils valables partout',
          blocks: [
            {
              kind: 'list',
              items: [
                'La sortie YAML est toujours correcte — les filtres s’exécutent à l’exécution du playbook, pas sur vos variables. Seul l’*aperçu* peut être approximatif, et il le dit quand c’est le cas.',
                'Changez la cible d’aperçu pour voir la CLI d’une autre plateforme (Cisco IOS / IOS-XE / IOS-XR / NX-OS / ASA, Arista EOS, Juniper Junos, Cradlepoint NCOS). Les variables restent identiques ; seule la configuration rendue change.',
                'Les champs secrets sont des champs mot de passe — jamais stockés, journalisés, encodés ni partagés. Gardez les secrets hors des `group_vars` validés en utilisant Vault ou un lookup dans le playbook.',
                'Vous avez déjà un template ? Collez-le dans le lecteur (`/reader`) pour voir les variables qu’il attend avant de construire le formulaire à la main.',
              ],
            },
          ],
        },
      ],
    },
  },
};
