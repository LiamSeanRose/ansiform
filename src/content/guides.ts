/**
 * SEO / reference guides (issue #17).
 *
 * Near-zero-competition reference pages (council §8) that double as real
 * documentation and feed internal links to the tasks. Each guide is its own SEO
 * atom: a route (`/guides/<slug>`), an H1 (`title`), and a meta `description`.
 *
 * Content is data-driven and English (the source locale); a localized variant
 * can be added alongside later (the FR pass, #16) without touching the renderer.
 * Kept as structured sections so `GuidePage` renders accessible headings.
 */
export interface GuideSection {
  heading: string;
  /** Paragraphs of prose. */
  body: string[];
  /** Optional definition-list rows (term → description), e.g. a cheatsheet. */
  rows?: { term: string; desc: string }[];
}

export interface GuideLink {
  label: string;
  to: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: GuideSection[];
  /** Internal links surfaced at the foot of the article. */
  related?: GuideLink[];
}

const guides: Guide[] = [
  {
    slug: 'ansible-jinja2-filters-cheatsheet',
    title: 'Ansible Jinja2 filters cheatsheet',
    description:
      'A practical cheatsheet of the Jinja2 filters network engineers actually use in Ansible vars — ipaddr queries, default(omit), to_nice_yaml, combine and regex_replace — with examples.',
    intro:
      'The Jinja2 filters you reach for most when templating network config in Ansible, with the exact behaviour Ansiform reproduces in its live preview.',
    sections: [
      {
        heading: 'ipaddr — IPv4 math',
        body: [
          'The ipaddr filter (backed by netaddr) answers questions about an address or CIDR. A bare address is treated as /32.',
        ],
        rows: [
          { term: "'192.0.2.1/24' | ipaddr('address')", desc: '192.0.2.1' },
          { term: "'192.0.2.1/24' | ipaddr('netmask')", desc: '255.255.255.0' },
          { term: "'192.0.2.1/24' | ipaddr('hostmask')", desc: '0.0.0.255 (the IOS wildcard mask)' },
          { term: "'192.0.2.1/24' | ipaddr('network')", desc: '192.0.2.0' },
          { term: "'192.0.2.1/24' | ipaddr('broadcast')", desc: '192.0.2.255' },
          { term: "'192.0.2.1/24' | ipaddr('prefix')", desc: '24' },
        ],
      },
      {
        heading: 'default(omit) — leave a key out',
        body: [
          "Ansible's special omit variable, combined with default, drops a key entirely when a value is blank, rather than emitting an empty string or null. It is the idiom behind every optional field in Ansiform's forms.",
          "Example: description: \"{{ desc | default(omit) }}\" — when desc is undefined the description key never appears in the rendered vars, so the role's own default applies.",
        ],
      },
      {
        heading: 'to_nice_yaml / to_json — serialize a structure',
        body: [
          'to_nice_yaml renders a variable as block-style YAML; to_json renders compact JSON. Both are handy for embedding a computed structure into a template or a debug task.',
        ],
      },
      {
        heading: 'combine — merge dictionaries',
        body: [
          'dict1 | combine(dict2) merges dictionaries left-to-right, with later keys winning. Pass recursive=true for a deep merge of nested dictionaries — the common pattern for layering site defaults under host overrides.',
        ],
      },
      {
        heading: 'regex_replace — substitute with a pattern',
        body: [
          "value | regex_replace('pattern', 'replacement') wraps Python's re.sub and replaces all matches. Backreferences use \\1 or \\g<name>.",
        ],
      },
    ],
    related: [
      { label: 'Build an Interface IP task', to: '/tasks/interface-ip' },
      { label: 'Build an OSPF task', to: '/tasks/ospf' },
    ],
  },
  {
    slug: 'ansible-variable-precedence-explained',
    title: 'Ansible variable precedence, explained',
    description:
      'A clear walkthrough of Ansible variable precedence: where group_vars and host_vars sit, why host_vars usually wins, and how to choose the right scope for your network vars.',
    intro:
      'Where do group_vars and host_vars sit in Ansible’s precedence order, and which one wins? A short, practical explanation for choosing the right scope.',
    sections: [
      {
        heading: 'The short version',
        body: [
          'Ansible merges variables from many sources into a single set per host, and when the same variable is defined twice the higher-precedence source wins. From lowest to highest the common inventory sources are: role defaults, then inventory group_vars (with all lowest, more specific groups higher), then inventory host_vars, then play vars, then task vars, and finally extra vars (-e) which always win.',
        ],
      },
      {
        heading: 'group_vars vs host_vars',
        body: [
          'Put fleet-wide settings in group_vars (e.g. group_vars/all.yml or group_vars/switches.yml) and per-device settings in host_vars/<hostname>.yml. Because host_vars sits above group_vars, a value set for a specific host overrides the group default — exactly what you want for things like an interface address or router-id.',
        ],
        rows: [
          { term: 'group_vars/all.yml', desc: 'applies to every host; lowest of the group scopes' },
          { term: 'group_vars/<group>.yml', desc: 'applies to a named inventory group' },
          { term: 'host_vars/<host>.yml', desc: 'applies to one host; overrides group_vars' },
        ],
      },
      {
        heading: 'Choosing a scope in Ansiform',
        body: [
          'Each task suggests a sensible default path — group_vars for shared definitions like VLANs, host_vars for per-device config like an interface or BGP neighbor. The output panel lets you switch the scope and name, and the suggested path updates to match.',
        ],
      },
    ],
    related: [
      { label: 'Generate group_vars/host_vars from a form', to: '/' },
      { label: 'Build a VLAN task', to: '/tasks/vlan' },
    ],
  },
  {
    slug: 'awx-survey-alternative',
    title: 'A free, client-side AWX Survey alternative',
    description:
      'Ansiform is a free, open-source, client-side alternative to AWX/AAP Surveys: curated forms that generate valid Ansible vars and device config, and can export an AWX survey_spec when you need one.',
    intro:
      'AWX and Ansible Automation Platform Surveys collect input for a Job Template. Ansiform gives you the same friendly-form experience without a server — and exports an AWX survey_spec when you do want one.',
    sections: [
      {
        heading: 'What AWX Surveys do',
        body: [
          'An AWX Survey attaches a questionnaire to a Job Template: each question maps to an extra var, with a type (text, integer, password, multiple-choice…), a default, and a required flag. It is a great way to let an operator launch a playbook without editing YAML.',
        ],
      },
      {
        heading: 'Where Ansiform fits',
        body: [
          'Ansiform runs entirely in your browser — no AWX, no server, no account. You fill out a curated, correct-by-construction form and get valid group_vars/host_vars plus a live preview of the device CLI the config produces. Nothing leaves the page: a strict Content-Security-Policy blocks all network egress, and secrets are never stored.',
          'It is not a playbook runner — it generates the inputs (and config preview) you then commit or feed into Ansible. Think of it as the survey and the var-file author, minus the platform.',
        ],
      },
      {
        heading: 'Export an AWX survey_spec',
        body: [
          'Already on AWX? Every Ansiform task can export an AWX/AAP survey_spec JSON from the output panel: pick “AWX Survey spec (JSON)”, then copy or download it and attach it to your Job Template. Secret fields map to password questions and never carry a value.',
        ],
      },
    ],
    related: [
      { label: 'Try the Interface IP task', to: '/tasks/interface-ip' },
      { label: 'Read about variable precedence', to: '/guides/ansible-variable-precedence-explained' },
    ],
  },
];

const registry = new Map<string, Guide>(guides.map((guide) => [guide.slug, guide]));

/** All guides, in authored order, as listing entries. */
export function listGuides(): Guide[] {
  return guides;
}

/** Look up a guide by slug, or `undefined`. */
export function getGuide(slug: string): Guide | undefined {
  return registry.get(slug);
}
