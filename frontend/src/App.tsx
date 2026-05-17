import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Backup from './pages/Backup';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Deals from './pages/Deals';
import DealDetails from './pages/DealDetails';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Reports from './pages/Reports';
import QuoteGenerator from './pages/QuoteGenerator';
import PublicQuote from './pages/PublicQuote';
import CommandPalette from './components/CommandPalette';
import Products from './pages/Products';
import AuditLog from './pages/AuditLog';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [authUser, setAuthUser] = useState<any>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem('crm-user');
    if (stored) {
      try { setAuthUser(JSON.parse(stored)); } catch(e) {}
    }
  }, []);

  if (window.location.pathname.startsWith('/quote/')) {
    return (
      <Router>
        <Routes>
          <Route path="/quote/:token" element={<PublicQuote />} />
        </Routes>
      </Router>
    );
  }

  if (!authUser) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login setAuthUser={setAuthUser} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <CommandPalette />
        <Sidebar authUser={authUser} setAuthUser={setAuthUser} />
        <main className="main-content">
           <AnimatePresence mode="wait">
             <motion.div
               key={window.location.pathname}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
               style={{ height: '100%', minWidth: 0, width: '100%' }}
             >
               <Routes>
                 <Route path="/" element={<Dashboard />} />
                 <Route path="/leads" element={<Leads authUser={authUser} />} />
                 <Route path="/leads/:id" element={<LeadDetails authUser={authUser} />} />
                 <Route path="/deals" element={<Deals authUser={authUser} />} />
                 <Route path="/deals/:id" element={<DealDetails />} />
                 <Route path="/deals/:id/quote" element={<QuoteGenerator />} />
                 <Route path="/products" element={authUser.role === 'Admin' ? <Products authUser={authUser} /> : <Navigate to="/" />} />
                 <Route path="/tasks" element={<Tasks authUser={authUser} />} />
                 <Route path="/reports" element={authUser.role === 'Admin' ? <Reports /> : <Navigate to="/" />} />
                 <Route path="/audit" element={authUser.role === 'Admin' ? <AuditLog /> : <Navigate to="/" />} />
                 <Route path="/backup" element={authUser.role === 'Admin' ? <Backup /> : <Navigate to="/" />} />
                 <Route path="/settings" element={<Settings authUser={authUser} />} />
               </Routes>
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

export default App;
