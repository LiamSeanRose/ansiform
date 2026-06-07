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
  },
};
