import { describe, expect, it, afterEach } from 'vitest';
import { mount, byName, setValue } from './form/test-harness';
import { TaskWorkbench } from './TaskWorkbench';
import interfaceIpTask from '../tasks/interface-ip/task';
import { composeTranslate } from '../tasks/i18n';
import { createTranslator } from '../i18n';

const t = composeTranslate(createTranslator('en'), interfaceIpTask.messages.en ?? {});

let ui: ReturnType<typeof mount> | null = null;
afterEach(() => {
  ui?.unmount();
  ui = null;
});

describe('TaskWorkbench (two-pane integration)', () => {
  it('renders the live device-CLI preview and the YAML output from defaults', () => {
    ui = mount(<TaskWorkbench task={interfaceIpTask.task} t={t} />);

    const cli = ui.container.querySelector('.preview__cli')!;
    expect(cli.textContent).toContain('interface GigabitEthernet0/1');
    expect(cli.textContent).toContain('ip address 192.0.2.1 255.255.255.0');
    expect(cli.textContent).toContain('no shutdown');

    const yaml = ui.container.querySelector('.vars-output__yaml')!;
    expect(yaml.textContent).toContain('interface_name: GigabitEthernet0/1');
    expect(yaml.textContent).toContain('ip_cidr: 192.0.2.1/24');

    const path = ui.container.querySelector('.vars-output__path code')!;
    expect(path.textContent).toBe('host_vars/switch01.yml');
  });

  it('updates both panes live as the form changes', () => {
    ui = mount(<TaskWorkbench task={interfaceIpTask.task} t={t} />);

    setValue(byName<HTMLInputElement>(ui.container, 'ip_cidr'), '10.0.0.1/30');

    expect(ui.container.querySelector('.preview__cli')!.textContent).toContain(
      'ip address 10.0.0.1 255.255.255.252',
    );
    expect(ui.container.querySelector('.vars-output__yaml')!.textContent).toContain(
      'ip_cidr: 10.0.0.1/30',
    );
  });

  it('shows no degradation notice for the all-exact reference task', () => {
    ui = mount(<TaskWorkbench task={interfaceIpTask.task} t={t} />);
    expect(ui.container.querySelector('.preview__notice')).toBeNull();
  });

  it('updates the suggested path when the scope picker changes', () => {
    ui = mount(<TaskWorkbench task={interfaceIpTask.task} t={t} />);
    const code = () => ui!.container.querySelector('.vars-output__path code')!.textContent;
    expect(code()).toBe('host_vars/switch01.yml');

    setValue(scopeKind(ui.container), 'group');
    expect(code()).toBe('group_vars/switch01.yml');

    setValue(scopeName(ui.container), 'core');
    expect(code()).toBe('group_vars/core.yml');
  });

  it('switches the output to AWX survey-spec JSON (#13)', () => {
    ui = mount(<TaskWorkbench task={interfaceIpTask.task} t={t} />);
    setValue(formatSelect(ui.container), 'survey');

    const out = ui.container.querySelector('.vars-output__yaml')!.textContent ?? '';
    const parsed = JSON.parse(out) as { spec: { variable: string }[] };
    expect(parsed.spec.map((q) => q.variable)).toContain('interface_name');
    expect(ui.container.querySelector('.vars-output__path code')!.textContent).toBe(
      'survey-spec.json',
    );
  });

  it('offers copy and download controls (#12)', () => {
    ui = mount(<TaskWorkbench task={interfaceIpTask.task} t={t} />);
    const buttons = [...ui.container.querySelectorAll('.vars-output__btn')].map(
      (b) => b.textContent,
    );
    expect(buttons).toContain('Copy');
    expect(buttons).toContain('Download');
  });
});

// The output selects have generated ids, so locate them structurally.
function formatSelect(root: ParentNode): HTMLSelectElement {
  return root.querySelectorAll<HTMLSelectElement>('.vars-output__field select')[0];
}
function scopeKind(root: ParentNode): HTMLSelectElement {
  return root.querySelectorAll<HTMLSelectElement>('.vars-output__field select')[1];
}
function scopeName(root: ParentNode): HTMLInputElement {
  return root.querySelector<HTMLInputElement>('.vars-output__field input')!;
}
