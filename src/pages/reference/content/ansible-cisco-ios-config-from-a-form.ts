import type { ReferenceModule } from '../types';

/**
 * Reference page: per-vendor landing — Cisco IOS. Generic, public knowledge only.
 * Funnels to the curated task library (reachable from the header nav).
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-cisco-ios-config-from-a-form',
      title: 'Generate Ansible Cisco IOS config from a form',
      description:
        'Turn Cisco IOS tasks — interfaces, OSPF, BGP, ACLs, VRFs — into valid Ansible group_vars/host_vars with a live IOS CLI preview. No YAML written by hand.',
      lede: 'If you manage Cisco IOS or IOS-XE with Ansible, the variables are the hard part: a stray indent or the wrong filter and the run does something you did not intend. Ansiform turns each task into a form, writes the `group_vars`/`host_vars` for you, and shows the exact IOS CLI those variables produce — all in your browser.',
      sections: [
        {
          id: 'the-idea',
          heading: 'Form in, correct vars out',
          blocks: [
            {
              kind: 'p',
              text: 'Every task is a small form backed by a curated schema. You fill in fields — an interface, an IP, an OSPF area — and get byte-correct YAML plus a live preview of the device configuration. The YAML is always correct; the preview is the trust signal that shows you what the box will see before you ever run a playbook.',
            },
          ],
        },
        {
          id: 'what-you-can-build',
          heading: 'What you can build for IOS',
          blocks: [
            {
              kind: 'list',
              items: [
                'Interfaces and IP addressing — `interface`, `ip address`, MTU, admin state.',
                'Routing — OSPF, BGP neighbors, static routes, and VRF definitions.',
                'First-hop redundancy — HSRP and VRRP groups.',
                'Policy — extended ACLs, prefix-lists, and route-maps.',
                'Device basics and hardening — hostname, AAA servers, NTP, syslog, SNMPv3, SSH, banners.',
              ],
            },
          ],
        },
        {
          id: 'preview',
          heading: 'An exact preview, not a guess',
          blocks: [
            {
              kind: 'p',
              text: 'IOS tasks render at exact fidelity: the preview uses the same `ipaddr` queries Ansible does, so `10.0.0.1/24` becomes `ip address 10.0.0.1 255.255.255.0` on screen exactly as it will on the device. Where a preview cannot be exact it says so — a visible notice, never a silently-wrong render.',
            },
            {
              kind: 'code',
              text: 'interface GigabitEthernet0/1\n description Uplink to core\n ip address 10.0.0.1 255.255.255.0\n no shutdown',
            },
          ],
        },
        {
          id: 'get-started',
          heading: 'Get started',
          blocks: [
            {
              kind: 'p',
              text: 'Open the Tasks library from the header and pick an IOS task — the badge on each card shows the platforms it renders. Choose a `group_vars` or `host_vars` scope, fill the form, and download the file (or export an AWX survey spec). The same IOS task often previews IOS-XE, NX-OS, and Arista EOS too, so one form covers more than one platform.',
            },
          ],
        },
      ],
    },
  },
};
