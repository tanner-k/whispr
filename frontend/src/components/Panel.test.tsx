import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel, SectionHeader, Empty } from './Panel';

describe('Panel', () => {
  it('renders its children', () => {
    render(<Panel>body content</Panel>);
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  it('renders a header when a title is given', () => {
    render(<Panel title="Transcript">body</Panel>);
    expect(screen.getByText('Transcript')).toBeInTheDocument();
  });

  it('renders a header when only an action is given', () => {
    render(<Panel action={<button type="button">act</button>}>body</Panel>);
    expect(screen.getByRole('button', { name: 'act' })).toBeInTheDocument();
  });

  it('omits the header when neither title nor action is given', () => {
    const { container } = render(<Panel>body</Panel>);
    // Outer div holds only the body wrapper when there is no header.
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it('pads the body by default and drops padding when padding is false', () => {
    const padded = render(<Panel>body</Panel>);
    expect(padded.container.firstElementChild?.lastElementChild).toHaveStyle({
      padding: '14px',
    });
    const bare = render(<Panel padding={false}>body</Panel>);
    expect(bare.container.firstElementChild?.lastElementChild).not.toHaveStyle({
      padding: '14px',
    });
  });
});

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Capture" />);
    expect(screen.getByText('Capture')).toBeInTheDocument();
  });

  it('renders the subtitle when given', () => {
    render(<SectionHeader title="Capture" subtitle="zero-UI capture" />);
    expect(screen.getByText('zero-UI capture')).toBeInTheDocument();
  });

  it('omits the subtitle when not given', () => {
    render(<SectionHeader title="Capture" />);
    expect(screen.queryByText('zero-UI capture')).not.toBeInTheDocument();
  });

  it('renders an action node', () => {
    render(<SectionHeader title="Capture" action={<button type="button">Run</button>} />);
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
  });
});

describe('Empty', () => {
  it('renders the title', () => {
    render(<Empty title="No matches" />);
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('renders the hint when given', () => {
    render(<Empty title="No matches" hint="Try another filter" />);
    expect(screen.getByText('Try another filter')).toBeInTheDocument();
  });

  it('omits the hint when not given', () => {
    render(<Empty title="No matches" />);
    expect(screen.queryByText('Try another filter')).not.toBeInTheDocument();
  });
});
