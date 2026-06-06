/**
 * French (FR) strings (issue #16) — mirrors `en.ts` key-for-key.
 *
 * Typed as `Messages`, so the compiler enforces that every key in `en.ts` is
 * present here (and no stray keys). FR does not gate the English launch (§6).
 */
import type { Messages } from './en';

export const fr: Messages = {
  'app.name': 'Ansiform',
  'app.tagline': 'Des templates Ansible sans le YAML',

  'nav.home': 'Accueil',
  'nav.skipToContent': 'Aller au contenu principal',
  'nav.language': 'Langue',

  'home.title': 'Ansiform',
  'home.lede':
    'Remplissez un formulaire clair et obtenez des group_vars/host_vars Ansible valides — avec un aperçu en direct de la configuration de l’équipement que vous connaissez déjà.',
  'home.tasksHeading': 'Tâches',
  'home.tasksEmpty': 'La bibliothèque de tâches arrive bientôt.',
  'home.referenceHeading': 'Référence et guides',

  'task.backToHome': '← Toutes les tâches',
  'task.placeholderHeading': 'Tâche : {task}',
  'task.placeholderBody':
    'Ceci est un espace réservé de routage. Le moteur de formulaire et les tâches ne sont pas encore construits.',

  'reference.backToHome': '← Accueil',
  'reference.tocLabel': 'Sur cette page',

  'notFound.title': 'Page introuvable',
  'notFound.body': 'Nous n’avons pas trouvé la page que vous cherchiez.',
  'notFound.backHome': 'Aller à la page d’accueil',

  'footer.tagline': 'Côté client · sans transfert de données · libre et open source (Apache-2.0)',

  'form.requiredLabel': '(obligatoire)',
  'form.errorSummaryHeading': 'Veuillez corriger les points suivants avant de continuer :',
  'form.submitLabel': 'Valider',
  'form.error.required': '{label} est obligatoire.',
  'form.error.pattern': '{label} n’est pas au format attendu.',
  'form.error.min': '{label} doit être au moins {min}.',
  'form.error.max': '{label} doit être au plus {max}.',
  'form.error.notANumber': '{label} doit être un nombre.',
  'form.error.incomplete': '{label} comporte des lignes à corriger.',
  'form.list.add': 'Ajouter une ligne',
  'form.list.remove': 'Supprimer la ligne {index}',
  'form.list.row': 'Ligne {index}',
  'form.list.added': 'Ligne ajoutée.',
  'form.list.removed': 'Ligne {index} supprimée.',
  'form.list.empty': 'Aucune ligne — ajoutez-en une pour commencer.',

  'preview.regionLabel': 'Aperçu CLI de l’équipement',
  'preview.heading': 'Aperçu en direct (Cisco IOS)',
  'preview.degradedNotice': 'L’aperçu peut différer — la sortie YAML reste valide.',
  'preview.empty': 'Remplissez le formulaire pour voir la configuration de l’équipement.',

  'workbench.formHeading': 'Configurer',
  'workbench.outputHeading': 'Variables Ansible (YAML)',
  'workbench.outputPathLabel': 'Fichier suggéré :',

  'output.copyLabel': 'Copier',
  'output.copied': 'Copié dans le presse-papiers.',
  'output.copyFailed': 'Échec de la copie — sélectionnez le texte et copiez-le manuellement.',
  'output.downloadLabel': 'Télécharger',
};
