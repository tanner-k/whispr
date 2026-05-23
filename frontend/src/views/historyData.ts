/**
 * historyData.ts — demo history rows.
 *
 * Ported verbatim from `HISTORY_ITEMS` in
 * design-reference/project/studio-views.jsx. These drive the History
 * view until T8 swaps it over to the backend API.
 */
import type { HistoryItem } from '../types';

/** The demo history list, newest first. */
export const HISTORY_ITEMS: HistoryItem[] = [
  {
    id: 'h1',
    when: 'Today · 10:14',
    title: 'Grocery run',
    format: 'check',
    preview: 'Milk, eggs, bread, bananas if they look good…',
    durationS: 11,
    totalMs: 850,
    starred: true,
    route: 'clipboard',
  },
  {
    id: 'h2',
    when: 'Today · 09:48',
    title: 'Standup — May 21',
    format: 'markdown',
    preview: 'Shipped onboarding yesterday. Working on…',
    durationS: 14,
    totalMs: 1130,
    starred: true,
    route: 'obsidian',
  },
  {
    id: 'h3',
    when: 'Today · 09:02',
    title: 'Parser idea',
    format: 'prose',
    preview: 'The parser should also handle the case where…',
    durationS: 23,
    totalMs: 1420,
    starred: false,
    route: 'file',
  },
  {
    id: 'h4',
    when: 'Yesterday · 17:31',
    title: 'Design sync — onboarding',
    format: 'calendar',
    preview: 'Set up a sync with the design team next…',
    durationS: 10,
    totalMs: 860,
    starred: true,
    route: 'calendar',
  },
  {
    id: 'h5',
    when: 'Yesterday · 14:08',
    title: 'Bug report draft',
    format: 'markdown',
    preview: 'Repro: open settings, toggle dark mode twice…',
    durationS: 34,
    totalMs: 2010,
    starred: false,
    route: 'clipboard',
  },
  {
    id: 'h6',
    when: 'Yesterday · 11:22',
    title: 'Quick thank-you note',
    format: 'email',
    preview: 'Hey Jordan — thanks again for the intro to…',
    durationS: 18,
    totalMs: 1300,
    starred: false,
    route: 'clipboard',
  },
  {
    id: 'h7',
    when: 'Mon May 19',
    title: 'Reading list',
    format: 'list',
    preview: 'Designing data-intensive applications, the…',
    durationS: 12,
    totalMs: 980,
    starred: false,
    route: 'file',
  },
  {
    id: 'h8',
    when: 'Sun May 18',
    title: 'Trip checklist',
    format: 'check',
    preview: 'Passport, phone charger, neck pillow, eye…',
    durationS: 21,
    totalMs: 1610,
    starred: true,
    route: 'obsidian',
  },
];
