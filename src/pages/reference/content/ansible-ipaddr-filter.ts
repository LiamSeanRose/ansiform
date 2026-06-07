import type { ReferenceModule } from '../types';

/**
 * Reference page: the Ansible ipaddr filter.
 * Generic, public Ansible knowledge only. Query outputs match Ansible's ipaddr
 * (IPv4) for the example input.
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-ipaddr-filter',
      title: 'The Ansible ipaddr filter: a practical guide',
      description:
        'The ipaddr filter turns an IP or CIDR into the part you need — address, netmask, network, or prefix. Common queries with examples, plus the gotchas.',
      lede: 'Network configs almost never want the value exactly as typed. You store `10.0.0.5/24`, but the device wants `10.0.0.5` and `255.255.255.0` on separate lines. The `ipaddr` filter does that conversion at playbook runtime so you can keep one clean variable.',
      sections: [
        {
          id: 'what-it-does',
          heading: 'What it does',
          blocks: [
            {
              kind: 'p',
              text: '`ipaddr` takes an address or CIDR on its left and a query string on its right, and returns the requested piece: `{{ ip | ipaddr("netmask") }}`. It is part of `ansible.utils` (formerly `ansible.netcommon`) and needs the `netaddr` Python library on the control node. Filters run at runtime, against your variables — they never change the stored value.',
            },
          ],
        },
        {
          id: 'common-queries',
          heading: 'Common queries',
          blocks: [
            {
              kind: 'p',
              text: 'With the input `10.0.0.5/24`:',
            },
            {
              kind: 'table',
              columns: ['Query', 'Result', 'Use for'],
              rows: [
                ['`ipaddr("address")`', '`10.0.0.5`', 'the host address, no prefix'],
                ['`ipaddr("netmask")`', '`255.255.255.0`', 'a dotted mask (e.g. IOS `ip address`)'],
                ['`ipaddr("network")`', '`10.0.0.0`', 'the network address (e.g. OSPF, routes)'],
                ['`ipaddr("prefix")`', '`24`', 'the prefix length as a number'],
                ['`ipaddr("broadcast")`', '`10.0.0.255`', 'the broadcast address'],
                ['`ipaddr("network/prefix")`', '`10.0.0.0/24`', 'the network in CIDR form'],
              ],
            },
          ],
        },
        {
          id: 'examples',
          heading: 'In a template',
          blocks: [
            {
              kind: 'p',
              text: 'A single `ip_address` variable feeds an entire interface stanza:',
            },
            {
              kind: 'code',
              text: 'interface {{ interface }}\n ip address {{ ip_address | ipaddr("address") }} {{ ip_address | ipaddr("netmask") }}\n\n# with ip_address: 10.0.0.5/24  →\ninterface GigabitEthernet0/1\n ip address 10.0.0.5 255.255.255.0',
            },
          ],
        },
        {
          id: 'gotchas',
          heading: 'Gotchas',
          blocks: [
            {
              kind: 'list',
              items: [
                'Invalid input returns `false`, not an error — `{{ "not-an-ip" | ipaddr("address") }}` evaluates to `False`. Guard it or validate your inputs first.',
                'The filter needs `netaddr` installed on the control node; a missing library is a common first-run failure.',
                'A plain host IP with no prefix (`10.0.0.5`) is treated as a `/32`; pass the CIDR when you need the real mask.',
                'IPv6 and the more exotic queries exist too, but stick to the handful above for day-to-day interface and routing config.',
              ],
            },
          ],
        },
        {
          id: 'preview',
          heading: 'Seeing it before you run',
          blocks: [
            {
              kind: 'p',
              text: 'Ansiform renders `ipaddr` exactly — the address, netmask, network, and prefix queries match Ansible — so the live device-CLI preview shows the real result as you type. Tasks that take an IP, such as the interface and routing tasks in the library, use it under the hood. Open the Tasks library from the header to try one.',
            },
          ],
        },
      ],
    },
  },
};
