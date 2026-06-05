import { describe, expect, it } from 'vitest';
import { regexReplace, regexReplaceFilter } from './regex';

describe('regex_replace', () => {
  it('replaces a leading anchor (interface short-name → long-name)', () => {
    expect(regexReplace('Gig0/1', '^Gig', 'GigabitEthernet')).toBe('GigabitEthernet0/1');
  });

  it('replaces all matches, like re.sub', () => {
    expect(regexReplace('a-b-c', '-', '_')).toBe('a_b_c');
  });

  it('supports numeric backreferences in Python syntax', () => {
    expect(regexReplace('foo123', '([a-z]+)(\\d+)', '\\2-\\1')).toBe('123-foo');
  });

  it('supports \\g<n> backreferences', () => {
    expect(regexReplace('2026-06-05', '(\\d+)-(\\d+)-(\\d+)', '\\g<3>/\\g<2>/\\g<1>')).toBe(
      '05/06/2026',
    );
  });

  it('treats $ in the replacement as a literal', () => {
    expect(regexReplace('price', '^', '$')).toBe('$price');
  });

  it('honours the ignorecase option', () => {
    expect(regexReplace('HELLO', 'hello', 'hi', { ignorecase: true })).toBe('hi');
    expect(regexReplace('HELLO', 'hello', 'hi')).toBe('HELLO');
  });

  it('coerces non-string input to string', () => {
    expect(regexReplace(undefined, 'x', 'y')).toBe('');
  });

  it('is registered as approximate', () => {
    expect(regexReplaceFilter.name).toBe('regex_replace');
    expect(regexReplaceFilter.fidelity).toBe('approximate');
  });
});
