/**
 * benchData.ts — the A/B bench corpus.
 *
 * Ported verbatim from `BENCH_SAMPLES` in
 * design-reference/project/studio-views.jsx. These five clips drive the
 * Bench view until T8 swaps it over to the backend API.
 */
import type { BenchSample } from '../types';

/** The demo bench corpus — five clips with ground-truth + engine outputs. */
export const BENCH_SAMPLES: BenchSample[] = [
  {
    id: 'b1',
    title: 'meeting-clip-3.wav',
    durationS: 14.2,
    truth:
      'So I think the main thing we want to ship by Friday is the new onboarding flow, and, um, the data export feature.',
    ifw: 'So I think the main thing we want to ship by Friday is the new onboarding flow, and the data export feature.',
    apple:
      'so I think the main thing we want to ship by Friday is the new onboarding flow and um the data export feature',
    ifwMs: 410,
    appleMs: 620,
    ifwWer: 4.1,
    appleWer: 2.7,
  },
  {
    id: 'b2',
    title: 'grocery-list.wav',
    durationS: 11.4,
    truth: 'I need to grab milk, eggs, bread, and bananas if they look good.',
    ifw: 'I need to grab milk eggs bread and bananas if they look good',
    apple: 'I need to grab milk, eggs, bread, and bananas if they look good.',
    ifwMs: 280,
    appleMs: 510,
    ifwWer: 5.4,
    appleWer: 1.9,
  },
  {
    id: 'b3',
    title: 'standup-may-21.wav',
    durationS: 14.2,
    truth:
      'Shipped the new onboarding flow yesterday. Working on the data export job today. Blocked on the schema review for billing.',
    ifw: 'Shipped the new onboarding flow yesterday. Working on the data export job today. Blocked on the schema review for billing.',
    apple:
      'shipped the new onboarding flow yesterday working on the data export job today blocked on the schema review for billing',
    ifwMs: 380,
    appleMs: 590,
    ifwWer: 1.8,
    appleWer: 2.2,
  },
  {
    id: 'b4',
    title: 'noisy-cafe.wav',
    durationS: 9.7,
    truth: "Let's get the proposal out before the call on Friday.",
    ifw: "Let's get the proposal out before the call on Friday.",
    apple: "let's get the proposal out before the call Friday",
    ifwMs: 320,
    appleMs: 540,
    ifwWer: 0,
    appleWer: 6.2,
  },
  {
    id: 'b5',
    title: 'accented-en-1.wav',
    durationS: 17.3,
    truth: 'The library uses a custom tokenizer that handles code blocks and inline markup.',
    ifw: 'The library uses a custom tokenizer that handles code blocks and inline markup.',
    apple: 'the library uses a custom tokeniser that handles code blocks an inline markup',
    ifwMs: 460,
    appleMs: 690,
    ifwWer: 2.0,
    appleWer: 4.4,
  },
];
