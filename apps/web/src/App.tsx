import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

function SectionStub({ title, route }: { title: string; route: string }) {
  return (
    <section style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Route <code>{route}</code> — Laboratory shell ready.
      </p>
    </section>
  );
}

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<SectionStub title="Overview" route="/" />} />
        <Route path="/anatomy" element={<SectionStub title="Chip Anatomy" route="/anatomy" />} />
        <Route path="/journey" element={<SectionStub title="Instruction Journey" route="/journey" />} />
        <Route path="/simulator" element={<SectionStub title="CPU Simulator" route="/simulator" />} />
        <Route path="/insights" element={<SectionStub title="Engineering Insights" route="/insights" />} />
        <Route path="/library" element={<SectionStub title="Technical Library" route="/library" />} />
      </Routes>
    </AppShell>
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
