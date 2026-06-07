import type { ReferenceModule } from '../types';

/**
 * Reference page: per-vendor landing — Cisco NX-OS. Generic, public knowledge
 * only. Funnels to the curated task library (reachable from the header nav).
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-cisco-nxos-config-from-a-form',
      title: 'Generate Ansible Cisco NX-OS config from a form',
      description:
        'Build Cisco NX-OS group_vars/host_vars from a friendly form with a live NX-OS CLI preview — interfaces, OSPF, prefix-lists, route-maps, VRFs and more.',
      lede: 'NX-OS shares most of its configuration model with IOS, but not all of it — `vrf context` instead of `vrf definition`, named ACLs without the `extended` keyword, address-families spelled `ipv4 unicast`. Ansiform knows those differences, so the same task previews the right NX-OS CLI and writes correct Ansible variables either way.',
      sections: [
        {
          id: 'the-idea',
          heading: 'One form, NX-OS output',
          blocks: [
            {
              kind: 'p',
              text: 'The variables Ansible needs are vendor-independent — an IP is an IP — so a single task schema serves NX-OS just as it serves IOS. What changes is the previewed CLI. Pick NX-OS as the preview target on a task and the device-config pane re-renders in NX-OS syntax while the `group_vars`/`host_vars` you download stay byte-correct.',
            },
          ],
        },
        {
          id: 'whats-different',
          heading: 'What NX-OS does differently',
          blocks: [
            {
              kind: 'table',
              columns: ['Feature', 'IOS', 'NX-OS'],
              rows: [
                ['VRF', '`vrf definition NAME`', '`vrf context NAME`'],
                ['Address family', '`address-family ipv4`', '`address-family ipv4 unicast`'],
                ['Named ACL', '`ip access-list extended NAME`', '`ip access-list NAME`'],
                ['Prefix-list / route-map', 'same syntax', 'same syntax'],
              ],
            },
            {
              kind: 'p',
              text: 'Some features (BGP, OSPF, HSRP) are feature-gated on NX-OS and configured in sub-modes that differ structurally from IOS; those previews are flagged where they are not a curated, verified match.',
            },
          ],
        },
        {
          id: 'fidelity',
          heading: 'Honest about fidelity',
          blocks: [
            {
              kind: 'p',
              text: 'Where an NX-OS preview is a verified one-to-one match for the CLI — prefix-lists, route-maps, named ACLs — it renders at exact fidelity. Where it has not had that curated pass, the preview shows a visible "preview may differ" notice rather than implying certainty. In both cases the YAML output is the same correct file; only the preview carries the caveat.',
            },
          ],
        },
        {
          id: 'get-started',
          heading: 'Get started',
          blocks: [
            {
              kind: 'p',
              text: 'Open the Tasks library from the header and choose a task whose badge lists Cisco NX-OS. Switch the preview target to NX-OS, fill the form, and download your `group_vars`/`host_vars`. Build several tasks into one var-file set on the Build page when you are configuring a whole device.',
            },
          ],
        },
      ],
    },
    fr: {
      slug: 'ansible-cisco-nxos-config-from-a-form',
      title: 'Générer la configuration Cisco NX-OS pour Ansible depuis un formulaire',
      description:
        'Construisez des group_vars/host_vars Cisco NX-OS depuis un formulaire convivial avec un aperçu CLI NX-OS en direct — interfaces, OSPF, prefix-lists, route-maps, VRF et plus.',
      lede: 'NX-OS partage l’essentiel de son modèle de configuration avec IOS, mais pas tout — `vrf context` au lieu de `vrf definition`, des ACL nommées sans le mot-clé `extended`, des address-families écrites `ipv4 unicast`. Ansiform connaît ces différences : la même tâche prévisualise la bonne CLI NX-OS et écrit des variables Ansible correctes dans les deux cas.',
      sections: [
        {
          id: 'the-idea',
          heading: 'Un formulaire, une sortie NX-OS',
          blocks: [
            {
              kind: 'p',
              text: 'Les variables dont Ansible a besoin sont indépendantes du fournisseur — une IP reste une IP — donc un seul schéma de tâche sert NX-OS comme il sert IOS. Ce qui change, c’est la CLI prévisualisée. Choisissez NX-OS comme cible d’aperçu sur une tâche et le panneau de configuration se réaffiche en syntaxe NX-OS, tandis que les `group_vars`/`host_vars` téléchargés restent corrects à l’octet près.',
            },
          ],
        },
        {
          id: 'whats-different',
          heading: 'Ce que NX-OS fait différemment',
          blocks: [
            {
              kind: 'table',
              columns: ['Fonction', 'IOS', 'NX-OS'],
              rows: [
                ['VRF', '`vrf definition NAME`', '`vrf context NAME`'],
                ['Address family', '`address-family ipv4`', '`address-family ipv4 unicast`'],
                ['ACL nommée', '`ip access-list extended NAME`', '`ip access-list NAME`'],
                ['Prefix-list / route-map', 'même syntaxe', 'même syntaxe'],
              ],
            },
            {
              kind: 'p',
              text: 'Certaines fonctions (BGP, OSPF, HSRP) sont conditionnées par une `feature` sur NX-OS et configurées dans des sous-modes structurellement différents d’IOS ; ces aperçus sont signalés lorsqu’ils ne sont pas une correspondance vérifiée et validée.',
            },
          ],
        },
        {
          id: 'fidelity',
          heading: 'Honnête sur la fidélité',
          blocks: [
            {
              kind: 'p',
              text: 'Là où un aperçu NX-OS est une correspondance vérifiée et exacte de la CLI — prefix-lists, route-maps, ACL nommées — il s’affiche en fidélité exacte. Là où cette relecture n’a pas eu lieu, l’aperçu affiche un avertissement visible « l’aperçu peut différer » plutôt que de laisser croire à une certitude. Dans les deux cas, la sortie YAML est le même fichier correct ; seul l’aperçu porte la réserve.',
            },
          ],
        },
        {
          id: 'get-started',
          heading: 'Pour commencer',
          blocks: [
            {
              kind: 'p',
              text: 'Ouvrez la bibliothèque de tâches depuis l’en-tête et choisissez une tâche dont le badge mentionne Cisco NX-OS. Basculez la cible d’aperçu sur NX-OS, remplissez le formulaire et téléchargez vos `group_vars`/`host_vars`. Assemblez plusieurs tâches en un seul jeu de fichiers de variables sur la page Build quand vous configurez un équipement complet.',
            },
          ],
        },
      ],
    },
  },
};
