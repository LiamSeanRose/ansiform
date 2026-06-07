import type { ReferenceModule } from '../types';

/**
 * Reference page: worked examples / cookbook (issue #64).
 * End-to-end walkthroughs — fill a form, get the vars, reference them from a
 * playbook. Generic public knowledge only; no employer config.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'cookbook-worked-examples',
      title: 'Cookbook: from form to vars to playbook',
      description:
        'Worked end-to-end examples — fill an Ansiform form, get correct group_vars/host_vars, and reference them from a playbook. Single tasks and a composed set.',
      lede: 'Ansiform produces the inputs to your automation: you fill a friendly form, it gives you correct Ansible variables (with a device-CLI preview you can trust), and you keep the YAML. These walkthroughs show the whole loop — form → vars → playbook — for a single task, a group-wide task, and a composed multi-file set.',
      sections: [
        {
          id: 'workflow',
          heading: 'The workflow',
          blocks: [
            {
              kind: 'list',
              items: [
                'Open a task (browse them all at `/tasks`) and fill the form. The right pane previews the device CLI as you type.',
                'Copy the `group_vars`/`host_vars` YAML, or download it — the suggested file path is shown above the output.',
                'Drop the file into your inventory, then reference the variables from a playbook (examples below).',
                'Nothing you type leaves the browser; the YAML is always correct, and the preview flags itself when it can only approximate.',
              ],
            },
          ],
        },
        {
          id: 'host-vars',
          heading: 'Example 1 — an interface address (host_vars)',
          blocks: [
            {
              kind: 'p',
              text: 'Open the `interface-ip` task, set the interface to `GigabitEthernet0/1`, the address to `10.0.0.1/24`, MTU `1500`, and leave it enabled. The output pane suggests `host_vars/switch1.yml`:',
            },
            {
              kind: 'code',
              text: 'interface: GigabitEthernet0/1\nip_address: 10.0.0.1/24\nmtu: 1500\nenabled: true',
            },
            {
              kind: 'p',
              text: 'Save that as `host_vars/switch1.yml` in your inventory, then reference it from a playbook. The IP is split into address and mask exactly as the live preview showed it:',
            },
            {
              kind: 'code',
              text: "- hosts: switches\n  gather_facts: false\n  tasks:\n    - name: Configure the interface\n      cisco.ios.ios_config:\n        parents: \"interface {{ interface }}\"\n        lines:\n          - \"ip address {{ ip_address | ansible.utils.ipaddr('address') }} {{ ip_address | ansible.utils.ipaddr('netmask') }}\"\n          - \"mtu {{ mtu }}\"\n          - \"{{ 'no shutdown' if enabled else 'shutdown' }}\"",
            },
          ],
        },
        {
          id: 'group-vars',
          heading: 'Example 2 — syslog hosts for a group (group_vars)',
          blocks: [
            {
              kind: 'p',
              text: 'Some settings belong to a whole group rather than one device. Open the `syslog` task, set the trap level to `informational` and the source interface to `Loopback0`, and add a couple of hosts. The output suggests `group_vars/all.yml`:',
            },
            {
              kind: 'code',
              text: 'trap_level: informational\nsource_interface: Loopback0\nhosts:\n  - host: 192.0.2.50\n    transport: udp\n  - host: 192.0.2.51\n    vrf: Mgmt-intf\n    transport: tcp',
            },
            {
              kind: 'p',
              text: 'A loop in the playbook turns the list into one line per host:',
            },
            {
              kind: 'code',
              text: '- name: Configure syslog destinations\n  cisco.ios.ios_config:\n    lines:\n      - "logging source-interface {{ source_interface }}"\n      - "logging trap {{ trap_level }}"\n- name: Add each syslog host\n  cisco.ios.ios_config:\n    lines: "logging host {{ item.host }} transport {{ item.transport }}"\n  loop: "{{ hosts }}"',
            },
          ],
        },
        {
          id: 'compose',
          heading: 'Example 3 — compose a whole var-file set (/build)',
          blocks: [
            {
              kind: 'p',
              text: 'Real changes touch several tasks at once. The Build page (`/build`) is a task tray: add several tasks, fill each, pick a scope (group or host) per task, and it assembles a complete multi-file set in one pass.',
            },
            {
              kind: 'list',
              items: [
                'Add `interface-ip` scoped to host `switch1`, and `syslog` scoped to group `all`.',
                'Each task keeps its own preview; colliding keys across tasks are flagged by name — never silently merged.',
                'Download the set as a `.zip` and unzip it into your inventory: you get `host_vars/switch1.yml` and `group_vars/all.yml` together.',
              ],
            },
            {
              kind: 'p',
              text: 'The result is a correct, ready-to-commit `group_vars`/`host_vars` tree — not a merged or runnable playbook. You bring the playbook; Ansiform brings trustworthy variables.',
            },
          ],
        },
        {
          id: 'tips',
          heading: 'Tips that apply everywhere',
          blocks: [
            {
              kind: 'list',
              items: [
                'The YAML output is always correct — filters run at playbook runtime, not on your vars. Only the *preview* can be approximate, and it says so when it is.',
                'Switch the preview target to see another platform’s CLI (Cisco IOS / IOS-XE / IOS-XR / NX-OS / ASA, Arista EOS, Juniper Junos, Cradlepoint NCOS). The variables stay the same; only the rendered config changes.',
                'Secret fields are password inputs — never stored, logged, encoded, or shared. Keep secrets out of committed `group_vars` by using Vault or a lookup in the playbook.',
                'Already have a template? Paste it into the reader (`/reader`) to see the variables it expects before you build the form by hand.',
              ],
            },
          ],
        },
      ],
    },
  },
};
