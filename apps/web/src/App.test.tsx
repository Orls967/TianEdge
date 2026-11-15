import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { useContentStore } from './content/useContentStore';
import type { ContentBundle } from './content/validators';
import { useAppStore } from './stores/useAppStore';

function loadBundleFromDisk(): ContentBundle {
  const dir = resolve(__dirname, '../public/data');
  const read = (file: string) => JSON.parse(readFileSync(resolve(dir, file), 'utf-8'));
  return {
    components: read('components.json'),
    insights: read('insights.json'),
    glossary: read('glossary.json'),
    fundamentals: read('fundamentals.json'),
    references: read('references.json'),
    diagrams: read('diagrams.json'),
    formulas: read('formulas.json'),
    learningPaths: read('learning_paths.json'),
    citations: read('citations.json'),
  };
}

describe('TIANEDGE AppShell & Connected Routes', () => {
  const diskBundle = loadBundleFromDisk();

  beforeEach(() => {
    useAppStore.setState({ reducedMotion: false, shortcutsOpen: false });
    useContentStore.setState({
      bundle: diskBundle,
      loading: false,
      error: null,
      initialized: true,
    });
  });

  it.each([
    ['/', /Explore the Architecture/i],
    ['/anatomy', /Chip Anatomy/i],
    ['/journey', /Instruction Journey/i],
    ['/simulator', /TIAN-ISA v1 CPU Simulator/i],
    ['/insights', /Engineering Insights/i],
    ['/library', /Technical Library/i],
  ])('renders route %s inside AppShell with navigation and status pills', (route, headingPattern) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: headingPattern })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByText(/Local Mode|API Synced|Syncing/i)).toBeInTheDocument();
  });

  it('toggles reduced motion and opens keyboard shortcuts modal', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const motionBtn = screen.getByRole('button', { name: /pause animations/i });
    fireEvent.click(motionBtn);
    expect(useAppStore.getState().reducedMotion).toBe(true);

    const shortcutsBtn = screen.getByRole('button', { name: /keyboard shortcuts help/i });
    fireEvent.click(shortcutsBtn);
    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument();
  });
});
