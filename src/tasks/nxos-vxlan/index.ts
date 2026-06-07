/**
 * Curated task: Cisco NX-OS VXLAN/EVPN L2 VNI (issue #74).
 *
 * Maps a VLAN to a Layer-2 VXLAN segment (VNI) on the NVE interface, with a
 * BGP-EVPN control plane (ingress replication, auto RD/RT). Its own NX-OS task.
 *
 * Honesty: VXLAN/EVPN underlay choices vary by platform and release (ingress
 * replication vs multicast, RD/RT derivation, anycast-gateway), so although the
 * YAML vars are always correct, the preview is authored from public docs and not
 * device-verified — the task declares `fidelityFloor: 'approximate'` so the pane
 * always shows the degrade notice.
 */
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = {
  groups: [
    {
      legend: 'task.nxos-vxlan.legend',
      fields: [
        {
          type: 'number',
          name: 'vlan_id',
          label: 'task.nxos-vxlan.field.vlan_id.label',
          help: 'task.nxos-vxlan.field.vlan_id.help',
          required: true,
          min: 1,
          max: 4094,
        },
        {
          type: 'number',
          name: 'vni',
          label: 'task.nxos-vxlan.field.vni.label',
          help: 'task.nxos-vxlan.field.vni.help',
          required: true,
          min: 1,
          max: 16777214,
        },
        {
          type: 'text',
          name: 'source_loopback',
          label: 'task.nxos-vxlan.field.source_loopback.label',
          help: 'task.nxos-vxlan.field.source_loopback.help',
          required: true,
          placeholder: 'loopback0',
          format: 'ifname',
        },
      ],
    },
  ],
};

// Jinja2 → Cisco NX-OS VXLAN/EVPN. Enable the overlay features, map the VLAN to a
// VNI, add the VNI to the NVE with BGP ingress replication, and define the L2
// EVPN instance with auto RD/RT.
const template = [
  'feature nv overlay',
  'feature vn-segment-vlan-based',
  'nv overlay evpn',
  'vlan {{ vlan_id }}',
  '  vn-segment {{ vni }}',
  'interface nve1',
  '  no shutdown',
  '  source-interface {{ source_loopback }}',
  '  member vni {{ vni }}',
  '    ingress-replication protocol bgp',
  'evpn',
  '  vni {{ vni }} l2',
  '    rd auto',
  '    route-target import auto',
  '    route-target export auto',
].join('\n');

export const task: TaskModule = {
  definition: {
    slug: 'nxos-vxlan',
    title: 'Cisco NX-OS VXLAN/EVPN L2 VNI',
    description:
      'Generate Ansible group_vars and a Cisco NX-OS VXLAN/EVPN configuration — map a VLAN to a Layer-2 VNI on the NVE with a BGP-EVPN control plane — with an approximate device-CLI preview.',
    vendor: 'cisco-nxos',
    fidelityFloor: 'approximate',
    schema,
    template,
    defaultScope: { kind: 'group', name: 'leaf-switches' },
  },
  messages: {
    en: {
      'task.nxos-vxlan.legend': 'VXLAN/EVPN L2 VNI',
      'task.nxos-vxlan.field.vlan_id.label': 'VLAN ID',
      'task.nxos-vxlan.field.vlan_id.help': 'Local VLAN to map to the VNI (1–4094).',
      'task.nxos-vxlan.field.vni.label': 'VNI',
      'task.nxos-vxlan.field.vni.help': 'VXLAN network identifier the VLAN maps to, e.g. 10010.',
      'task.nxos-vxlan.field.source_loopback.label': 'NVE source interface',
      'task.nxos-vxlan.field.source_loopback.help':
        'Loopback used as the VTEP source, e.g. loopback0.',
    },
    fr: {
      'task.nxos-vxlan.legend': 'VNI L2 VXLAN/EVPN',
      'task.nxos-vxlan.field.vlan_id.label': 'ID de VLAN',
      'task.nxos-vxlan.field.vlan_id.help': 'VLAN local à mapper sur le VNI (1–4094).',
      'task.nxos-vxlan.field.vni.label': 'VNI',
      'task.nxos-vxlan.field.vni.help': 'Identifiant de réseau VXLAN auquel le VLAN est mappé, par ex. 10010.',
      'task.nxos-vxlan.field.source_loopback.label': 'Interface source NVE',
      'task.nxos-vxlan.field.source_loopback.help':
        'Loopback utilisée comme source VTEP, par ex. loopback0.',
    },
  },
};
