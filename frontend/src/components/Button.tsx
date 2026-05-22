/**
 * Button.tsx — compact button (`Btn`) and keyboard-key pill (`Kbd`).
 *
 * Faithful port of the `Btn` / `Kbd` components in
 * design-reference/project/studio-components.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim; hover handlers
 * mutate `style` directly as in the prototype.
 */
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

/** Button visual variant. */
export type BtnVariant = 'default' | 'primary' | 'ghost' | 'subtle' | 'danger';

/** Button size — controls padding and font size. */
export type BtnSize = 'sm' | 'md' | 'lg';

/** Props for {@link Btn}. */
export interface BtnProps {
  /** Button label content. */
  children?: ReactNode;
  /** Click handler. Suppressed while `disabled`. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Visual variant. Defaults to `'default'`. */
  variant?: BtnVariant;
  /** Size preset. Defaults to `'md'`. */
  size?: BtnSize;
  /** Leading icon node. */
  icon?: ReactNode;
  /** Disables interaction and dims the button. */
  disabled?: boolean;
  /** Native `title` tooltip. */
  title?: string;
  /** Optional trailing keyboard shortcut hint, rendered as a {@link Kbd}. */
  kbd?: ReactNode;
  /** Style overrides merged onto the base style. */
  style?: CSSProperties;
  /** Renders the button in its active/pressed visual state. */
  active?: boolean;
}

/** Props for {@link Kbd}. */
export interface KbdProps {
  /** Key label content. */
  children?: ReactNode;
  /** Style overrides merged onto the base style. */
  style?: CSSProperties;
}

/** Shared base styles for compact controls. */
const compStyles = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    border: '1px solid var(--border)',
    background: 'var(--bg2)',
    borderRadius: 'var(--r-md)',
    color: 'var(--text)',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all .12s ease',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  } satisfies CSSProperties,
};

/** A keyboard-key pill (monospace, bordered). */
export function Kbd({ children, style }: KbdProps) {
  return (
    <span
      className="mono"
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        minWidth: 18,
        textAlign: 'center',
        borderRadius: 4,
        fontSize: 11,
        background: 'rgba(255,255,255,.04)',
        border: '1px solid var(--border)',
        color: 'var(--text-2)',
        marginLeft: 4,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** A compact button with variant, size, icon and optional shortcut hint. */
export function Btn({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  icon,
  disabled,
  title,
  kbd,
  style,
  active,
}: BtnProps) {
  const base: CSSProperties = {
    ...compStyles.btn,
    padding: size === 'sm' ? '4px 8px' : size === 'lg' ? '9px 14px' : '6px 10px',
    fontSize: size === 'sm' ? 12 : 14,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  };
  if (variant === 'primary')
    Object.assign(base, {
      background: 'var(--accent)',
      borderColor: 'var(--accent)',
      color: '#1a0f08',
      fontWeight: 600,
    });
  if (variant === 'ghost')
    Object.assign(base, {
      background: 'transparent',
      borderColor: 'transparent',
      color: 'var(--text-2)',
    });
  if (variant === 'subtle')
    Object.assign(base, {
      background: 'var(--bg3)',
      borderColor: 'transparent',
    });
  if (variant === 'danger')
    Object.assign(base, {
      background: 'var(--bg2)',
      borderColor: 'var(--danger-dim)',
      color: 'var(--danger)',
    });
  if (active)
    Object.assign(base, {
      background: 'var(--bg3)',
      borderColor: 'var(--border-hi)',
      color: 'var(--text)',
    });
  return (
    <button
      title={title}
      onClick={disabled ? undefined : onClick}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-2)';
          else if (variant === 'ghost') e.currentTarget.style.background = 'var(--bg2)';
          else e.currentTarget.style.borderColor = 'var(--border-hi)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--accent)';
        else if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
        else e.currentTarget.style.borderColor = active ? 'var(--border-hi)' : 'var(--border)';
      }}
    >
      {icon}
      {children && <span>{children}</span>}
      {kbd && <Kbd>{kbd}</Kbd>}
    </button>
  );
}
