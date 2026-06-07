import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { VarsDiff, type VarsDiffMessages } from './VarsDiff';

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

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const messages: VarsDiffMessages = {
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
  includeKey: 'Include {key} in the block',
  noneSelected: 'No keys selected.',
};

function paste(el: HTMLElement, value: string) {
  const ta = el.querySelector<HTMLTextAreaElement>('.vars-diff__paste')!;
  const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
  desc?.set?.call(ta, value);
  act(() => ta.dispatchEvent(new Event('input', { bubbles: true })));
}

describe('VarsDiff', () => {
  it('shows nothing until the user pastes a file', () => {
    const el = render(<VarsDiff generated={{ hostname: 'r1' }} messages={messages} />);
    expect(el.querySelector('.vars-diff__paste')).not.toBeNull();
    expect(el.querySelector('.vars-diff__group')).toBeNull();
    expect(el.querySelector('.vars-diff__block')).toBeNull();
  });

  it('classifies added / changed / unchanged keys against a pasted file', () => {
    const el = render(
      <VarsDiff
        generated={{ hostname: 'r1', vlan_id: 20, domain: 'example.com' }}
        messages={messages}
      />,
    );
    paste(el, 'hostname: r1\nvlan_id: 10\n');

    const added = el.querySelector('.vars-diff__group--added')!;
    const changed = el.querySelector('.vars-diff__group--changed')!;
    const unchanged = el.querySelector('.vars-diff__group--unchanged')!;
    expect(added.textContent).toContain('domain');
    expect(changed.textContent).toContain('vlan_id');
    expect(unchanged.textContent).toContain('hostname');
  });

  it('renders a paste-able block of added + changed keys as a text node', () => {
    const el = render(
      <VarsDiff generated={{ hostname: 'r1', vlan_id: 20 }} messages={messages} />,
    );
    paste(el, 'hostname: r1\nvlan_id: 10\n');
    const block = el.querySelector('.vars-diff__block')!;
    expect(block.textContent).toBe('vlan_id: 20\n');
    expect(block.childElementCount).toBe(0); // text node only, no markup
  });

  it('says nothing-to-add when the file already matches', () => {
    const el = render(<VarsDiff generated={{ hostname: 'r1' }} messages={messages} />);
    paste(el, 'hostname: r1\n');
    expect(el.querySelector('.vars-diff__block')).toBeNull();
    expect(el.querySelector('.vars-diff__no-changes')!.textContent).toBe('Nothing to add.');
  });

  it('echoes the current value for a changed key, masking a credential', () => {
    const el = render(
      <VarsDiff generated={{ snmp_community: 'newpublic', vlan_id: 20 }} messages={messages} />,
    );
    paste(el, 'snmp_community: oldpublic\nvlan_id: 10\n');
    const changed = el.querySelector('.vars-diff__group--changed')!;
    // The non-secret current value is shown; the secret one is masked.
    expect(changed.textContent).toContain('10');
    expect(changed.textContent).toContain('********');
    expect(changed.textContent).not.toContain('oldpublic');
    expect(changed.textContent).not.toContain('newpublic');
  });

  it('shows a specific error for a non-mapping paste', () => {
    const el = render(<VarsDiff generated={{ hostname: 'r1' }} messages={messages} />);
    paste(el, '- a\n- b\n');
    const err = el.querySelector('.vars-diff__error')!;
    expect(err.textContent).toBe('Must be a mapping.');
    expect(err.getAttribute('role')).toBe('alert');
    expect(el.querySelector('.vars-diff__group')).toBeNull();
  });

  it('copies the block and announces success via the status region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const el = render(<VarsDiff generated={{ vlan_id: 20 }} messages={messages} />);
    paste(el, 'vlan_id: 10\n');
    await act(async () => {
      el.querySelector<HTMLButtonElement>('.vars-diff__copy')!.click();
    });
    await flush();

    expect(writeText).toHaveBeenCalledWith('vlan_id: 20\n');
    expect(el.querySelector('.vars-diff__status')!.textContent).toBe('Block copied.');
  });

  // Per-key selection (#93)
  const checkbox = (el: HTMLElement, key: string) =>
    el.querySelector<HTMLInputElement>(`input[aria-label="Include ${key} in the block"]`)!;

  it('renders a checkbox per added and changed key, all ticked by default', () => {
    const el = render(
      <VarsDiff generated={{ hostname: 'r1', vlan_id: 20, domain: 'x' }} messages={messages} />,
    );
    paste(el, 'hostname: r1\nvlan_id: 10\n'); // unchanged: hostname, changed: vlan_id, added: domain
    expect(checkbox(el, 'vlan_id').checked).toBe(true);
    expect(checkbox(el, 'domain').checked).toBe(true);
    // unchanged keys are not selectable
    expect(el.querySelector('input[aria-label="Include hostname in the block"]')).toBeNull();
    expect(el.querySelector('.vars-diff__block')!.textContent).toBe('vlan_id: 20\ndomain: x\n');
  });

  it('unticking a key drops it from the block', () => {
    const el = render(<VarsDiff generated={{ vlan_id: 20, domain: 'x' }} messages={messages} />);
    paste(el, '{}\n'); // empty existing → both added
    act(() => checkbox(el, 'vlan_id').click());
    expect(el.querySelector('.vars-diff__block')!.textContent).toBe('domain: x\n');
  });

  it('copies only the selected subset', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const el = render(<VarsDiff generated={{ vlan_id: 20, domain: 'x' }} messages={messages} />);
    paste(el, '{}\n');
    act(() => checkbox(el, 'domain').click()); // drop domain, keep vlan_id
    await act(async () => el.querySelector<HTMLButtonElement>('.vars-diff__copy')!.click());
    await flush();
    expect(writeText).toHaveBeenCalledWith('vlan_id: 20\n');
  });

  it('shows the none-selected message when every key is unticked', () => {
    const el = render(<VarsDiff generated={{ vlan_id: 20 }} messages={messages} />);
    paste(el, '{}\n');
    act(() => checkbox(el, 'vlan_id').click());
    expect(el.querySelector('.vars-diff__block')).toBeNull();
    expect(el.querySelector('.vars-diff__no-changes')!.textContent).toBe('No keys selected.');
  });

  it('resets selection to all when the diff changes', () => {
    const el = render(<VarsDiff generated={{ vlan_id: 20, domain: 'x' }} messages={messages} />);
    paste(el, '{}\n');
    act(() => checkbox(el, 'vlan_id').click()); // deselect one
    expect(el.querySelector('.vars-diff__block')!.textContent).toBe('domain: x\n');
    paste(el, 'vlan_id: 99\n'); // new paste → selection resets to all selectable
    expect(checkbox(el, 'vlan_id').checked).toBe(true);
    expect(checkbox(el, 'domain').checked).toBe(true);
  });
});
