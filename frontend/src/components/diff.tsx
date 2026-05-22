/**
 * diff.tsx — word-level text diff: the pure `diffTokens` function and
 * the `DiffText` renderer.
 *
 * Faithful port of the corresponding code in
 * design-reference/project/studio-components.jsx. `diffTokens` runs a
 * rough word-level LCS diff; the `Uint16Array` LCS table is kept as in
 * the prototype.
 */

/** Status of a single diff token. */
export type DiffStatus = 'same' | 'add' | 'rem';

/** A single diff token: a text fragment plus its change status. */
export interface DiffToken {
  /** The text fragment (word or separator). */
  t: string;
  /** Whether the fragment is unchanged, added or removed. */
  s: DiffStatus;
}

/** Result of {@link diffTokens}: tokens for the `a` and `b` sides. */
export interface DiffResult {
  /** Tokens for the original (`a`) text — `same` and `rem` only. */
  a: DiffToken[];
  /** Tokens for the revised (`b`) text — `same` and `add` only. */
  b: DiffToken[];
}

/**
 * Computes a rough word-level LCS diff between two strings.
 *
 * Both inputs are split on whitespace and common punctuation, then an
 * LCS table drives the alignment. Comparison is case-insensitive.
 *
 * @param a - The original text.
 * @param b - The revised text.
 * @returns Token arrays for each side (see {@link DiffResult}).
 */
// Co-located with DiffText by design (see T3 file-grouping spec); it is a
// pure function, not a component, so Fast Refresh's component-only rule is moot.
// eslint-disable-next-line react-refresh/only-export-components
export function diffTokens(a: string, b: string): DiffResult {
  // very rough LCS-style diff at word level
  const A = a.split(/(\s+|[,.!?;:])/);
  const B = b.split(/(\s+|[,.!?;:])/);
  // Build LCS table
  const m = A.length,
    n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--) {
      if (A[i].toLowerCase() === B[j].toLowerCase()) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  const outA: DiffToken[] = [],
    outB: DiffToken[] = [];
  let i = 0,
    j = 0;
  while (i < m && j < n) {
    if (A[i].toLowerCase() === B[j].toLowerCase()) {
      outA.push({ t: A[i], s: 'same' });
      outB.push({ t: B[j], s: 'same' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      outA.push({ t: A[i], s: 'rem' });
      i++;
    } else {
      outB.push({ t: B[j], s: 'add' });
      j++;
    }
  }
  while (i < m) {
    outA.push({ t: A[i], s: 'rem' });
    i++;
  }
  while (j < n) {
    outB.push({ t: B[j], s: 'add' });
    j++;
  }
  return { a: outA, b: outB };
}

/** Props for {@link DiffText}. */
export interface DiffTextProps {
  /** Diff tokens to render (one side of a {@link DiffResult}). */
  tokens: DiffToken[];
}

/** Renders an array of {@link DiffToken}s with add/remove styling. */
export function DiffText({ tokens }: DiffTextProps) {
  return (
    <span style={{ lineHeight: 1.7 }}>
      {tokens.map((tok, i) => {
        if (tok.s === 'same') return <span key={i}>{tok.t}</span>;
        if (tok.s === 'add')
          return (
            <span
              key={i}
              style={{
                background: 'rgba(92,199,138,.16)',
                color: 'var(--success)',
                borderRadius: 3,
                padding: '0 2px',
              }}
            >
              {tok.t}
            </span>
          );
        return (
          <span
            key={i}
            style={{
              background: 'rgba(232,92,92,.16)',
              color: 'var(--danger)',
              borderRadius: 3,
              padding: '0 2px',
              textDecoration: 'line-through',
              textDecorationColor: 'rgba(232,92,92,.5)',
            }}
          >
            {tok.t}
          </span>
        );
      })}
    </span>
  );
}
