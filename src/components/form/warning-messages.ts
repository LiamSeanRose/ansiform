/**
 * Build advisory network-warning copy (#86) from a translator, so the key list
 * lives in one place rather than being hand-duplicated by every surface that
 * enables `format` warnings (the task workbench and the build tray).
 */
import type { Translate } from './FieldControl';
import type { NetworkWarningMessages } from './types';

export function networkWarningMessages(t: Translate): NetworkWarningMessages {
  return {
    warnings: {
      ipv4: t('form.warning.ipv4'),
      cidr: t('form.warning.cidr'),
      ipv6: t('form.warning.ipv6'),
      mac: t('form.warning.mac'),
      vlan: t('form.warning.vlan'),
      vlanReserved: t('form.warning.vlanReserved'),
      asn: t('form.warning.asn'),
      ifname: t('form.warning.ifname'),
    },
    treatAsTextLabel: t('form.warning.treatAsText'),
  };
}
