import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ChipAnatomyPage } from './pages/ChipAnatomyPage';
import { CpuSimulatorPage } from './pages/CpuSimulatorPage';
import { EngineeringInsightsPage } from './pages/EngineeringInsightsPage';
import { InstructionJourneyPage } from './pages/InstructionJourneyPage';
import { OverviewPage } from './pages/OverviewPage';
import { TechnicalLibraryPage } from './pages/TechnicalLibraryPage';

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/anatomy" element={<ChipAnatomyPage />} />
        <Route path="/journey" element={<InstructionJourneyPage />} />
        <Route path="/simulator" element={<CpuSimulatorPage />} />
        <Route path="/insights" element={<EngineeringInsightsPage />} />
        <Route path="/library" element={<TechnicalLibraryPage />} />
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
