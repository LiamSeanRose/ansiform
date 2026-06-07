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
  'app.loading': 'Chargement…',

  'nav.home': 'Accueil',
  'nav.skipToContent': 'Aller au contenu principal',
  'nav.language': 'Langue',
  'nav.tasks': 'Tâches',
  'nav.build': 'Composer',
  'nav.primary': 'Principale',

  'home.title': 'Ansiform',
  'home.lede':
    'Remplissez un formulaire clair et obtenez des group_vars/host_vars Ansible valides — avec un aperçu en direct de la configuration de l’équipement que vous connaissez déjà.',
  'home.tasksHeading': 'Tâches',
  'home.tasksEmpty': 'La bibliothèque de tâches arrive bientôt.',
  'home.referenceHeading': 'Référence et guides',

  'task.backToHome': '← Toutes les tâches',
  'task.relatedHeading': 'Tâches associées',
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
  'preview.heading': 'Aperçu en direct ({vendor})',
  'preview.degradedNotice': 'L’aperçu peut différer — la sortie YAML reste valide.',
  'preview.empty': 'Remplissez le formulaire pour voir la configuration de l’équipement.',

  'workbench.formHeading': 'Configurer',
  'workbench.outputHeading': 'Variables Ansible (YAML)',
  'workbench.outputPathLabel': 'Fichier suggéré :',

  'workbench.vendorSelectLabel': 'Cible de l’aperçu',
  'vendor.cisco-ios': 'Cisco IOS',
  'vendor.cisco-iosxe': 'Cisco IOS-XE',
  'vendor.cisco-nxos': 'Cisco NX-OS',
  'vendor.arista-eos': 'Arista EOS',
  'vendor.cisco-asa': 'Cisco ASA',
  'vendor.cisco-iosxr': 'Cisco IOS-XR',
  'vendor.cradlepoint-ncos': 'Cradlepoint NCOS',
  'vendor.juniper-junos': 'Juniper Junos',

  'output.copyLabel': 'Copier',
  'output.copied': 'Copié dans le presse-papiers.',
  'output.copyFailed': 'Échec de la copie — sélectionnez le texte et copiez-le manuellement.',
  'output.downloadLabel': 'Télécharger',
  'output.awxSurveySpec.label': 'Enquête AWX (.json)',

  'build.title': 'Composer un jeu de variables',
  'build.lede':
    'Ajoutez plusieurs tâches, remplissez-les et assemblez un jeu complet de fichiers group_vars/host_vars en une passe — tout reste dans votre navigateur.',
  'build.addLabel': 'Ajouter une tâche',
  'build.addButton': 'Ajouter',
  'build.empty': 'Aucune tâche — ajoutez-en une ci-dessus pour commencer.',
  'build.removeTask': 'Retirer cette tâche',
  'build.scopeLegend': 'Portée de sortie',
  'build.scopeKindLabel': 'Portée',
  'build.scopeKindGroup': 'group_vars',
  'build.scopeKindHost': 'host_vars',
  'build.scopeNameLabel': 'Nom',
  'build.previewHeading': 'Aperçu',
  'build.outputHeading': 'Fichiers composés',
  'build.outputEmpty': 'Les tâches remplies apparaissent ici sous forme de fichiers group_vars / host_vars.',
  'build.collision':
    'Clés en conflit (la dernière valeur l’emporte — à résoudre avant utilisation) : {keys}',
  'build.removeTaskNamed': 'Retirer cette tâche : {title}',
  'build.downloadFileNamed': 'Télécharger {path}',

  // Index de découverte des tâches (#35) — /tasks, groupé par fonction + filtrable.
  'tasksIndex.title': 'Bibliothèque de tâches',
  'tasksIndex.lede':
    'Parcourez chaque tâche par fonction, chacune étiquetée avec le CLI d’équipement qu’elle génère. Ouvrez-en une pour remplir le formulaire et obtenir des variables Ansible valides.',
  'tasksIndex.searchLabel': 'Filtrer les tâches',
  'tasksIndex.searchPlaceholder': 'Rechercher par nom ou mot-clé…',
  'tasksIndex.resultsCount': '{count} tâche(s)',
  'tasksIndex.empty': 'Aucune tâche ne correspond à votre recherche.',
  'tasksIndex.vendorsLabel': 'Génère :',
  'tasksIndex.category.interfaces': 'Interfaces et adressage',
  'tasksIndex.category.switching': 'VLAN et commutation',
  'tasksIndex.category.routing': 'Routage',
  'tasksIndex.category.policy': 'Politique de trafic',
  'tasksIndex.category.firewall': 'Pare-feu (ASA)',
  'tasksIndex.category.edge': 'Cellulaire et edge (Cradlepoint)',
  'tasksIndex.category.management': 'Gestion et durcissement',
  'tasksIndex.category.other': 'Autre',

  // Lecteur de template (#30) — lecture seule, bêta, distinct des tâches curées.
  'nav.reader': 'Lecteur de template',
  'reader.title': 'Lecteur de template',
  'reader.scopeNote': 'Lecture seule · lit le template que vous collez, pas une tâche curée',
  'reader.lede':
    'Collez un template Cisco IOS / Jinja2 existant pour voir ce qu’il attend — les variables à renseigner, les filtres utilisés, et un aperçu CLI en direct. Rien de ce que vous collez ne quitte votre navigateur ni n’est conservé.',
  'reader.pasteLabel': 'Coller un template',
  'reader.pasteHelp':
    'group_vars/host_vars Jinja2 ou un template de rôle. Reste en mémoire uniquement — jamais enregistré, partagé ni envoyé.',
  'reader.pastePlaceholder': 'interface {{ interface }}\n ip address {{ ip_address | ipaddr(\'address\') }} {{ ip_address | ipaddr(\'netmask\') }}',
  'reader.empty': 'Collez un template ci-dessus pour le lire.',
  'reader.tooLarge': 'Ce template dépasse {max} Ko — réduisez-le et recollez.',
  'reader.templateHeading': 'Template',
  'reader.variablesHeading': 'Variables à renseigner',
  'reader.variablesNone': 'Aucune variable trouvée dans ce template.',
  'reader.varSampleHelp': 'Valeur d’exemple — non validée. Sert uniquement à générer l’aperçu ci-dessous.',
  'reader.secretBadge': 'secret — masqué',
  'reader.filtersHeading': 'Filtres utilisés',
  'reader.filtersNone': 'Aucun filtre — les valeurs sont insérées telles quelles.',
  'reader.tier.exact': 'exact',
  'reader.tier.approximate': 'approximatif',
  'reader.tier.unsupported': 'non pris en charge',
  'reader.previewHeading': 'Aperçu en direct (Cisco IOS)',
  'reader.foundCount':
    '{count} variable(s) trouvée(s). Les variables définies avec set, ou utilisées uniquement dans des boucles, peuvent ne pas figurer — vérifiez le template lui-même avant de vous y fier.',
  'reader.loopVars': 'Variables de boucle (renseignées par ligne, pas ci-dessus) : {names}',
  'reader.vaultNote':
    'Ce template contient des données chiffrées par Vault. Elles sont affichées telles quelles à l’écran mais jamais déchiffrées, stockées ni évaluées.',
  'reader.fidelity.exact':
    'Aperçu exact — ce template n’utilise que des filtres rendus exactement par Ansiform.',
  'reader.fidelity.approximate':
    'L’aperçu peut différer — les valeurs sous-jacentes restent correctes. Certains filtres sont approximés ici.',
  'reader.fidelity.unsupported':
    'L’aperçu peut différer — ce template utilise des filtres ou constructions qu’Ansiform ne peut pas rendre exactement ; la liste des variables peut donc être incomplète. Vérifiez avec le template réel.',

  // Lecteur de template — mode édition (#31). Champs texte extraits, sans inférence.
  'reader.edit.ack':
    'Je comprends que les types et la validation ne sont pas déduits — vérifiez ces valeurs avant tout déploiement.',
  'reader.edit.enter': 'Éditer ces variables',
  'reader.edit.exit': 'Revenir en lecture seule',
  'reader.edit.uninferred':
    'Chaque champ ci-dessous est du texte brut, sans type, format ni validation déduits — exactement ce qui a été extrait, rien de plus. Le YAML généré est exact pour les valeurs saisies ; vérifiez-les avec le template réel avant tout déploiement.',
  'reader.edit.formHeading': 'Renseigner les variables extraites',
  'reader.edit.fieldsLegend': 'Variables extraites (sans type)',
  'reader.edit.submitLabel': 'Actualiser l’aperçu',
  'reader.edit.outputHeading': 'Variables extraites (YAML)',

  // Lecteur de template — sélecteur de source collée (#32).
  'reader.source.label': 'Que collez-vous ?',
  'reader.source.template': 'Template Jinja2',
  'reader.source.argspec': 'argument_specs.yml (exact)',

  // Lecteur de template — importateur argument_specs (#32). Déclaratif → exact.
  'reader.argspec.intro':
    'Un argument_specs de rôle déclare le type, l’obligation, la valeur par défaut et les choix de chaque variable — ce formulaire est donc exact, pas une supposition : chaque champ reflète le contrat déclaré du rôle, sans rien déduire. Il n’y a pas d’aperçu CLI ici : un spec décrit des variables, pas une config rendue.',
  'reader.argspec.pasteLabel': 'Collez meta/argument_specs.yml',
  'reader.argspec.pasteHelp':
    'Le spec déclaré du rôle. Reste en mémoire uniquement — jamais enregistré, partagé ni envoyé.',
  'reader.argspec.placeholder':
    'argument_specs:\n  main:\n    options:\n      vlan_id:\n        type: int\n        required: true',
  'reader.argspec.empty': 'Collez un document argument_specs ci-dessus pour générer un formulaire exact.',
  'reader.argspec.tooLarge': 'Ce spec dépasse {max} Ko (ou comporte trop d’alias) — réduisez-le et recollez.',
  'reader.argspec.parseError': 'Ce n’est pas du YAML valide — vérifiez l’indentation et recollez.',
  'reader.argspec.shapeError':
    'Aucune option argument_specs trouvée. Attendu : une table argument_specs (ou un point d’entrée unique avec options).',
  'reader.argspec.entrypoint': 'Point d’entrée : {name}',
  'reader.argspec.approximated':
    '{count} option(s) n’ont pas pu être représentées exactement et sont affichées en texte brut — définissez leur structure à la main : {names}',
  'reader.argspec.noPreview':
    'Pas d’aperçu CLI — un spec déclare des variables, pas une configuration rendue.',
  'reader.argspec.formHeading': 'Renseigner les variables déclarées',
  'reader.argspec.outputHeading': 'Variables du rôle (YAML)',
  'reader.argspec.submitLabel': 'Valider',
};
