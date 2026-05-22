/**
 * components/index.ts — barrel re-export for the shared UI component
 * library ported from design-reference/project/studio-components.jsx.
 *
 * Lets later tasks import from one place, e.g.
 * `import { Btn, Chip } from '../components'`.
 */
export { Icon } from './Icon';
export type { IconProps, IconComponent, IconSet } from './Icon';

export { Btn, Kbd } from './Button';
export type { BtnProps, BtnVariant, BtnSize, KbdProps } from './Button';

export { Chip, FormatChip, FORMAT_META } from './Chip';
export type { ChipProps, ChipTone, FormatMeta, FormatChipProps } from './Chip';

export { Panel, SectionHeader, Empty } from './Panel';
export type { PanelProps, SectionHeaderProps, EmptyProps } from './Panel';

export { Waveform, RecDot, Spinner } from './Feedback';
export type { WaveformProps, RecDotProps, SpinnerProps } from './Feedback';

export { Segmented, Switch } from './Controls';
export type {
  SegmentedProps,
  SegmentedOption,
  SegmentedTone,
  SegmentedSize,
  SwitchProps,
} from './Controls';

export { diffTokens, DiffText } from './diff';
export type { DiffToken, DiffStatus, DiffResult, DiffTextProps } from './diff';
