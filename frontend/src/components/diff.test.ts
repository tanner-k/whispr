import { describe, expect, it } from 'vitest';
import { diffTokens } from './diff';

describe('diffTokens', () => {
  it('marks every token as same for identical strings', () => {
    const { a, b } = diffTokens('the quick brown fox', 'the quick brown fox');
    expect(a.every((tok) => tok.s === 'same')).toBe(true);
    expect(b.every((tok) => tok.s === 'same')).toBe(true);
  });

  it('is case-insensitive when matching tokens', () => {
    const { a, b } = diffTokens('Hello World', 'hello world');
    expect(a.every((tok) => tok.s === 'same')).toBe(true);
    expect(b.every((tok) => tok.s === 'same')).toBe(true);
  });

  it('marks an inserted word as add on the b side', () => {
    const { a, b } = diffTokens('the quick fox', 'the quick brown fox');
    expect(a.some((tok) => tok.s === 'add')).toBe(false);
    const added = b.filter((tok) => tok.s === 'add');
    expect(added.some((tok) => tok.t === 'brown')).toBe(true);
  });

  it('marks a deleted word as rem on the a side', () => {
    const { a, b } = diffTokens('the quick brown fox', 'the quick fox');
    expect(b.some((tok) => tok.s === 'rem')).toBe(false);
    const removed = a.filter((tok) => tok.s === 'rem');
    expect(removed.some((tok) => tok.t === 'brown')).toBe(true);
  });

  it('reconstructs the original text from the a side tokens', () => {
    const original = 'one two three';
    const { a } = diffTokens(original, 'one two four');
    expect(a.map((tok) => tok.t).join('')).toBe(original);
  });

  it('reconstructs the revised text from the b side tokens', () => {
    const revised = 'one two four';
    const { b } = diffTokens('one two three', revised);
    expect(b.map((tok) => tok.t).join('')).toBe(revised);
  });

  it('handles empty strings without throwing', () => {
    expect(() => diffTokens('', '')).not.toThrow();
    const { a, b } = diffTokens('', 'added');
    expect(a.every((tok) => tok.s !== 'add')).toBe(true);
    expect(b.some((tok) => tok.s === 'add')).toBe(true);
  });
});
