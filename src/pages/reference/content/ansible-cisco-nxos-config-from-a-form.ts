import type { ReferenceModule } from '../types';

/**
 * Reference page: per-vendor landing — Cisco NX-OS. Generic, public knowledge
 * only. Funnels to the curated task library (reachable from the header nav).
 */
export const reference: ReferenceModule = {
  content: {
    en: {
      slug: 'ansible-cisco-nxos-config-from-a-form',
      title: 'Generate Ansible Cisco NX-OS config from a form',
      description:
        'Build Cisco NX-OS group_vars/host_vars from a friendly form with a live NX-OS CLI preview — interfaces, OSPF, prefix-lists, route-maps, VRFs and more.',
      lede: 'NX-OS shares most of its configuration model with IOS, but not all of it — `vrf context` instead of `vrf definition`, named ACLs without the `extended` keyword, address-families spelled `ipv4 unicast`. Ansiform knows those differences, so the same task previews the right NX-OS CLI and writes correct Ansible variables either way.',
      sections: [
        {
          id: 'the-idea',
          heading: 'One form, NX-OS output',
          blocks: [
            {
              kind: 'p',
              text: 'The variables Ansible needs are vendor-independent — an IP is an IP — so a single task schema serves NX-OS just as it serves IOS. What changes is the previewed CLI. Pick NX-OS as the preview target on a task and the device-config pane re-renders in NX-OS syntax while the `group_vars`/`host_vars` you download stay byte-correct.',
            },
          ],
        },
        {
          id: 'whats-different',
          heading: 'What NX-OS does differently',
          blocks: [
            {
              kind: 'table',
              columns: ['Feature', 'IOS', 'NX-OS'],
              rows: [
                ['VRF', '`vrf definition NAME`', '`vrf context NAME`'],
                ['Address family', '`address-family ipv4`', '`address-family ipv4 unicast`'],
                ['Named ACL', '`ip access-list extended NAME`', '`ip access-list NAME`'],
                ['Prefix-list / route-map', 'same syntax', 'same syntax'],
              ],
            },
            {
              kind: 'p',
              text: 'Some features (BGP, OSPF, HSRP) are feature-gated on NX-OS and configured in sub-modes that differ structurally from IOS; those previews are flagged where they are not a curated, verified match.',
            },
          ],
        },
        {
          id: 'fidelity',
          heading: 'Honest about fidelity',
          blocks: [
            {
              kind: 'p',
              text: 'Where an NX-OS preview is a verified one-to-one match for the CLI — prefix-lists, route-maps, named ACLs — it renders at exact fidelity. Where it has not had that curated pass, the preview shows a visible "preview may differ" notice rather than implying certainty. In both cases the YAML output is the same correct file; only the preview carries the caveat.',
            },
          ],
        },
        {
          id: 'get-started',
          heading: 'Get started',
          blocks: [
            {
              kind: 'p',
              text: 'Open the Tasks library from the header and choose a task whose badge lists Cisco NX-OS. Switch the preview target to NX-OS, fill the form, and download your `group_vars`/`host_vars`. Build several tasks into one var-file set on the Build page when you are configuring a whole device.',
            },
          ],
        },
      ],
    },
  },
};
