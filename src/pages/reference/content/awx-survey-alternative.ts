import type { ReferenceModule } from '../types';

/**
 * Reference page: an offline alternative to AWX/AAP Surveys.
 * Honest comparison — Ansiform generates inputs, it is not a job runner.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'awx-survey-alternative',
      title: 'An offline alternative to AWX / AAP Surveys',
      description:
        'AWX/AAP Surveys put a form on a job template. Get the same friendly form for your Ansible variables with no controller — in the browser, zero egress.',
      lede: 'AWX/AAP Surveys are great when you already run a controller. If you just want a friendly form that turns inputs into Ansible variables — without standing up infrastructure or sending data anywhere — a client-side tool covers the same need differently.',
      sections: [
        {
          id: 'what',
          heading: 'What an AWX/AAP Survey does',
          blocks: [
            {
              kind: 'p',
              text: 'A Survey attaches a simple web form to a job template. When someone launches the job, their answers are passed in as `extra_vars`, so non-experts can run a curated playbook by filling fields instead of editing YAML.',
            },
          ],
        },
        {
          id: 'limits',
          heading: 'Where Surveys fall short',
          blocks: [
            {
              kind: 'list',
              items: [
                'They require a running AWX/AAP controller — overkill if you only want to *produce* variables.',
                'Answers flow through the controller and its database; the form is not something you can hand to a teammate as a file.',
                'There is no preview of the resulting device configuration — you find out what the values do when the job runs.',
                'They are awkward for air-gapped or ad-hoc use, where spinning up a controller is not practical.',
              ],
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
                ['Data flow', 'Through the controller and its database', 'Never leaves the page (`connect-src \'none\'`)'],
                ['Output', '`extra_vars` at job launch', '`group_vars`/`host_vars` YAML files you keep'],
                ['Preview', 'None', 'Live device-CLI preview as you type'],
                ['Air-gapped use', 'Needs a running controller', 'Static site — self-host or run from a folder'],
                ['Secrets', 'Stored as controller credentials', 'Password field — never stored or transmitted'],
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
              text: 'They are complementary, not competitors. AWX/AAP is a job runner: scheduling, RBAC, logging, and actually applying changes. Ansiform only produces the inputs — it does not run Ansible for you.',
            },
            {
              kind: 'p',
              text: 'Use Ansiform to generate correct variables (with a preview you can trust), then commit them to `group_vars`/`host_vars`, or paste them into a playbook or a Survey. The friendly form and the controller can happily coexist.',
            },
          ],
        },
      ],
    },
    fr: {
      slug: 'awx-survey-alternative',
      title: 'Une alternative hors ligne aux Surveys AWX / AAP',
      description:
        'Les Surveys AWX/AAP ajoutent un formulaire à un modèle de tâche. Obtenez le même formulaire convivial pour vos variables Ansible sans contrôleur — dans le navigateur, sans aucune sortie réseau.',
      lede: 'Les Surveys AWX/AAP sont parfaits quand vous exploitez déjà un contrôleur. Si vous voulez seulement un formulaire convivial qui transforme des saisies en variables Ansible — sans déployer d’infrastructure ni envoyer de données où que ce soit — un outil côté client répond au même besoin autrement.',
      sections: [
        {
          id: 'what',
          heading: 'Ce que fait un Survey AWX/AAP',
          blocks: [
            {
              kind: 'p',
              text: 'Un Survey attache un simple formulaire web à un modèle de tâche. Au lancement de la tâche, les réponses sont passées en `extra_vars`, ce qui permet à des non-experts d’exécuter un playbook prêt à l’emploi en remplissant des champs plutôt qu’en éditant du YAML.',
            },
          ],
        },
        {
          id: 'limits',
          heading: 'Les limites des Surveys',
          blocks: [
            {
              kind: 'list',
              items: [
                'Ils exigent un contrôleur AWX/AAP en fonctionnement — disproportionné si vous voulez seulement *produire* des variables.',
                'Les réponses transitent par le contrôleur et sa base de données ; le formulaire n’est pas un fichier que vous pouvez transmettre à un collègue.',
                'Il n’y a aucun aperçu de la configuration résultante — vous découvrez l’effet des valeurs au moment où la tâche s’exécute.',
                'Ils sont peu pratiques en environnement isolé (air-gap) ou ponctuel, où monter un contrôleur n’est pas réaliste.',
              ],
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
                ['Flux de données', 'À travers le contrôleur et sa base de données', "Ne quitte jamais la page (`connect-src 'none'`)"],
                ['Sortie', '`extra_vars` au lancement de la tâche', 'Fichiers YAML `group_vars`/`host_vars` que vous conservez'],
                ['Aperçu', 'Aucun', 'Aperçu CLI de l’équipement en direct'],
                ['Usage air-gap', 'Nécessite un contrôleur actif', 'Site statique — auto-hébergé ou lancé depuis un dossier'],
                ['Secrets', 'Stockés comme identifiants du contrôleur', 'Champ mot de passe — jamais stocké ni transmis'],
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
              text: 'Ils sont complémentaires, pas concurrents. AWX/AAP est un exécuteur de tâches : planification, RBAC, journalisation, et application réelle des changements. Ansiform ne produit que les saisies — il n’exécute pas Ansible à votre place.',
            },
            {
              kind: 'p',
              text: 'Utilisez Ansiform pour générer des variables correctes (avec un aperçu fiable), puis validez-les dans `group_vars`/`host_vars`, ou collez-les dans un playbook ou un Survey. Le formulaire convivial et le contrôleur cohabitent sans problème.',
            },
          ],
        },
      ],
    },
  },
};
