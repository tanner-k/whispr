/**
 * vocabData.ts — the initial vocabulary list.
 *
 * Ported verbatim from `VOCAB_INITIAL` in
 * design-reference/project/studio-views.jsx. These nine trigger phrases
 * seed the Vocab view until T8 swaps it over to the backend API.
 */
import type { VocabItem } from '../types';

/** The seed vocabulary — built-in phrases plus two user-added examples. */
export const VOCAB_INITIAL: VocabItem[] = [
  {
    id: 1,
    phrase: 'format as markdown',
    target: { type: 'format', value: 'markdown' },
    builtin: true,
    hits: 142,
  },
  {
    id: 2,
    phrase: 'make a checklist',
    target: { type: 'format', value: 'check' },
    builtin: true,
    hits: 88,
  },
  {
    id: 3,
    phrase: 'make a list / bullet points',
    target: { type: 'format', value: 'list' },
    builtin: true,
    hits: 61,
  },
  {
    id: 4,
    phrase: 'numbered steps',
    target: { type: 'format', value: 'steps' },
    builtin: true,
    hits: 24,
  },
  {
    id: 5,
    phrase: 'draft an email',
    target: { type: 'format', value: 'email' },
    builtin: true,
    hits: 11,
  },
  {
    id: 6,
    phrase: 'add to my calendar',
    target: { type: 'tool', value: 'calendar.create_event' },
    builtin: true,
    hits: 14,
  },
  {
    id: 7,
    phrase: 'save to inbox',
    target: { type: 'tool', value: 'obsidian.append' },
    builtin: true,
    hits: 33,
  },
  {
    id: 8,
    phrase: 'file an issue',
    target: { type: 'tool', value: 'github.create_issue' },
    builtin: false,
    hits: 2,
  },
  {
    id: 9,
    phrase: 'log it in my journal',
    target: { type: 'tool', value: 'obsidian.append' },
    builtin: false,
    hits: 7,
  },
];
