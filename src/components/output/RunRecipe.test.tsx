import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RunRecipe, type RunRecipeMessages } from './RunRecipe';
import { buildRunRecipe } from '../../core/output/run-recipe';

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

const messages: RunRecipeMessages = {
  heading: 'Run it',
  intro: 'Guidance, not a generated playbook.',
  layoutLabel: 'File layout',
  commandLabel: 'Command',
  copyLabel: 'Copy command',
  copiedStatus: 'Command copied.',
  copyFailedStatus: 'Copy failed.',
};

const recipe = buildRunRecipe({
  files: ['group_vars/all.yml', 'host_vars/r1.yml'],
  scopes: [{ kind: 'group', name: 'all' }, { kind: 'host', name: 'r1' }],
  inventory: 'hosts.ini',
})!;

const byText = (root: HTMLElement, sel: string, text: string) =>
  [...root.querySelectorAll(sel)].find((el) => el.textContent === text) as HTMLButtonElement;

describe('RunRecipe (#83)', () => {
  it('renders the tree and command as text nodes (no markup, no inputs)', () => {
    const el = render(<RunRecipe recipe={recipe} messages={messages} />);

    const tree = el.querySelector('.run-recipe__tree')!;
    expect(tree.textContent).toBe(recipe.tree);
    expect(tree.childElementCount).toBe(0);

    const command = el.querySelector('.run-recipe__command')!;
    expect(command.textContent).toBe("ansible-playbook -i hosts.ini playbook.yml --limit 'r1'");
    expect(command.childElementCount).toBe(0);

    expect(el.querySelector('.run-recipe__intro')!.textContent).toBe(messages.intro);
    // Guidance only — never a form/input that could imply execution.
    expect(el.querySelector('input')).toBeNull();
    expect(el.querySelector('textarea')).toBeNull();
  });

  it('copies the command (not the tree) and announces via the status region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const el = render(<RunRecipe recipe={recipe} messages={messages} />);
    await act(async () => {
      byText(el, 'button', 'Copy command').click();
    });
    await flush();

    expect(writeText).toHaveBeenCalledWith(recipe.command);
    expect(el.querySelector('.output__status')!.textContent).toBe('Command copied.');
  });

  it('announces a failure when copy is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    // jsdom has no execCommand; define a failing one for the legacy fallback path.
    const doc = document as unknown as { execCommand?: () => boolean };
    const original = doc.execCommand;
    doc.execCommand = () => false;

    const el = render(<RunRecipe recipe={recipe} messages={messages} />);
    await act(async () => {
      byText(el, 'button', 'Copy command').click();
    });
    await flush();

    expect(el.querySelector('.output__status')!.textContent).toBe('Copy failed.');
    doc.execCommand = original;
  });
});
