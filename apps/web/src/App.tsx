import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ChipAnatomyPage } from './pages/ChipAnatomyPage';
import { CpuSimulatorPage } from './pages/CpuSimulatorPage';
import { InstructionJourneyPage } from './pages/InstructionJourneyPage';
import { OverviewPage } from './pages/OverviewPage';

function SectionStub({ title, route }: { title: string; route: string }) {
  return (
    <section style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Route <code>{route}</code> — Laboratory view loading in Phase 8/9.
      </p>
    </section>
  );
}

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/anatomy" element={<ChipAnatomyPage />} />
        <Route path="/journey" element={<InstructionJourneyPage />} />
        <Route path="/simulator" element={<CpuSimulatorPage />} />
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
