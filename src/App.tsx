import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import MainContent from './components/layout/MainContent';

// Pages
import Overview from './pages/Overview';
import Ideas from './pages/Ideas';
import Content from './pages/Content';
import Calendar from './pages/Calendar';
import CostTracking from './pages/CostTracking';
import Docs from './pages/Docs';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Skills from './pages/Skills';
import Agents from './pages/Agents';
import Tasks from './pages/Tasks';

import './styles/globals.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <Router>
      <div className="app">
        <TopBar onMenuClick={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <MainContent>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/content" element={<Content />} />
            <Route path="/content/:section" element={<Content />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/costs" element={<CostTracking />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/docs/:section" element={<Docs />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </MainContent>
      </div>
    </Router>
  );
}

export default App;
