/**
 * Curated task: VRF definition (issue #60).
 *
 * A VRF with its route distinguisher and IPv4 route-targets. The base preview is
 * modern Cisco IOS / IOS-XE (`vrf definition` … `address-family ipv4`). VRF CLI
 * genuinely diverges across the line-CLI family, so this carries per-vendor
 * overlays (#27) rather than claiming one form fits all:
 *  - cisco-iosxe — identical to IOS, an exact same-CLI claim (reuses the base).
 *  - cisco-nxos — `vrf context` + `address-family ipv4 unicast`; not curated-
 *    verified, so approximate (the degrade banner shows).
 *  - cisco-iosxr — `vrf` + nested `import/export route-target` blocks; the RD is
 *    configured under `router bgp`, NOT the VRF stanza, so the IOS-XR preview
 *    omits it. Approximate.
 *
 * Correctness (council §4): the YAML vars are taken straight from the values and
 * are always correct for every vendor; only the previewed CLI differs. The base
 * template uses no filters, so the IOS/IOS-XE preview is exact. Authored from
 * public knowledge — no employer config. Trim_blocks-authored for Ansible.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.vrf.legend',
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'task.vrf.field.name.label',
          help: 'task.vrf.field.name.help',
          required: true,
          placeholder: 'CUST-A',
        },
        {
          type: 'text',
          name: 'rd',
          label: 'task.vrf.field.rd.label',
          help: 'task.vrf.field.rd.help',
          required: true,
          placeholder: '65000:100',
        },
        {
          type: 'text',
          name: 'rt_import',
          label: 'task.vrf.field.rt_import.label',
          help: 'task.vrf.field.rt_import.help',
          placeholder: '65000:100',
          omitWhenBlank: true,
        },
        {
          type: 'text',
          name: 'rt_export',
          label: 'task.vrf.field.rt_export.label',
          help: 'task.vrf.field.rt_export.help',
          placeholder: '65000:100',
          omitWhenBlank: true,
        },
      ],
    },
  ],
};

// Base: modern Cisco IOS / IOS-XE `vrf definition`. The route-target lines appear
// only when filled; the address-family block is always emitted.
const template = [
  'vrf definition {{ name }}',
  ' rd {{ rd }}',
  ' address-family ipv4',
  '{% if rt_import %}  route-target import {{ rt_import }}',
  '{% endif %}{% if rt_export %}  route-target export {{ rt_export }}',
  '{% endif %} exit-address-family',
].join('\n');

// NX-OS: `vrf context`, `address-family ipv4 unicast`, no exit-address-family.
const nxosTemplate = [
  'vrf context {{ name }}',
  ' rd {{ rd }}',
  ' address-family ipv4 unicast',
  '{% if rt_import %}  route-target import {{ rt_import }}',
  '{% endif %}{% if rt_export %}  route-target export {{ rt_export }}',
  '{% endif %}',
].join('\n');

// IOS-XR: `vrf`, nested import/export route-target blocks. The RD is configured
// under `router bgp`, not here, so it is intentionally absent from this stanza.
const iosxrTemplate = [
  'vrf {{ name }}',
  ' address-family ipv4 unicast',
  '{% if rt_import %}  import route-target',
  '   {{ rt_import }}',
  '{% endif %}{% if rt_export %}  export route-target',
  '   {{ rt_export }}',
  '{% endif %}',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'vrf',
    title: 'VRF definition',
    description:
      'Generate Ansible host_vars and a VRF definition — name, route distinguisher, and IPv4 route-targets — with a live device-CLI preview across Cisco IOS, IOS-XE, NX-OS, and IOS-XR.',
    schema,
    template,
    templates: {
      // IOS-XE renders an identical `vrf definition` stanza (#27): an explicit
      // per-vendor claim, not an inference.
      'cisco-iosxe': template,
      // NX-OS / IOS-XR use genuinely different VRF CLI; neither has had a curated
      // pass here, so they ship approximate and the preview shows the degrade banner.
      'cisco-nxos': { template: nxosTemplate, fidelity: 'approximate' },
      'cisco-iosxr': { template: iosxrTemplate, fidelity: 'approximate' },
    },
    defaultScope: { kind: 'host', name: 'router1' },
  },
  messages: {
    en: {
      'task.vrf.legend': 'VRF definition',
      'task.vrf.field.name.label': 'VRF name',
      'task.vrf.field.name.help': 'Name of the VRF, e.g. CUST-A.',
      'task.vrf.field.rd.label': 'Route distinguisher',
      'task.vrf.field.rd.help': 'RD as ASN:nn or IP:nn, e.g. 65000:100. (On IOS-XR, RD is set under router bgp.)',
      'task.vrf.field.rt_import.label': 'Route-target import',
      'task.vrf.field.rt_import.help':
        'Optional route-target to import, e.g. 65000:100. Omitted from the vars when blank.',
      'task.vrf.field.rt_export.label': 'Route-target export',
      'task.vrf.field.rt_export.help':
        'Optional route-target to export, e.g. 65000:100. Omitted from the vars when blank.',
    },
    fr: {
      'task.vrf.legend': 'Définition de VRF',
      'task.vrf.field.name.label': 'Nom de la VRF',
      'task.vrf.field.name.help': 'Nom de la VRF, par ex. CUST-A.',
      'task.vrf.field.rd.label': 'Distinguateur de route (RD)',
      'task.vrf.field.rd.help':
        'RD au format ASN:nn ou IP:nn, par ex. 65000:100. (Sur IOS-XR, le RD est défini sous router bgp.)',
      'task.vrf.field.rt_import.label': 'Route-target import',
      'task.vrf.field.rt_import.help':
        'Route-target à importer (facultatif), par ex. 65000:100. Omise des variables si vide.',
      'task.vrf.field.rt_export.label': 'Route-target export',
      'task.vrf.field.rt_export.help':
        'Route-target à exporter (facultatif), par ex. 65000:100. Omise des variables si vide.',
    },
  },
};
