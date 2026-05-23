/**
 * Panel.tsx — layout primitives: bordered `Panel`, view `SectionHeader`
 * and `Empty` state placeholder.
 *
 * Faithful port of the corresponding components in
 * design-reference/project/studio-components.jsx.
 */
import type { CSSProperties, ReactNode } from 'react';

/** Props for {@link Panel}. */
export interface PanelProps {
  /** Panel body content. */
  children?: ReactNode;
  /** Optional header title (uppercased, eyebrow style). */
  title?: ReactNode;
  /** Optional header action node, right-aligned. */
  action?: ReactNode;
  /** Style overrides merged onto the outer container. */
  style?: CSSProperties;
  /** When true (default), the body gets 14px padding. */
  padding?: boolean;
}

/** A bordered panel with an optional title/action header. */
export function Panel({ children, title, action, style, padding = true }: PanelProps) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-1)',
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg2)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            {title}
          </div>
          <div>{action}</div>
        </div>
      )}
      <div style={padding ? { padding: 14 } : {}}>{children}</div>
    </div>
  );
}

/** Props for {@link SectionHeader}. */
export interface SectionHeaderProps {
  /** Large section title. */
  title?: ReactNode;
  /** Optional muted subtitle below the title. */
  subtitle?: ReactNode;
  /** Optional action node, right-aligned. */
  action?: ReactNode;
}

/** A view header with title, subtitle and an action slot. */
export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 18,
      }}
    >
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>{title}</div>
        {subtitle && (
          <div style={{ color: 'var(--text-mute)', fontSize: 13, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

/** Props for {@link Empty}. */
export interface EmptyProps {
  /** Primary placeholder message. */
  title?: ReactNode;
  /** Optional secondary hint below the title. */
  hint?: ReactNode;
  /** Optional icon node above the title. */
  icon?: ReactNode;
}

/** An empty-state placeholder with a dashed border. */
export function Empty({ title, hint, icon }: EmptyProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '40px 20px',
        color: 'var(--text-mute)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--bg2)',
      }}
    >
      {icon}
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>{title}</div>
      {hint && <div style={{ fontSize: 12 }}>{hint}</div>}
    </div>
  );
}
