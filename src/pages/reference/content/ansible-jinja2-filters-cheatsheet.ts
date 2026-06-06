import type { ReferenceModule } from '../types';

/**
 * Reference page: Ansible Jinja2 filters cheatsheet.
 * Generic, public Ansible knowledge only (council §scope). Example addresses use
 * the RFC 5737 documentation ranges (192.0.2.0/24, 198.51.100.0/24).
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-jinja2-filters-cheatsheet',
      title: 'Ansible Jinja2 filters cheatsheet',
      description:
        'A practical cheatsheet of the Jinja2 filters used most in Ansible: defaults, strings, lists, dicts, networking (ipaddr), and encoding — with examples.',
      lede: 'Filters transform a value inside a Jinja2 expression with the pipe syntax `{{ value | filter }}`. In Ansible they run at playbook time, against your variables — which is why Ansiform keeps filters out of the YAML it generates and only mirrors the ones it can render exactly in the live preview.',
      sections: [
        {
          id: 'basics',
          heading: 'How a filter works',
          blocks: [
            {
              kind: 'p',
              text: 'A filter takes the value on its left and returns a new value. Filters chain left to right, and most take arguments:',
            },
            {
              kind: 'code',
              text: "{{ interface_name | default('GigabitEthernet0/1') | upper }}",
            },
            {
              kind: 'p',
              text: 'Filters never mutate your variables; they only shape how a value is rendered in a template. The same expression is evaluated by Ansible when the play runs.',
            },
          ],
        },
        {
          id: 'defaults',
          heading: 'Defaults and omitting keys',
          blocks: [
            {
              kind: 'table',
              columns: ['Filter', 'Example', 'Result'],
              rows: [
                ['default', '{{ mtu | default(1500) }}', '1500 when `mtu` is undefined'],
                [
                  'default(omit)',
                  '{{ description | default(omit) }}',
                  'drops the key entirely when undefined',
                ],
                [
                  'default(value, true)',
                  "{{ name | default('core', true) }}",
                  "uses 'core' when `name` is undefined *or* empty",
                ],
                ['mandatory', '{{ vlan_id | mandatory }}', 'fails the play if `vlan_id` is undefined'],
              ],
            },
            {
              kind: 'p',
              text: 'The `default(omit)` pattern is how Ansible leaves an argument unset — Ansiform applies the same "omit when blank" rule when it writes your `group_vars`/`host_vars`.',
            },
          ],
        },
        {
          id: 'strings',
          heading: 'String filters',
          blocks: [
            {
              kind: 'table',
              columns: ['Filter', 'Example', 'Result'],
              rows: [
                ['upper / lower', "{{ 'Gi0/1' | upper }}", 'GI0/1'],
                ['capitalize', "{{ 'core' | capitalize }}", 'Core'],
                ['replace', "{{ 'core_sw' | replace('_', '-') }}", 'core-sw'],
                [
                  'regex_replace',
                  "{{ 'Gi0/1' | regex_replace('^Gi', 'GigabitEthernet') }}",
                  'GigabitEthernet0/1',
                ],
                ['regex_search', "{{ '15.2(4)' | regex_search('[0-9.]+') }}", '15.2'],
                ['trim', "{{ '  vlan  ' | trim }}", 'vlan'],
                ['split', "{{ '10,20,30' | split(',') }}", "['10', '20', '30']"],
              ],
            },
          ],
        },
        {
          id: 'lists',
          heading: 'List filters',
          blocks: [
            {
              kind: 'table',
              columns: ['Filter', 'Example', 'Result'],
              rows: [
                ['join', "{{ ['a', 'b'] | join(', ') }}", 'a, b'],
                ['length', '{{ peers | length }}', 'count of items'],
                ['unique', '{{ [1, 1, 2] | unique }}', '[1, 2]'],
                ['sort', '{{ [3, 1, 2] | sort }}', '[1, 2, 3]'],
                ['flatten', '{{ [[1], [2]] | flatten }}', '[1, 2]'],
                [
                  'map(attribute=…)',
                  "{{ ints | map(attribute='name') | list }}",
                  "['Gi0/1', 'Gi0/2']",
                ],
                ['select / reject', "{{ nums | select('>', 0) | list }}", 'items passing the test'],
              ],
            },
          ],
        },
        {
          id: 'dicts',
          heading: 'Dictionary filters',
          blocks: [
            {
              kind: 'table',
              columns: ['Filter', 'Example', 'Result'],
              rows: [
                [
                  'dict2items',
                  "{{ {'a': 1} | dict2items }}",
                  "[{'key': 'a', 'value': 1}]",
                ],
                ['items2dict', '{{ pairs | items2dict }}', 'rebuilds a dict from key/value items'],
                ['combine', '{{ base | combine(overrides) }}', 'merges two dicts (right wins)'],
              ],
            },
          ],
        },
        {
          id: 'networking',
          heading: 'Networking filters (ipaddr)',
          blocks: [
            {
              kind: 'p',
              text: 'The networking filters live in the `ansible.utils` collection — install it (and `netaddr`) before using them. They are invaluable for deriving addressing from a single CIDR.',
            },
            {
              kind: 'table',
              columns: ['Filter', 'Example', 'Result'],
              rows: [
                ["ipaddr('address')", "{{ '192.0.2.5/24' | ansible.utils.ipaddr('address') }}", '192.0.2.5'],
                ["ipaddr('network')", "{{ '192.0.2.5/24' | ansible.utils.ipaddr('network') }}", '192.0.2.0'],
                [
                  "ipaddr('netmask')",
                  "{{ '192.0.2.0/24' | ansible.utils.ipaddr('netmask') }}",
                  '255.255.255.0',
                ],
                ["ipaddr('prefix')", "{{ '192.0.2.0/24' | ansible.utils.ipaddr('prefix') }}", '24'],
                ['ipv4 / ipv6', '{{ addr | ansible.utils.ipv4 }}', 'keeps only IPv4 (or IPv6) values'],
              ],
            },
          ],
        },
        {
          id: 'encoding',
          heading: 'Encoding and hashing',
          blocks: [
            {
              kind: 'table',
              columns: ['Filter', 'Example', 'Result'],
              rows: [
                ['to_json / to_nice_json', '{{ data | to_nice_json }}', 'pretty-printed JSON'],
                ['to_yaml / to_nice_yaml', '{{ data | to_nice_yaml }}', 'YAML text'],
                ['b64encode / b64decode', "{{ 'cisco' | b64encode }}", 'Y2lzY28='],
                ["hash('sha1')", "{{ 'x' | hash('sha1') }}", 'a hex digest'],
                [
                  "password_hash('sha512')",
                  "{{ secret | password_hash('sha512') }}",
                  'a crypt hash (needs passlib on the controller)',
                ],
              ],
            },
          ],
        },
        {
          id: 'ansiform-fidelity',
          heading: 'How Ansiform previews filters',
          blocks: [
            {
              kind: 'p',
              text: 'Ansiform never runs filters against your data — your YAML output is the raw values, which is always correct. The live device-CLI preview mirrors the filters it can render faithfully (for example `default`, `upper`, and `ipaddr`).',
            },
            {
              kind: 'p',
              text: 'Where a filter cannot be reproduced exactly (formatting-sensitive ones like `to_nice_yaml`, or runtime-only ones like `password_hash`), the preview degrades visibly with a notice — "preview may differ — the YAML output is still valid" — rather than showing something silently wrong.',
            },
          ],
        },
      ],
    },
  },
};
