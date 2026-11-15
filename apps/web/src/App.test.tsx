import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { useAppStore } from './stores/useAppStore';

describe('TIANEDGE Phase 2 Design System & AppShell', () => {
  beforeEach(() => {
    useAppStore.setState({ reducedMotion: false, shortcutsOpen: false });
  });

  it.each([
    ['/', 'Overview'],
    ['/anatomy', 'Chip Anatomy'],
    ['/journey', 'Instruction Journey'],
    ['/simulator', 'CPU Simulator'],
    ['/insights', 'Engineering Insights'],
    ['/library', 'Technical Library'],
  ])('renders route %s inside AppShell with navigation and status pills', (route, heading) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
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
