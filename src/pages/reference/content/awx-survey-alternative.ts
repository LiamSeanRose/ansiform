import type { ReferenceModule } from '../types';

/**
 * Reference page: the definitive "AWX / AAP Survey alternative" comparison (#89).
 *
 * Highest commercial-intent query in the space. Honest framing — Ansiform
 * generates the inputs; it is not a job runner — led by the product's headline
 * wow (validation + live preview) and closing with the shareable deep-link CTA.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'awx-survey-alternative',
      title: 'An offline alternative to AWX / AAP Surveys',
      description:
        'AWX/AAP Surveys need a controller. Ansiform gives the same friendly form for Ansible vars in the browser — live device-CLI preview, input validation, zero egress.',
      lede: "AWX/AAP Surveys are great once you run a controller. If you just want a friendly form that turns inputs into correct Ansible variables — with a live device-CLI preview, advisory validation that catches a fat-fingered IP or VLAN before it ships, and no infrastructure to stand up — a client-side tool covers the same need differently.",
      sections: [
        {
          id: 'what',
          heading: 'What an AWX/AAP Survey does',
          blocks: [
            {
              kind: 'p',
              text: 'A Survey attaches a simple web form to a job template. When someone launches the job, their answers are passed in as `extra_vars`, so non-experts can run a curated playbook by filling fields instead of editing YAML. It is a great front door — once you already run a controller.',
            },
          ],
        },
        {
          id: 'validation',
          heading: "The form that won't let you generate wrong network YAML",
          blocks: [
            {
              kind: 'p',
              text: "A Survey collects whatever you type — a typo'd IP or an out-of-range VLAN passes straight through to the job, and you find out when it fails (or worse, when it doesn't). Ansiform checks values as you go.",
            },
            {
              kind: 'list',
              items: [
                'An `ip_address` that is not a valid IPv4, or a CIDR that cannot be a prefix.',
                'A VLAN ID outside 1–4094 (and the IOS-reserved 1002–1005).',
                'An ASN outside 1–4294967295 (asplain) or asdot like `65000.1`.',
                'A malformed MAC, or a string that is not a plausible interface name.',
              ],
            },
            {
              kind: 'p',
              text: "The checks are advisory, never blocking: a `Treat as text` escape hatch is always there and the YAML still exports. The point is to catch the fat-finger before it reaches a device — not to argue with you.",
            },
            {
              kind: 'p',
              text: 'Above that sits a live device-CLI preview: your inputs render to the config you already read (`interface GigabitEthernet0/1` / `ip address ...`), so you see what the variables will *do* before a playbook ever runs — the one thing a Survey cannot show you.',
            },
          ],
        },
        {
          id: 'example',
          heading: 'From form to YAML to device CLI',
          blocks: [
            {
              kind: 'p',
              text: 'Fill a few fields for an interface and you get the exact `host_vars` you keep, plus the Cisco IOS it renders to (illustrative):',
            },
            {
              kind: 'code',
              text: [
                'You fill:',
                '  Interface     GigabitEthernet0/1',
                '  IPv4 address  10.0.0.1',
                '  Subnet mask   255.255.255.252',
                '',
                'host_vars/router1.yml  (what you commit):',
                '  interface: GigabitEthernet0/1',
                '  ip_address: 10.0.0.1',
                '  subnet_mask: 255.255.255.252',
                '',
                'Live preview (Cisco IOS):',
                '  interface GigabitEthernet0/1',
                '   ip address 10.0.0.1 255.255.255.252',
                '   no shutdown',
              ].join('\n'),
            },
          ],
        },
        {
          id: 'compare',
          heading: 'How Ansiform compares',
          blocks: [
            {
              kind: 'table',
              columns: ['', 'AWX / AAP Survey', 'Ansiform'],
              rows: [
                ['Where it runs', 'On the controller server', 'In your browser — no backend'],
                ['Setup', 'Stand up and maintain a controller', 'Open a static page — nothing to run'],
                ['Data flow', 'Through the controller and its database', "Never leaves the page (`connect-src 'none'`)"],
                ['Output', '`extra_vars` at job launch', '`group_vars`/`host_vars` YAML files you keep (+ AWX survey spec)'],
                ['Validation', 'None — values pass through as typed', 'Advisory IP/CIDR/IPv6/VLAN/ASN/MAC/interface checks'],
                ['Preview', 'None', 'Live device-CLI preview as you type'],
                ['Share a blank form', 'Share the controller URL (needs access + RBAC)', 'Share a link that pre-selects tasks — values never in the URL'],
                ['Air-gapped use', 'Needs a running controller', 'Static site — self-host or run from a folder'],
                ['Secrets', 'Stored as controller credentials', 'Password field — never stored, logged, or transmitted'],
                ['Cost', 'Controller infrastructure + ops', 'Free and open source (Apache-2.0)'],
              ],
            },
          ],
        },
        {
          id: 'limits',
          heading: 'Where Surveys fall short for *producing* variables',
          blocks: [
            {
              kind: 'list',
              items: [
                'They require a running AWX/AAP controller — overkill if you only want to produce variables.',
                'Answers flow through the controller and its database; the form is not something you can hand to a teammate as a file.',
                'There is no preview and no validation — you find out what the values do when the job runs.',
                'They are awkward for air-gapped or ad-hoc use, where spinning up a controller is not practical.',
              ],
            },
          ],
        },
        {
          id: 'when',
          heading: 'When to use which',
          blocks: [
            {
              kind: 'p',
              text: 'They are complementary, not competitors — one runs jobs, the other produces the inputs.',
            },
            { kind: 'p', text: 'Reach for Ansiform when:' },
            {
              kind: 'list',
              items: [
                'You want correct `group_vars`/`host_vars` you can commit and review, not a one-off job launch.',
                'You want a preview and validation before anything touches a device.',
                'You are air-gapped, or do not want to stand up a controller just to collect inputs.',
                'You want to hand a teammate a form to fill — as a link or a folder, not an account on your controller.',
              ],
            },
            { kind: 'p', text: 'Reach for an AWX/AAP Survey when:' },
            {
              kind: 'list',
              items: [
                'You need to actually run the playbook — with scheduling, RBAC, logging, and approvals.',
                'You already operate a controller and want non-experts launching curated jobs.',
                'You need the run history and audit trail a controller provides.',
              ],
            },
            {
              kind: 'p',
              text: 'Use both: generate correct vars in Ansiform, commit them to `group_vars`/`host_vars`, and let AWX/AAP run the playbook that consumes them. The friendly form and the controller coexist happily.',
            },
          ],
        },
        {
          id: 'share',
          heading: 'Share a form for a teammate to fill',
          blocks: [
            {
              kind: 'p',
              text: 'The build tray takes a deep link: send a coworker `/build?tasks=interface-ip,ospf` and the page opens with those tasks pre-selected, ready to fill. The link carries the task *selection* only — never any field value — so it is safe to drop in a ticket or a chat. Sharing a result is a file you export, never a URL with data in it.',
            },
          ],
        },
        {
          id: 'faq',
          heading: 'FAQ',
          blocks: [
            {
              kind: 'p',
              text: 'Is Ansiform a replacement for AWX/AAP? No. AWX/AAP runs your automation — scheduling, RBAC, logging, applying changes. Ansiform only produces the variables those jobs consume. Many teams use both.',
            },
            {
              kind: 'p',
              text: "Does it send my data anywhere? No. The app's Content-Security-Policy sets `connect-src 'none'`, so it can make no network request of any kind. Everything stays in the browser tab.",
            },
            {
              kind: 'p',
              text: 'Can I use it air-gapped? Yes. It is a static site — self-host the built folder behind your firewall, or open it from disk. There is no backend and nothing phones home.',
            },
            {
              kind: 'p',
              text: 'Does it run my playbooks? No. It generates `group_vars`/`host_vars` (and an AWX survey spec, if you want one). You commit or paste the output into your own workflow.',
            },
            {
              kind: 'p',
              text: 'What about secrets? Secret fields are password inputs that are never stored, logged, or put in a URL; the tool also shows the `ansible-vault encrypt_string` command so you vault the value yourself.',
            },
          ],
        },
      ],
    },
    fr: {
      slug: 'awx-survey-alternative',
      title: 'Une alternative hors ligne aux Surveys AWX / AAP',
      description:
        'Les Surveys AWX/AAP exigent un contrôleur. Ansiform offre le même formulaire pour vos variables Ansible dans le navigateur — aperçu CLI en direct, validation, sans sortie réseau.',
      lede: "Les Surveys AWX/AAP sont parfaits quand vous exploitez déjà un contrôleur. Si vous voulez seulement un formulaire convivial qui transforme des saisies en variables Ansible correctes — avec un aperçu CLI de l’équipement en direct, une validation qui repère une IP ou un VLAN mal saisis avant l’envoi, et aucune infrastructure à déployer — un outil côté client répond au même besoin autrement.",
      sections: [
        {
          id: 'what',
          heading: 'Ce que fait un Survey AWX/AAP',
          blocks: [
            {
              kind: 'p',
              text: 'Un Survey attache un simple formulaire web à un modèle de tâche. Au lancement, les réponses sont passées en `extra_vars`, ce qui permet à des non-experts d’exécuter un playbook prêt à l’emploi en remplissant des champs plutôt qu’en éditant du YAML. C’est une excellente porte d’entrée — quand vous exploitez déjà un contrôleur.',
            },
          ],
        },
        {
          id: 'validation',
          heading: 'Le formulaire qui vous empêche de générer du YAML réseau erroné',
          blocks: [
            {
              kind: 'p',
              text: 'Un Survey collecte tout ce que vous tapez — une IP mal saisie ou un VLAN hors plage passe directement dans la tâche, et vous le découvrez quand elle échoue (ou pire, quand elle réussit). Ansiform vérifie les valeurs au fil de la saisie.',
            },
            {
              kind: 'list',
              items: [
                'Un `ip_address` qui n’est pas une IPv4 valide, ou un CIDR qui ne peut pas être un préfixe.',
                'Un ID de VLAN hors de 1–4094 (et les 1002–1005 réservés sur IOS).',
                'Un ASN hors de 1–4294967295 (asplain) ou en asdot comme `65000.1`.',
                'Une MAC mal formée, ou une chaîne qui n’est pas un nom d’interface plausible.',
              ],
            },
            {
              kind: 'p',
              text: 'Les vérifications sont indicatives, jamais bloquantes : une échappatoire `Traiter comme du texte` est toujours là et le YAML s’exporte quand même. Le but est de repérer la faute de frappe avant qu’elle n’atteigne un équipement — pas de vous contredire.',
            },
            {
              kind: 'p',
              text: 'Au-dessus, un aperçu CLI en direct : vos saisies se rendent dans la configuration que vous connaissez déjà (`interface GigabitEthernet0/1` / `ip address ...`), pour voir ce que les variables *font* avant qu’un playbook ne s’exécute — la seule chose qu’un Survey ne peut pas montrer.',
            },
          ],
        },
        {
          id: 'example',
          heading: 'Du formulaire au YAML à la CLI de l’équipement',
          blocks: [
            {
              kind: 'p',
              text: 'Remplissez quelques champs pour une interface et vous obtenez les `host_vars` exacts que vous conservez, plus la configuration Cisco IOS rendue (à titre indicatif) :',
            },
            {
              kind: 'code',
              text: [
                'Vous remplissez :',
                '  Interface       GigabitEthernet0/1',
                '  Adresse IPv4    10.0.0.1',
                '  Masque          255.255.255.252',
                '',
                'host_vars/router1.yml  (ce que vous validez) :',
                '  interface: GigabitEthernet0/1',
                '  ip_address: 10.0.0.1',
                '  subnet_mask: 255.255.255.252',
                '',
                'Aperçu en direct (Cisco IOS) :',
                '  interface GigabitEthernet0/1',
                '   ip address 10.0.0.1 255.255.255.252',
                '   no shutdown',
              ].join('\n'),
            },
          ],
        },
        {
          id: 'compare',
          heading: 'Comment se situe Ansiform',
          blocks: [
            {
              kind: 'table',
              columns: ['', 'Survey AWX / AAP', 'Ansiform'],
              rows: [
                ['Où il s’exécute', 'Sur le serveur contrôleur', 'Dans votre navigateur — sans backend'],
                ['Mise en place', 'Déployer et maintenir un contrôleur', 'Ouvrir une page statique — rien à exécuter'],
                ['Flux de données', 'À travers le contrôleur et sa base de données', "Ne quitte jamais la page (`connect-src 'none'`)"],
                ['Sortie', '`extra_vars` au lancement', 'Fichiers YAML `group_vars`/`host_vars` (+ spec de survey AWX)'],
                ['Validation', 'Aucune — les valeurs passent telles quelles', 'Vérifs indicatives IP/CIDR/IPv6/VLAN/ASN/MAC/interface'],
                ['Aperçu', 'Aucun', 'Aperçu CLI de l’équipement en direct'],
                ['Partager un formulaire vierge', 'Partager l’URL du contrôleur (accès + RBAC requis)', 'Partager un lien présélectionnant des tâches — valeurs jamais dans l’URL'],
                ['Usage air-gap', 'Nécessite un contrôleur actif', 'Site statique — auto-hébergé ou lancé depuis un dossier'],
                ['Secrets', 'Stockés comme identifiants du contrôleur', 'Champ mot de passe — jamais stocké, journalisé ni transmis'],
                ['Coût', 'Infrastructure du contrôleur + exploitation', 'Libre et open source (Apache-2.0)'],
              ],
            },
          ],
        },
        {
          id: 'limits',
          heading: 'Les limites des Surveys pour *produire* des variables',
          blocks: [
            {
              kind: 'list',
              items: [
                'Ils exigent un contrôleur AWX/AAP en fonctionnement — disproportionné si vous voulez seulement produire des variables.',
                'Les réponses transitent par le contrôleur et sa base ; le formulaire n’est pas un fichier transmissible à un collègue.',
                'Il n’y a ni aperçu ni validation — vous découvrez l’effet des valeurs au moment de l’exécution.',
                'Ils sont peu pratiques en environnement isolé (air-gap) ou ponctuel, où monter un contrôleur n’est pas réaliste.',
              ],
            },
          ],
        },
        {
          id: 'when',
          heading: 'Quand utiliser l’un ou l’autre',
          blocks: [
            {
              kind: 'p',
              text: 'Ils sont complémentaires, pas concurrents — l’un exécute des tâches, l’autre produit les saisies.',
            },
            { kind: 'p', text: 'Choisissez Ansiform quand :' },
            {
              kind: 'list',
              items: [
                'Vous voulez des `group_vars`/`host_vars` corrects, à valider et relire, pas un lancement ponctuel.',
                'Vous voulez un aperçu et une validation avant que quoi que ce soit n’atteigne un équipement.',
                'Vous êtes en air-gap, ou ne voulez pas monter un contrôleur juste pour collecter des saisies.',
                'Vous voulez confier un formulaire à un collègue — par lien ou dossier, pas par un compte sur votre contrôleur.',
              ],
            },
            { kind: 'p', text: 'Choisissez un Survey AWX/AAP quand :' },
            {
              kind: 'list',
              items: [
                'Vous devez réellement exécuter le playbook — avec planification, RBAC, journalisation et approbations.',
                'Vous exploitez déjà un contrôleur et voulez que des non-experts lancent des tâches prêtes à l’emploi.',
                'Vous avez besoin de l’historique d’exécution et de la piste d’audit d’un contrôleur.',
              ],
            },
            {
              kind: 'p',
              text: 'Utilisez les deux : générez des variables correctes dans Ansiform, validez-les dans `group_vars`/`host_vars`, et laissez AWX/AAP exécuter le playbook qui les consomme. Le formulaire convivial et le contrôleur cohabitent sans problème.',
            },
          ],
        },
        {
          id: 'share',
          heading: 'Partager un formulaire à remplir',
          blocks: [
            {
              kind: 'p',
              text: 'Le plan de composition accepte un lien profond : envoyez à un collègue `/build?tasks=interface-ip,ospf` et la page s’ouvre avec ces tâches présélectionnées, prêtes à remplir. Le lien ne porte que la *sélection* de tâches — jamais une valeur de champ — il est donc sûr à coller dans un ticket ou un chat. Partager un résultat, c’est un fichier que vous exportez, jamais une URL contenant des données.',
            },
          ],
        },
        {
          id: 'faq',
          heading: 'FAQ',
          blocks: [
            {
              kind: 'p',
              text: 'Ansiform remplace-t-il AWX/AAP ? Non. AWX/AAP exécute votre automatisation — planification, RBAC, journalisation, application des changements. Ansiform produit seulement les variables que ces tâches consomment. Beaucoup d’équipes utilisent les deux.',
            },
            {
              kind: 'p',
              text: "Mes données sont-elles envoyées quelque part ? Non. La Content-Security-Policy de l’app fixe `connect-src 'none'`, donc elle ne peut émettre aucune requête réseau. Tout reste dans l’onglet du navigateur.",
            },
            {
              kind: 'p',
              text: 'Puis-je l’utiliser en air-gap ? Oui. C’est un site statique — auto-hébergez le dossier compilé derrière votre pare-feu, ou ouvrez-le depuis le disque. Aucun backend, rien qui ne « rappelle la maison ».',
            },
            {
              kind: 'p',
              text: 'Exécute-t-il mes playbooks ? Non. Il génère des `group_vars`/`host_vars` (et une spec de survey AWX, si vous le souhaitez). Vous validez ou collez la sortie dans votre propre flux de travail.',
            },
            {
              kind: 'p',
              text: 'Et les secrets ? Les champs secrets sont des champs mot de passe jamais stockés, journalisés ni mis dans une URL ; l’outil affiche aussi la commande `ansible-vault encrypt_string` pour que vous chiffriez la valeur vous-même.',
            },
          ],
        },
      ],
    },
  },
};
