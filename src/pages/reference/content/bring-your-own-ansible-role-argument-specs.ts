import type { ReferenceModule } from '../types';

/**
 * Reference page (#85): bring your own role — turn a role's `argument_specs`
 * into a fillable form. SEO landing for the first-class `/import` route.
 * Honest framing: exact mapping, nothing inferred, no device-CLI preview.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'bring-your-own-ansible-role-argument-specs',
      title: 'Fill an Ansible role’s argument_specs as a form',
      description:
        'Paste a role’s meta/argument_specs.yml and get the exact form it declares — then export the group_vars/host_vars that role expects. In the browser, zero egress.',
      lede: 'If you already have Ansible roles, you do not need a curated task — your roles already declare their own variables. A role’s `meta/argument_specs.yml` is a precise contract, and the importer at `/import` turns it into the exact form it declares, with nothing guessed.',
      sections: [
        {
          id: 'what',
          heading: 'What argument_specs declares',
          blocks: [
            {
              kind: 'p',
              text: 'An Ansible role can ship a `meta/argument_specs.yml` that declares each option it accepts: its `type`, whether it is `required`, its `default`, any `choices`, and a `description`. Ansible uses it to validate inputs at runtime; it is the role’s own, authoritative description of its variables.',
            },
            {
              kind: 'code',
              text: 'argument_specs:\n  main:\n    options:\n      vlan_id:\n        type: int\n        required: true\n        description: The VLAN id to configure\n      vlan_name:\n        type: str\n      enabled:\n        type: bool\n        default: true',
            },
          ],
        },
        {
          id: 'why',
          heading: 'Why turn it into a form',
          blocks: [
            {
              kind: 'p',
              text: 'Because the variable names come from *your* role’s spec, the YAML you export drops straight into *your* repo — no renaming, no mapping. It is the direct answer to “we already have roles; how do we drive them without hand-editing YAML?”. A teammate fills a labelled form instead of remembering which keys a role expects.',
            },
          ],
        },
        {
          id: 'exact',
          heading: 'Exact, not inferred',
          blocks: [
            {
              kind: 'p',
              text: 'Unlike reading a raw Jinja2 template — where a variable’s type can only be guessed — an `argument_specs` is declarative, so the mapping is correct by construction:',
            },
            {
              kind: 'table',
              columns: ['Declared in the spec', 'Form field'],
              rows: [
                ['`type: str` / `path`', 'Text input'],
                ['`type: int` / `float`', 'Number input'],
                ['`type: bool`', 'Checkbox'],
                ['`choices: [...]`', 'Dropdown'],
                ['`type: list` with `elements: dict`', 'Repeating group of rows'],
                ['`no_log: true` or a credential-named option', 'Masked secret input'],
              ],
            },
            {
              kind: 'p',
              text: 'Declared `default`, `required`, and `description` are carried through verbatim. Nothing about a variable’s type, validation, or default is invented — the form claims only what the spec declares.',
            },
          ],
        },
        {
          id: 'limits',
          heading: 'What it cannot represent exactly',
          blocks: [
            {
              kind: 'p',
              text: 'A few spec shapes have no exact match in a simple form — a list of bare scalars, a free-form dict, or an opaque `raw`/`jsonarg`. Rather than mistype them, the importer shows them as plain text and names them in a callout, so you can set their structure by hand instead of trusting a wrong guess.',
            },
          ],
        },
        {
          id: 'no-preview',
          heading: 'No device-CLI preview — by design',
          blocks: [
            {
              kind: 'p',
              text: 'A spec declares variables, not rendered configuration, so there is no device CLI to preview and no fidelity claim to make. That honesty is the point: the YAML you export is byte-correct for the values you enter, and what the role does with them is the role’s business. For a live preview of a config template, the template reader is the other tool.',
            },
          ],
        },
        {
          id: 'spine',
          heading: 'Stays in your browser',
          blocks: [
            {
              kind: 'list',
              items: [
                'The pasted spec never leaves the page — no upload, no storage, no telemetry (`connect-src \'none\'`).',
                'Export is variables only — never the spec or a template.',
                'Secrets (`no_log` or credential-named) are masked inputs, never stored or transmitted.',
                'The same exported vars can be diffed against an existing file before you merge them in.',
              ],
            },
          ],
        },
      ],
    },
    fr: {
      slug: 'bring-your-own-ansible-role-argument-specs',
      title: 'Remplir le argument_specs d’un rôle Ansible comme un formulaire',
      description:
        'Collez le meta/argument_specs.yml d’un rôle et obtenez le formulaire exact qu’il déclare — puis exportez les group_vars/host_vars attendus. Dans le navigateur, sans sortie réseau.',
      lede: 'Si vous avez déjà des rôles Ansible, pas besoin d’une tâche prête à l’emploi — vos rôles déclarent déjà leurs propres variables. Le `meta/argument_specs.yml` d’un rôle est un contrat précis, et l’importateur sur `/import` le transforme en le formulaire exact qu’il déclare, sans rien deviner.',
      sections: [
        {
          id: 'what',
          heading: 'Ce que déclare argument_specs',
          blocks: [
            {
              kind: 'p',
              text: 'Un rôle Ansible peut fournir un `meta/argument_specs.yml` qui déclare chaque option acceptée : son `type`, son caractère `required`, sa valeur par `default`, ses `choices` éventuels et une `description`. Ansible s’en sert pour valider les saisies à l’exécution ; c’est la description faisant autorité des variables du rôle.',
            },
            {
              kind: 'code',
              text: 'argument_specs:\n  main:\n    options:\n      vlan_id:\n        type: int\n        required: true\n        description: L’identifiant de VLAN à configurer\n      vlan_name:\n        type: str\n      enabled:\n        type: bool\n        default: true',
            },
          ],
        },
        {
          id: 'why',
          heading: 'Pourquoi en faire un formulaire',
          blocks: [
            {
              kind: 'p',
              text: 'Comme les noms de variables proviennent de la spéc de *votre* rôle, le YAML exporté s’intègre directement à *votre* dépôt — sans renommage ni correspondance. C’est la réponse directe à « nous avons déjà des rôles ; comment les piloter sans éditer le YAML à la main ? ». Un collègue remplit un formulaire étiqueté au lieu de mémoriser les clés attendues.',
            },
          ],
        },
        {
          id: 'exact',
          heading: 'Exact, pas inféré',
          blocks: [
            {
              kind: 'p',
              text: 'Contrairement à la lecture d’un template Jinja2 brut — où le type d’une variable ne peut être que deviné — un `argument_specs` est déclaratif, donc la correspondance est correcte par construction :',
            },
            {
              kind: 'table',
              columns: ['Déclaré dans la spéc', 'Champ du formulaire'],
              rows: [
                ['`type: str` / `path`', 'Champ texte'],
                ['`type: int` / `float`', 'Champ numérique'],
                ['`type: bool`', 'Case à cocher'],
                ['`choices: [...]`', 'Liste déroulante'],
                ['`type: list` avec `elements: dict`', 'Groupe répétable de lignes'],
                ['`no_log: true` ou option nommée comme un secret', 'Champ secret masqué'],
              ],
            },
            {
              kind: 'p',
              text: 'Les `default`, `required` et `description` déclarés sont repris tels quels. Rien — type, validation, valeur par défaut — n’est inventé : le formulaire n’affirme que ce que la spéc déclare.',
            },
          ],
        },
        {
          id: 'limits',
          heading: 'Ce qui ne peut pas être représenté exactement',
          blocks: [
            {
              kind: 'p',
              text: 'Quelques formes de spéc n’ont pas d’équivalent exact dans un formulaire simple — une liste de scalaires nus, un dictionnaire libre, ou un `raw`/`jsonarg` opaque. Plutôt que de les mal typer, l’importateur les affiche en texte brut et les nomme dans un avertissement, pour que vous définissiez leur structure à la main au lieu de faire confiance à une mauvaise supposition.',
            },
          ],
        },
        {
          id: 'no-preview',
          heading: 'Aucun aperçu CLI — par conception',
          blocks: [
            {
              kind: 'p',
              text: 'Une spéc déclare des variables, pas une configuration rendue ; il n’y a donc aucun CLI d’équipement à prévisualiser ni affirmation de fidélité à faire. Cette honnêteté est le but : le YAML exporté est exact au caractère près pour les valeurs saisies, et ce que le rôle en fait reste l’affaire du rôle. Pour un aperçu en direct d’un template de configuration, le lecteur de template est l’autre outil.',
            },
          ],
        },
        {
          id: 'spine',
          heading: 'Reste dans votre navigateur',
          blocks: [
            {
              kind: 'list',
              items: [
                'La spéc collée ne quitte jamais la page — aucun envoi, aucun stockage, aucune télémétrie (`connect-src \'none\'`).',
                'L’export ne contient que des variables — jamais la spéc ni un template.',
                'Les secrets (`no_log` ou nommés comme des identifiants) sont des champs masqués, jamais stockés ni transmis.',
                'Les variables exportées peuvent être comparées à un fichier existant avant la fusion.',
              ],
            },
          ],
        },
      ],
    },
  },
};
