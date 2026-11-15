import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';

describe('TIANEDGE Phase 1 route shell', () => {
  it.each([
    ['/', 'Overview'],
    ['/anatomy', 'Chip Anatomy'],
    ['/journey', 'Instruction Journey'],
    ['/simulator', 'CPU Simulator'],
    ['/insights', 'Engineering Insights'],
    ['/library', 'Technical Library'],
  ])('renders route %s cleanly', (route, heading) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });
});
