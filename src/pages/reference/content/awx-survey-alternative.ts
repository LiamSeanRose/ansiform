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
  },
};
