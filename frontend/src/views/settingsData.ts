/**
 * settingsData.ts — static defaults for the Settings view.
 *
 * `INITIAL_TOOLS` defines the per-tool permission rows shown before the
 * backend settings are loaded (and is re-used as the authoritative list
 * when the API returns no tools). Extracted from SettingsPanels.tsx so
 * that component files only export React components (react-refresh rule).
 */
import type { ToolPermission } from '../types';

/** The initial per-tool permission rows, used as a fallback before settings load. */
export const INITIAL_TOOLS: ToolPermission[] = [
  {
    id: 'clipboard.copy',
    label: 'Copy to clipboard',
    desc: 'Always-available; how outputs reach you in the menubar flow.',
    perm: 'auto',
  },
  {
    id: 'format.markdown',
    label: 'Format → Markdown',
    desc: 'Write .md output. No side effects beyond text.',
    perm: 'auto',
  },
  {
    id: 'format.list',
    label: 'Format → List / check',
    desc: 'Format-only transformations.',
    perm: 'auto',
  },
  {
    id: 'file.write.inbox',
    label: 'Write to inbox folder',
    desc: 'Writes into ~/Whispr/inbox/ only. You picked this folder.',
    perm: 'auto',
  },
  {
    id: 'file.write.any',
    label: 'Write to other folders',
    desc: 'Any path the agent specifies.',
    perm: 'ask',
  },
  {
    id: 'obsidian.append.daily',
    label: 'Append to daily note',
    desc: "Adds to today's note in your configured vault.",
    perm: 'auto',
  },
  {
    id: 'obsidian.append.other',
    label: 'Append to other notes',
    desc: 'Any path in the Obsidian vault.',
    perm: 'ask',
  },
  {
    id: 'calendar.create_event',
    label: 'Create calendar event',
    desc: 'Adds events to your default macOS Calendar.',
    perm: 'ask',
  },
  {
    id: 'reminders.create',
    label: 'Create reminder',
    desc: 'Adds items to macOS Reminders.',
    perm: 'ask',
  },
  {
    id: 'github.create_issue',
    label: 'File a GitHub issue',
    desc: 'Repos must be allowlisted below.',
    perm: 'ask',
  },
  {
    id: 'shell.run',
    label: 'Run a shell command',
    desc: 'Allowlist-restricted. Off by default.',
    perm: 'off',
  },
  {
    id: 'web.search',
    label: 'Web search',
    desc: 'DuckDuckGo / Brave. Sends the query off-device.',
    perm: 'off',
  },
];
