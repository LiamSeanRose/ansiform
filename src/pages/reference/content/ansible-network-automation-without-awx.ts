import type { ReferenceModule } from '../types';

/**
 * Reference page: Ansible network automation without AWX / a controller.
 * Generic, public Ansible knowledge only. Funnels to the task library and the
 * survey-spec export for teams that do run AWX.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-network-automation-without-awx',
      title: 'Ansible network automation without AWX or a controller',
      description:
        'You do not need AWX, Tower, or any controller to automate network gear with Ansible. How the plain CLI workflow works, where files fit, and when a controller helps.',
      lede: 'AWX and Ansible Automation Platform are useful, but they are not required to run Ansible. For a lot of network teams the fastest path is the command line plus a tidy set of variable files — no server to stand up, no database, no web UI to log into.',
      sections: [
        {
          id: 'no-controller',
          heading: 'You don’t need a controller to run a playbook',
          blocks: [
            {
              kind: 'p',
              text: 'Ansible is an ordinary command-line tool. Given an inventory and a playbook, `ansible-playbook` connects to your devices and applies the configuration — exactly the same engine a controller drives under the hood. A controller adds scheduling, RBAC, surveys, and an audit log on top; it does not add the automation itself.',
            },
          ],
        },
        {
          id: 'cli-workflow',
          heading: 'The plain-CLI workflow',
          blocks: [
            {
              kind: 'list',
              items: [
                'An inventory listing your devices and groups (an INI or YAML file).',
                '`group_vars/` and `host_vars/` holding the per-group and per-host variables.',
                'A playbook (often using a vendor network role or the `cli_config` / resource modules) that reads those vars.',
                'A run: `ansible-playbook -i inventory site.yml`.',
              ],
            },
            {
              kind: 'p',
              text: 'Everything is files in a git repository. Review configuration in a pull request, run it from a laptop or a CI job, and you have a complete, auditable workflow without any extra infrastructure.',
            },
          ],
        },
        {
          id: 'where-forms-fit',
          heading: 'Where a form fits',
          blocks: [
            {
              kind: 'p',
              text: 'The part people dislike about this workflow is hand-writing the YAML and second-guessing what the device will actually do. That is the gap Ansiform fills: fill a friendly form, get byte-correct `group_vars`/`host_vars`, and watch a live preview of the device CLI the variables will produce. It runs entirely in your browser — nothing is uploaded — so it slots in front of the CLI workflow above without changing it.',
            },
            {
              kind: 'p',
              text: 'Open the Tasks library from the header to generate a var file, then commit it next to your inventory.',
            },
          ],
        },
        {
          id: 'when-awx',
          heading: 'When a controller still earns its keep',
          blocks: [
            {
              kind: 'list',
              items: [
                'You need role-based access control and an audit trail across a team.',
                'You want scheduled runs or a self-service survey for non-experts to launch jobs.',
                'You are centralizing credentials and approvals.',
              ],
            },
            {
              kind: 'p',
              text: 'If you do run AWX or AAP, you can still build your variables here and export an AWX survey spec from a task — see the AWX survey alternative guide. The point is that the controller is a choice, not a prerequisite.',
            },
          ],
        },
      ],
    },
    fr: {
      slug: 'ansible-network-automation-without-awx',
      title: 'Automatisation réseau avec Ansible sans AWX ni contrôleur',
      description:
        'Pas besoin d’AWX, de Tower ni d’un contrôleur pour automatiser vos équipements réseau avec Ansible. Comment fonctionne le workflow en ligne de commande, où s’insèrent les fichiers, et quand un contrôleur aide.',
      lede: 'AWX et Ansible Automation Platform sont utiles, mais pas obligatoires pour exécuter Ansible. Pour beaucoup d’équipes réseau, le chemin le plus rapide est la ligne de commande accompagnée d’un jeu soigné de fichiers de variables — aucun serveur à monter, aucune base de données, aucune interface web où se connecter.',
      sections: [
        {
          id: 'no-controller',
          heading: 'Pas besoin de contrôleur pour exécuter un playbook',
          blocks: [
            {
              kind: 'p',
              text: 'Ansible est un outil en ligne de commande ordinaire. Avec un inventaire et un playbook, `ansible-playbook` se connecte à vos équipements et applique la configuration — exactement le même moteur qu’un contrôleur pilote en coulisses. Un contrôleur ajoute par-dessus la planification, le RBAC, les surveys et un journal d’audit ; il n’ajoute pas l’automatisation elle-même.',
            },
          ],
        },
        {
          id: 'cli-workflow',
          heading: 'Le workflow en ligne de commande',
          blocks: [
            {
              kind: 'list',
              items: [
                'Un inventaire listant vos équipements et groupes (un fichier INI ou YAML).',
                '`group_vars/` et `host_vars/` contenant les variables par groupe et par hôte.',
                'Un playbook (souvent avec un rôle réseau du fournisseur ou les modules `cli_config` / resource) qui lit ces variables.',
                'Une exécution : `ansible-playbook -i inventory site.yml`.',
              ],
            },
            {
              kind: 'p',
              text: 'Tout est constitué de fichiers dans un dépôt git. Relisez la configuration dans une pull request, exécutez-la depuis un portable ou un job de CI, et vous obtenez un workflow complet et auditable sans aucune infrastructure supplémentaire.',
            },
          ],
        },
        {
          id: 'where-forms-fit',
          heading: 'Où s’insère un formulaire',
          blocks: [
            {
              kind: 'p',
              text: 'Ce que l’on n’aime pas dans ce workflow, c’est écrire le YAML à la main et douter de ce que l’équipement va réellement faire. C’est la lacune que comble Ansiform : remplissez un formulaire convivial, obtenez des `group_vars`/`host_vars` corrects à l’octet près et observez un aperçu en direct de la CLI que les variables produiront. Tout s’exécute dans votre navigateur — rien n’est téléversé — il se place donc devant le workflow CLI ci-dessus sans le modifier.',
            },
            {
              kind: 'p',
              text: 'Ouvrez la bibliothèque de tâches depuis l’en-tête pour générer un fichier de variables, puis validez-le à côté de votre inventaire.',
            },
          ],
        },
        {
          id: 'when-awx',
          heading: 'Quand un contrôleur reste justifié',
          blocks: [
            {
              kind: 'list',
              items: [
                'Vous avez besoin d’un contrôle d’accès par rôles et d’une piste d’audit pour une équipe.',
                'Vous voulez des exécutions planifiées ou un survey en libre-service pour que des non-experts lancent des tâches.',
                'Vous centralisez les identifiants et les approbations.',
              ],
            },
            {
              kind: 'p',
              text: 'Si vous exploitez AWX ou AAP, vous pouvez tout de même construire vos variables ici et exporter une spec de Survey AWX depuis une tâche — voir le guide sur l’alternative aux Surveys AWX. L’essentiel : le contrôleur est un choix, pas un prérequis.',
            },
          ],
        },
      ],
    },
  },
};
