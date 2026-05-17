import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCircle, TrendingUp, ArrowRight, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ leads: any[], deals: any[] }>({ leads: [], deals: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100); // small delay to allow render
      setQuery('');
      setResults({ leads: [], deals: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Fetch results when query changes
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ leads: [], deals: [] });
      setLoading(false);
      return;
    }

    const fetchSearch = async () => {
      setLoading(true);
      try {
        const resp = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(resp.data);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSearch, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatResults = [
    ...results.leads.map(l => ({ ...l, type: 'lead' })),
    ...results.deals.map(d => ({ ...d, type: 'deal' }))
  ];

  // Handle keyboard navigation inside popup
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults.length > 0 && flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
    }
  };

  const handleSelect = (item: any) => {
    setIsOpen(false);
    if (item.type === 'lead') {
      navigate(`/leads/${item.id}`);
    } else if (item.type === 'deal') {
      navigate(`/deals/${item.id}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="cmd-modal glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-header">
           <Search size={20} className="cmd-icon" />
           <input 
             ref={inputRef}
             type="text" 
             placeholder="Search leads, companies, deals..." 
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             onKeyDown={handleInputKeyDown}
             className="cmd-input"
           />
           <button className="cmd-close" onClick={() => setIsOpen(false)}>
              <X size={18} />
           </button>
        </div>

        <div className="cmd-body">
           {loading && <div className="cmd-loader">Searching...</div>}
           
           {!loading && query.length > 1 && flatResults.length === 0 && (
             <div className="cmd-empty">No results found for "{query}"</div>
           )}

           {!loading && results.leads.length > 0 && (
             <div className="cmd-section">
               <h4 className="cmd-section-title">Leads</h4>
               {results.leads.map((lead) => {
                 const isSelected = flatResults[selectedIndex]?.id === lead.id && flatResults[selectedIndex]?.type === 'lead';
                 return (
                   <div 
                     key={`lead-${lead.id}`} 
                     className={`cmd-item ${isSelected ? 'selected' : ''}`}
                     onClick={() => handleSelect({ ...lead, type: 'lead' })}
                     onMouseEnter={() => {
                        const idx = flatResults.findIndex(r => r.id === lead.id && r.type === 'lead');
                        if (idx !== -1) setSelectedIndex(idx);
                     }}
                   >
                     <div className="cmd-item-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <UserCircle size={16} />
                     </div>
                     <div className="cmd-item-content">
                        <span className="cmd-item-title">{lead.name}</span>
                        {lead.company && <span className="cmd-item-subtitle">{lead.company}</span>}
                     </div>
                     {isSelected && <ArrowRight size={14} className="cmd-item-action" />}
                   </div>
                 );
               })}
             </div>
           )}

           {!loading && results.deals.length > 0 && (
             <div className="cmd-section">
               <h4 className="cmd-section-title">Deals</h4>
               {results.deals.map((deal) => {
                 const isSelected = flatResults[selectedIndex]?.id === deal.id && flatResults[selectedIndex]?.type === 'deal';
                 return (
                   <div 
                     key={`deal-${deal.id}`} 
                     className={`cmd-item ${isSelected ? 'selected' : ''}`}
                     onClick={() => handleSelect({ ...deal, type: 'deal' })}
                     onMouseEnter={() => {
                        const idx = flatResults.findIndex(r => r.id === deal.id && r.type === 'deal');
                        if (idx !== -1) setSelectedIndex(idx);
                     }}
                   >
                     <div className="cmd-item-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={16} />
                     </div>
                     <div className="cmd-item-content">
                        <span className="cmd-item-title">{deal.title}</span>
                        <span className="cmd-item-subtitle">Stage: {deal.stage}</span>
                     </div>
                     {isSelected && <ArrowRight size={14} className="cmd-item-action" />}
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        <div className="cmd-footer">
           <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
           <span><kbd>Enter</kbd> to select</span>
           <span><kbd>Esc</kbd> to close</span>
        </div>
      </motion.div>
    </div>
    )}
    </AnimatePresence>
  );
}
