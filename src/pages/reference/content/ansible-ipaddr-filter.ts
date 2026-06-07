import type { ReferenceModule } from '../types';

/**
 * Reference page: the Ansible ipaddr filter.
 * Generic, public Ansible knowledge only. Query outputs match Ansible's ipaddr
 * (IPv4) for the example input.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-ipaddr-filter',
      title: 'The Ansible ipaddr filter: a practical guide',
      description:
        'The ipaddr filter turns an IP or CIDR into the part you need — address, netmask, network, or prefix. Common queries with examples, plus the gotchas.',
      lede: 'Network configs almost never want the value exactly as typed. You store `10.0.0.5/24`, but the device wants `10.0.0.5` and `255.255.255.0` on separate lines. The `ipaddr` filter does that conversion at playbook runtime so you can keep one clean variable.',
      sections: [
        {
          id: 'what-it-does',
          heading: 'What it does',
          blocks: [
            {
              kind: 'p',
              text: '`ipaddr` takes an address or CIDR on its left and a query string on its right, and returns the requested piece: `{{ ip | ipaddr("netmask") }}`. It is part of `ansible.utils` (formerly `ansible.netcommon`) and needs the `netaddr` Python library on the control node. Filters run at runtime, against your variables — they never change the stored value.',
            },
          ],
        },
        {
          id: 'common-queries',
          heading: 'Common queries',
          blocks: [
            {
              kind: 'p',
              text: 'With the input `10.0.0.5/24`:',
            },
            {
              kind: 'table',
              columns: ['Query', 'Result', 'Use for'],
              rows: [
                ['`ipaddr("address")`', '`10.0.0.5`', 'the host address, no prefix'],
                ['`ipaddr("netmask")`', '`255.255.255.0`', 'a dotted mask (e.g. IOS `ip address`)'],
                ['`ipaddr("network")`', '`10.0.0.0`', 'the network address (e.g. OSPF, routes)'],
                ['`ipaddr("prefix")`', '`24`', 'the prefix length as a number'],
                ['`ipaddr("broadcast")`', '`10.0.0.255`', 'the broadcast address'],
                ['`ipaddr("network/prefix")`', '`10.0.0.0/24`', 'the network in CIDR form'],
              ],
            },
          ],
        },
        {
          id: 'examples',
          heading: 'In a template',
          blocks: [
            {
              kind: 'p',
              text: 'A single `ip_address` variable feeds an entire interface stanza:',
            },
            {
              kind: 'code',
              text: 'interface {{ interface }}\n ip address {{ ip_address | ipaddr("address") }} {{ ip_address | ipaddr("netmask") }}\n\n# with ip_address: 10.0.0.5/24  →\ninterface GigabitEthernet0/1\n ip address 10.0.0.5 255.255.255.0',
            },
          ],
        },
        {
          id: 'gotchas',
          heading: 'Gotchas',
          blocks: [
            {
              kind: 'list',
              items: [
                'Invalid input returns `false`, not an error — `{{ "not-an-ip" | ipaddr("address") }}` evaluates to `False`. Guard it or validate your inputs first.',
                'The filter needs `netaddr` installed on the control node; a missing library is a common first-run failure.',
                'A plain host IP with no prefix (`10.0.0.5`) is treated as a `/32`; pass the CIDR when you need the real mask.',
                'IPv6 and the more exotic queries exist too, but stick to the handful above for day-to-day interface and routing config.',
              ],
            },
          ],
        },
        {
          id: 'preview',
          heading: 'Seeing it before you run',
          blocks: [
            {
              kind: 'p',
              text: 'Ansiform renders `ipaddr` exactly — the address, netmask, network, and prefix queries match Ansible — so the live device-CLI preview shows the real result as you type. Tasks that take an IP, such as the interface and routing tasks in the library, use it under the hood. Open the Tasks library from the header to try one.',
            },
          ],
        },
      ],
    },
    fr: {
      slug: 'ansible-ipaddr-filter',
      title: 'Le filtre ipaddr d’Ansible : guide pratique',
      description:
        'Le filtre ipaddr extrait d’une IP ou d’un CIDR la partie voulue — adresse, masque, réseau ou préfixe. Requêtes courantes avec exemples, et les pièges à éviter.',
      lede: 'Les configurations réseau veulent presque jamais la valeur telle que saisie. Vous stockez `10.0.0.5/24`, mais l’équipement attend `10.0.0.5` et `255.255.255.0` sur des lignes séparées. Le filtre `ipaddr` fait cette conversion à l’exécution du playbook, ce qui vous permet de garder une seule variable propre.',
      sections: [
        {
          id: 'what-it-does',
          heading: 'Ce qu’il fait',
          blocks: [
            {
              kind: 'p',
              text: '`ipaddr` prend une adresse ou un CIDR à sa gauche et une chaîne de requête à sa droite, et renvoie l’élément demandé : `{{ ip | ipaddr("netmask") }}`. Il fait partie de `ansible.utils` (anciennement `ansible.netcommon`) et nécessite la bibliothèque Python `netaddr` sur le nœud de contrôle. Les filtres s’exécutent à l’exécution, sur vos variables — ils ne modifient jamais la valeur stockée.',
            },
          ],
        },
        {
          id: 'common-queries',
          heading: 'Requêtes courantes',
          blocks: [
            {
              kind: 'p',
              text: 'Avec l’entrée `10.0.0.5/24` :',
            },
            {
              kind: 'table',
              columns: ['Requête', 'Résultat', 'Sert à'],
              rows: [
                ['`ipaddr("address")`', '`10.0.0.5`', 'l’adresse de l’hôte, sans préfixe'],
                ['`ipaddr("netmask")`', '`255.255.255.0`', 'un masque pointé (ex. IOS `ip address`)'],
                ['`ipaddr("network")`', '`10.0.0.0`', 'l’adresse réseau (ex. OSPF, routes)'],
                ['`ipaddr("prefix")`', '`24`', 'la longueur de préfixe sous forme de nombre'],
                ['`ipaddr("broadcast")`', '`10.0.0.255`', 'l’adresse de diffusion'],
                ['`ipaddr("network/prefix")`', '`10.0.0.0/24`', 'le réseau en notation CIDR'],
              ],
            },
          ],
        },
        {
          id: 'examples',
          heading: 'Dans un template',
          blocks: [
            {
              kind: 'p',
              text: 'Une seule variable `ip_address` alimente toute une section d’interface :',
            },
            {
              kind: 'code',
              text: 'interface {{ interface }}\n ip address {{ ip_address | ipaddr("address") }} {{ ip_address | ipaddr("netmask") }}\n\n# with ip_address: 10.0.0.5/24  →\ninterface GigabitEthernet0/1\n ip address 10.0.0.5 255.255.255.0',
            },
          ],
        },
        {
          id: 'gotchas',
          heading: 'Pièges',
          blocks: [
            {
              kind: 'list',
              items: [
                'Une entrée invalide renvoie `false`, pas une erreur — `{{ "not-an-ip" | ipaddr("address") }}` vaut `False`. Protégez-vous ou validez vos saisies d’abord.',
                'Le filtre exige `netaddr` installé sur le nœud de contrôle ; une bibliothèque manquante est un échec courant à la première exécution.',
                'Une simple IP d’hôte sans préfixe (`10.0.0.5`) est traitée comme un `/32` ; passez le CIDR quand vous avez besoin du vrai masque.',
                'IPv6 et les requêtes plus exotiques existent aussi, mais tenez-vous-en à la poignée ci-dessus pour la configuration quotidienne d’interfaces et de routage.',
              ],
            },
          ],
        },
        {
          id: 'preview',
          heading: 'Le voir avant d’exécuter',
          blocks: [
            {
              kind: 'p',
              text: 'Ansiform rend `ipaddr` exactement — les requêtes address, netmask, network et prefix correspondent à Ansible — de sorte que l’aperçu CLI en direct montre le résultat réel à mesure que vous tapez. Les tâches qui prennent une IP, comme les tâches d’interface et de routage de la bibliothèque, l’utilisent en interne. Ouvrez la bibliothèque de tâches depuis l’en-tête pour en essayer une.',
            },
          ],
        },
      ],
    },
  },
};
