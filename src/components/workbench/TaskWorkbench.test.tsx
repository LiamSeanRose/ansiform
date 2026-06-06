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
  preview: {
    regionLabel: 'Device CLI preview',
    heading: 'Live preview',
    degradedNotice: 'preview may differ',
    empty: 'empty',
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
});
