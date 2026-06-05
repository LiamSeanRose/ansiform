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
});
