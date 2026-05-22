/**
 * captureData.ts — demo capture samples.
 *
 * Ported verbatim from `DEMO_SAMPLES` in
 * design-reference/project/studio-views.jsx. These drive the Capture
 * view (and `HistoryDetail`, which looks samples up by title) until
 * T8 swaps the views over to the backend API.
 */
import type { Sample } from '../types';

/** The demo capture results, in cycle order. */
export const DEMO_SAMPLES: Sample[] = [
  {
    id: 's1',
    raw: 'Okay so I need to head out tonight and grab milk, eggs, bread, and bananas if they look good. Also pick up some coffee filters and trash bags. Format this as a checklist please.',
    cleaned:
      'Milk, eggs, bread, and bananas if they look good. Also pick up some coffee filters and trash bags.',
    duration: 11.4,
    sttMs: 380,
    llmMs: 470,
    format: 'check',
    confidence: 0.94,
    title: 'Grocery run',
    formatted: {
      check:
        '- [ ] Milk\n- [ ] Eggs\n- [ ] Bread\n- [ ] Bananas (if they look good)\n- [ ] Coffee filters\n- [ ] Trash bags',
      list: '- Milk\n- Eggs\n- Bread\n- Bananas (if they look good)\n- Coffee filters\n- Trash bags',
      markdown:
        '# Grocery run\n\n- Milk\n- Eggs\n- Bread\n- Bananas (if they look good)\n- Coffee filters\n- Trash bags',
      prose:
        'Need to pick up milk, eggs, bread, and bananas if they look good — plus coffee filters and trash bags.',
    },
    alternates: [
      { format: 'check', confidence: 0.94 },
      { format: 'list', confidence: 0.71 },
      { format: 'markdown', confidence: 0.32 },
      { format: 'prose', confidence: 0.08 },
    ],
    tools: [],
    routedTo: 'clipboard',
  },
  {
    id: 's2',
    raw: 'Set up a sync with the design team next Tuesday at two pm for ninety minutes to review the new onboarding flow. Loop in Priya and Marco. Add it to my calendar.',
    cleaned:
      'Sync with the design team next Tuesday at 2:00 PM for 90 minutes to review the new onboarding flow. Loop in Priya and Marco.',
    duration: 9.8,
    sttMs: 320,
    llmMs: 540,
    format: 'calendar',
    confidence: 0.97,
    title: 'Design sync — onboarding',
    formatted: {
      calendar:
        'Design team sync — onboarding review\nTuesday, May 27 · 2:00–3:30 PM\nAttendees: Priya, Marco',
      prose:
        'Schedule a 90-minute design team sync next Tuesday at 2pm to review the new onboarding flow. Invite Priya and Marco.',
      markdown:
        '## Design sync — onboarding\n\n- **When:** Tue May 27, 2:00–3:30 PM\n- **Who:** Priya, Marco\n- **Topic:** Review new onboarding flow',
    },
    alternates: [
      { format: 'calendar', confidence: 0.97 },
      { format: 'markdown', confidence: 0.42 },
      { format: 'prose', confidence: 0.18 },
    ],
    tools: [
      {
        kind: 'calendar.create_event',
        args: {
          title: 'Design sync — onboarding',
          start: '2026-05-27T14:00',
          end: '2026-05-27T15:30',
          invitees: ['Priya', 'Marco'],
        },
        status: 'pending', // needs ask
        result: null,
      },
    ],
    routedTo: 'calendar',
  },
  {
    id: 's3',
    raw: "Shipped the new onboarding yesterday, working on the data export job today, blocked on the schema review for the billing rewrite. Format as markdown and save to today's daily note.",
    cleaned:
      'Shipped the new onboarding yesterday. Working on the data export job today. Blocked on the schema review for the billing rewrite.',
    duration: 14.2,
    sttMs: 510,
    llmMs: 620,
    format: 'markdown',
    confidence: 0.91,
    title: 'Standup notes',
    formatted: {
      markdown:
        '## Standup — May 21\n\n**Yesterday**\n- Shipped the new onboarding flow\n\n**Today**\n- Data export job\n\n**Blockers**\n- Schema review for the billing rewrite',
      list: '- Yesterday: shipped onboarding\n- Today: data export job\n- Blocker: schema review (billing rewrite)',
      prose:
        "Yesterday I shipped the new onboarding. Today I'm working on the data export job. I'm blocked on the schema review for the billing rewrite.",
    },
    alternates: [
      { format: 'markdown', confidence: 0.91 },
      { format: 'list', confidence: 0.56 },
      { format: 'prose', confidence: 0.31 },
    ],
    tools: [
      {
        kind: 'obsidian.append',
        args: { path: 'daily/2026-05-21.md' },
        status: 'done',
        result: 'Appended 217 chars',
      },
    ],
    routedTo: 'obsidian',
  },
];
