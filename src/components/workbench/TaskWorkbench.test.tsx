import { describe, expect, it, afterEach } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TaskWorkbench, type WorkbenchMessages } from './TaskWorkbench';
import { task as interfaceIp } from '../../tasks/interface-ip';
import type { TaskModule } from '../../tasks/registry';
import type { Translate } from '../form';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

function render(el: ReactElement): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(el);
  });
  return container;
}

function setValue(el: HTMLInputElement, value: string) {
  const proto = Object.getPrototypeOf(el) as object;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event('input', { bubbles: true })));
}

function setSelect(el: HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(el) as object;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event('change', { bubbles: true })));
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

// A passthrough translator: schema keys aren't asserted here, so echo the key.
const echo: Translate = (key) => key;

const messages: WorkbenchMessages = {
  formHeading: 'Configure',
  output: {
    heading: 'Ansible vars (YAML)',
    pathLabel: 'Suggested file:',
    copyLabel: 'Copy',
    copiedStatus: 'Copied to clipboard.',
    copyFailedStatus: 'Copy failed.',
    downloadLabel: 'Download',
  },
  form: {
    requiredLabel: '(required)',
    errorSummaryHeading: 'Fix these:',
    submitLabel: 'Validate',
    errors: {
      required: 'required',
      pattern: 'pattern',
      min: 'min',
      max: 'max',
      notANumber: 'notANumber',
      incomplete: 'incomplete',
    },
  },
  surveyLabel: 'AWX survey (.json)',
  varsDiff: {
    summaryLabel: 'Show what this would change',
    description: 'Paste your file.',
    pasteLabel: 'Your existing file',
    pasteHelp: 'Stays in your browser.',
    placeholder: '# paste here',
    addedLabel: 'New keys to add',
    changedLabel: 'Keys that would change',
    unchangedLabel: 'Already up to date',
    currentLabel: 'currently',
    noChanges: 'Nothing to add.',
    blockHeading: 'Lines to add',
    blockNote: 'Secret values are real here.',
    copyLabel: 'Copy block',
    copiedStatus: 'Block copied.',
    copyFailedStatus: 'Copy failed.',
    errorTooLarge: 'Too large.',
    errorParse: 'Not YAML.',
    errorShape: 'Must be a mapping.',
  },
  preview: {
    regionLabel: 'Device CLI preview',
    heading: 'Live preview ({vendor})',
    degradedNotice: 'preview may differ',
    empty: 'empty',
  },
  vendor: {
    selectLabel: 'Preview target',
    labels: {
      'cisco-ios': 'Cisco IOS',
      'cisco-iosxe': 'Cisco IOS-XE',
      'cisco-nxos': 'Cisco NX-OS',
      'arista-eos': 'Arista EOS',
      'cisco-asa': 'Cisco ASA',
      'cisco-iosxr': 'Cisco IOS-XR',
      'cradlepoint-ncos': 'Cradlepoint NCOS',
      'juniper-junos': 'Juniper Junos',
      vyos: 'VyOS',
      'huawei-vrp': 'Huawei VRP',
    },
  },
};

describe('TaskWorkbench', () => {
  it('renders form, preview, and YAML for the interface-ip reference task', () => {
    const el = render(<TaskWorkbench task={interfaceIp} t={echo} messages={messages} />);
    expect(el.querySelector('form')).not.toBeNull();
    expect(el.querySelector('.preview__cli')).not.toBeNull();
    // Suggested host_vars path is shown.
    expect(el.querySelector('.output__filename')!.textContent).toBe('host_vars/switch1.yml');
    // enabled defaults on, so the initial preview shows "no shutdown".
    expect(el.querySelector('.preview__cli')!.textContent).toContain('no shutdown');
  });

  it('offers an AWX survey-spec download alongside the YAML output', () => {
    const el = render(<TaskWorkbench task={interfaceIp} t={echo} messages={messages} />);
    const survey = el.querySelector('.workbench__survey button');
    expect(survey).not.toBeNull();
    expect(survey!.textContent).toBe('AWX survey (.json)');
  });

  it('live-updates the YAML and CLI preview as the form changes', () => {
    const el = render(<TaskWorkbench task={interfaceIp} t={echo} messages={messages} />);
    const intf = el.querySelector<HTMLInputElement>('input[name="interface"]')!;
    const ip = el.querySelector<HTMLInputElement>('input[name="ip_address"]')!;
    setValue(intf, 'GigabitEthernet0/2');
    setValue(ip, '192.168.1.1/24');

    const yaml = el.querySelector('.output__yaml')!.textContent!;
    expect(yaml).toContain('interface: GigabitEthernet0/2');
    expect(yaml).toContain('ip_address: 192.168.1.1/24');

    const cli = el.querySelector('.preview__cli')!.textContent!;
    expect(cli).toContain('interface GigabitEthernet0/2');
    // ipaddr filter splits address/netmask in the preview.
    expect(cli).toContain('ip address 192.168.1.1 255.255.255.0');
  });

  it('masks secret values in the preview but keeps them in the YAML', () => {
    // Synthetic task with a secret field exercising the §5 masking path.
    const secretTask: TaskModule = {
      definition: {
        slug: 'secret-demo',
        title: 'Secret demo',
        description: 'd',
        schema: {
          groups: [
            {
              fields: [
                { type: 'text', name: 'host', label: 'host' },
                { type: 'secret', name: 'key', label: 'key' },
              ],
            },
          ],
        },
        template: 'host {{ host }}\nkey {{ key }}\n',
      },
      messages: { en: {} },
    };
    const el = render(<TaskWorkbench task={secretTask} t={echo} messages={messages} />);
    const key = el.querySelector<HTMLInputElement>('input[name="key"]')!;
    expect(key.type).toBe('password');
    setValue(key, 'hunter2');

    const cli = el.querySelector('.preview__cli')!.textContent!;
    expect(cli).toContain('key ********');
    expect(cli).not.toContain('hunter2');

    // The YAML deliverable still carries the real secret value.
    const yaml = el.querySelector('.output__yaml')!.textContent!;
    expect(yaml).toContain('key: hunter2');
  });

  it('offers a preview-target selector for multi-vendor tasks and relabels the heading', () => {
    // interface-ip declares a cisco-iosxe override (the #27 proof).
    const el = render(<TaskWorkbench task={interfaceIp} t={echo} messages={messages} />);
    const select = el.querySelector<HTMLSelectElement>('.workbench__vendor select')!;
    expect(select).not.toBeNull();
    expect([...select.options].map((o) => o.value)).toEqual([
      'cisco-ios',
      'cisco-iosxe',
      'cisco-nxos',
      'arista-eos',
      'cisco-iosxr',
      'juniper-junos',
      'huawei-vrp',
    ]);

    // Heading reflects the default vendor, then relabels on switch.
    expect(el.querySelector('.preview__heading')!.textContent).toBe('Live preview (Cisco IOS)');
    setSelect(select, 'cisco-iosxe');
    expect(el.querySelector('.preview__heading')!.textContent).toBe(
      'Live preview (Cisco IOS-XE)',
    );
    // The IOS-XE proof renders the identical CLI (same template), exact (no notice).
    expect(el.querySelector('.preview__cli')!.textContent).toContain('no shutdown');
    expect(el.querySelector('.preview__notice')).toBeNull();
  });

  it('clamps fidelity to approximate for a divergent vendor preview', () => {
    const el = render(<TaskWorkbench task={interfaceIp} t={echo} messages={messages} />);
    const select = el.querySelector<HTMLSelectElement>('.workbench__vendor select')!;
    // NX-OS ships an approximate template — the degrade notice must appear.
    setSelect(select, 'cisco-nxos');
    expect(el.querySelector('.preview__heading')!.textContent).toBe('Live preview (Cisco NX-OS)');
    expect(el.querySelector('.preview__notice')).not.toBeNull();
  });

  it('renders the Juniper Junos set-form preview, flagged approximate (#39)', () => {
    const el = render(<TaskWorkbench task={interfaceIp} t={echo} messages={messages} />);
    const intf = el.querySelector<HTMLInputElement>('input[name="interface"]')!;
    const ip = el.querySelector<HTMLInputElement>('input[name="ip_address"]')!;
    setValue(intf, 'ge-0/0/0');
    setValue(ip, '10.0.0.1/24');
    setSelect(el.querySelector<HTMLSelectElement>('.workbench__vendor select')!, 'juniper-junos');

    expect(el.querySelector('.preview__heading')!.textContent).toBe('Live preview (Juniper Junos)');
    const cli = el.querySelector('.preview__cli')!.textContent!;
    // Renders the flat `set` form (CIDR taken verbatim), no structural breakage.
    expect(cli).toContain('set interfaces ge-0/0/0 unit 0 family inet address 10.0.0.1/24');
    // Authored-not-curated → visible degrade.
    expect(el.querySelector('.preview__notice')).not.toBeNull();
  });

  it('shows no vendor selector for a single-vendor task', () => {
    const singleVendor: TaskModule = {
      ...interfaceIp,
      definition: { ...interfaceIp.definition, templates: undefined },
    };
    const el = render(<TaskWorkbench task={singleVendor} t={echo} messages={messages} />);
    expect(el.querySelector('.workbench__vendor')).toBeNull();
    expect(el.querySelector('.preview__heading')!.textContent).toBe('Live preview (Cisco IOS)');
  });
});
