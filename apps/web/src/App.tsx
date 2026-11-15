import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/anatomy', label: 'Chip Anatomy' },
  { to: '/journey', label: 'Instruction Journey' },
  { to: '/simulator', label: 'CPU Simulator' },
  { to: '/insights', label: 'Engineering Insights' },
  { to: '/library', label: 'Technical Library' },
];

function PlaceholderPage({ title, route }: { title: string; route: string }) {
  return (
    <section style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Route <code>{route}</code> — TIANEDGE Phase 1 foundation shell active.
      </p>
    </section>
  );
}

export function AppRoutes() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: 'var(--nav-height)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          gap: '16px',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em' }}>
          TIANEDGE
        </span>
        <nav aria-label="Primary navigation" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<PlaceholderPage title="Overview" route="/" />} />
          <Route path="/anatomy" element={<PlaceholderPage title="Chip Anatomy" route="/anatomy" />} />
          <Route path="/journey" element={<PlaceholderPage title="Instruction Journey" route="/journey" />} />
          <Route path="/simulator" element={<PlaceholderPage title="CPU Simulator" route="/simulator" />} />
          <Route path="/insights" element={<PlaceholderPage title="Engineering Insights" route="/insights" />} />
          <Route path="/library" element={<PlaceholderPage title="Technical Library" route="/library" />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
