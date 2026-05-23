import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Waveform, RecDot, Spinner } from './Feedback';

describe('Waveform', () => {
  it('renders 64 bars by default', () => {
    const { container } = render(<Waveform />);
    expect(container.firstElementChild?.children).toHaveLength(64);
  });

  it('renders one bar per amplitude when amplitudes are given', () => {
    const { container } = render(<Waveform amplitudes={[0.2, 0.5, 0.9]} />);
    expect(container.firstElementChild?.children).toHaveLength(3);
  });

  it('respects a custom barCount', () => {
    const { container } = render(<Waveform barCount={10} />);
    expect(container.firstElementChild?.children).toHaveLength(10);
  });

  it('applies the height prop to the container', () => {
    const { container } = render(<Waveform height={28} />);
    expect(container.firstElementChild).toHaveStyle({ height: '28px' });
  });

  it('animates bars only when active', () => {
    const activeRender = render(<Waveform active barCount={2} />);
    const activeBar = activeRender.container.firstElementChild?.firstElementChild as HTMLElement;
    expect(activeBar.getAttribute('style')).toContain('waveBar');

    const idleRender = render(<Waveform barCount={2} />);
    const idleBar = idleRender.container.firstElementChild?.firstElementChild as HTMLElement;
    expect(idleBar.getAttribute('style')).not.toContain('waveBar');
  });
});

describe('RecDot', () => {
  it('renders with the default size', () => {
    const { container } = render(<RecDot />);
    expect(container.firstElementChild).toHaveStyle({ width: '8px', height: '8px' });
  });

  it('applies a custom size', () => {
    const { container } = render(<RecDot size={14} />);
    expect(container.firstElementChild).toHaveStyle({ width: '14px', height: '14px' });
  });
});

describe('Spinner', () => {
  it('renders an svg at the default size', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('width', '14');
  });

  it('applies a custom size', () => {
    const { container } = render(<Spinner size={28} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '28');
  });
});
