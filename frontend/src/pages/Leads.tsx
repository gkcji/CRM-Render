import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Phone,
  Mail,
  MessageCircle,
  Users,
  Download,
  Eye,
  Tag,
  MapPin,
  Briefcase,
  Calendar,
  Component,
  ChevronDown,
  SlidersHorizontal,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LeadType = 'All' | 'Calling' | 'Email' | 'WhatsApp';

const defaultFilters = {
  status: 'All',
  source: 'All',
  industry: 'All',
  service: 'All',
  location: 'All',
  designation: 'All',
  tags: 'All',
  dateFrom: '',
  dateTo: '',
};

const LeadsPage = ({ authUser }: { authUser?: any }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LeadType>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [newLead, setNewLead] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '', city: '', website: '', notes: '', source: 'Website', status: 'New', lead_type: 'Calling', industry: '', service: '', address: '', pincode: '', state: '', country: '', tags: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadLeadType, setUploadLeadType] = useState<string>('Calling');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close 3-dot menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tabs: { key: LeadType; label: string; icon: any; color: string }[] = [
    { key: 'All', label: 'All Leads', icon: Users, color: '#3b82f6' },
    { key: 'Calling', label: 'Calling Leads', icon: Phone, color: '#10b981' },
    { key: 'Email', label: 'Email Leads', icon: Mail, color: '#f59e0b' },
    { key: 'WhatsApp', label: 'WhatsApp Leads', icon: MessageCircle, color: '#25d366' },
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      let url = `/api/leads`;
      if (authUser?.role !== 'Admin' && authUser?.id) {
        url += `?assigned_to=${authUser.id}`;
      }
      const resp = await axios.get(url);
      setLeads(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: any) => {
    if (e) e.preventDefault();
    
    if (!newLead.first_name || newLead.first_name.trim() === '') {
       alert("Please enter a First Name for the lead.");
       return;
    }
    
    try {
      const url = editingId 
        ? `/api/leads/${editingId}` 
        : `/api/leads`;
        
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
         method,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(newLead)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
         throw new Error(data.error || 'Failed to save lead to the database.');
      }

      setIsModalOpen(false);
      fetchLeads();
      
      // Reset form
      setNewLead({ first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '', city: '', website: '', notes: '', source: 'Website', status: 'New', lead_type: activeTab === 'All' ? 'Calling' : activeTab, industry: '', service: '', address: '', pincode: '', state: '', country: '', tags: '' });
      setEditingId(null);
      
    } catch (err: any) {
      alert("System Error: " + err.message);
    }
  };

  const handleEdit = (lead: any) => {
    const parts = (lead.name || '').trim().split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ');
    setNewLead({ 
       first_name, last_name, 
       email: lead.email || '', phone: lead.phone || '', 
       company: lead.company || '', job_title: lead.job_title || '', 
       city: lead.city || '', website: lead.website || '', 
       notes: lead.notes || '', source: lead.source || 'Website', 
       status: lead.status || 'New', lead_type: lead.lead_type || 'Calling',
       industry: lead.industry || '', service: lead.service || '',
       address: lead.address || '', pincode: lead.pincode || '', 
       state: lead.state || '', country: lead.country || '', tags: lead.tags || ''
    });
    setEditingId(lead.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await axios.delete(`/api/leads/${id}`);
      fetchLeads();
    } catch (err) {
      alert("Error deleting lead");
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter((l: string) => l.trim());
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

    const nameIdx = headers.findIndex((h: string) => h.includes('name'));
    const emailIdx = headers.findIndex((h: string) => h.includes('email'));
    const phoneIdx = headers.findIndex((h: string) => h.includes('phone'));
    const sourceIdx = headers.findIndex((h: string) => h.includes('source'));

    const parsedLeads = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c: string) => c.trim());
      if (cols.length < 2) continue;
      parsedLeads.push({
        name: nameIdx >= 0 ? cols[nameIdx] : cols[0],
        email: emailIdx >= 0 ? cols[emailIdx] : (cols[1] || ''),
        phone: phoneIdx >= 0 ? cols[phoneIdx] : (cols[2] || ''),
        source: sourceIdx >= 0 ? cols[sourceIdx] : 'File Upload',
        status: 'New',
        lead_type: uploadLeadType
      });
    }

    if (parsedLeads.length === 0) { alert("No valid data found in file"); return; }

    try {
      const resp = await axios.post(`/api/leads/bulk`, { leads: parsedLeads });
      const { imported, duplicates, duplicateNames } = resp.data;
      let msg = `Successfully imported ${imported} leads as ${uploadLeadType} Leads.`;
      if (duplicates > 0) {
        msg += `\n\n${duplicates} duplicate(s) were skipped`;
        if (duplicateNames?.length) msg += `: ${duplicateNames.join(', ')}`;
      }
      alert(msg);
      fetchLeads();
      setIsUploadOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error uploading leads");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    const params = new URLSearchParams();
    if (activeTab !== 'All') params.set('lead_type', activeTab);
    if (filters.status !== 'All') params.set('status', filters.status);
    if (filters.source !== 'All') params.set('source', filters.source);
    window.open(`/api/leads/export?${params.toString()}`, '_blank');
  };

  // ── Computed unique filter options from data ──
  const uniqueSources     = ['All', ...Array.from(new Set(leads.map(l => l.source).filter(Boolean)))] as string[];
  const uniqueStatuses    = ['All', 'New', 'Contacted', 'Qualified', 'Lost', 'Converted'];
  const uniqueIndustries  = ['All', ...Array.from(new Set(leads.map(l => l.industry).filter(Boolean)))] as string[];
  const uniqueServices    = ['All', ...Array.from(new Set(leads.map(l => l.service).filter(Boolean)))] as string[];
  const uniqueLocations   = ['All', ...Array.from(new Set(leads.map(l => l.city).filter(Boolean)))] as string[];
  const uniqueDesignations = ['All', ...Array.from(new Set(leads.map(l => l.job_title).filter(Boolean)))] as string[];
  // Extract all individual tags across all leads and deduplicate
  const uniqueTags = ['All', ...Array.from(new Set(
    leads.flatMap(l => (l.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean))
  ))] as string[];

  // ── Active filter count badge ──
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'dateFrom' || k === 'dateTo') return v !== '';
    return v !== 'All';
  }).length + (activeTab !== 'All' ? 1 : 0);

  // ── Master filter logic ──
  const filteredLeads = leads.filter(l => {
    // Search bar: name, email, phone, company, website/domain
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || [
      l.name, l.email, l.phone, l.company, l.website
    ].some(f => f?.toLowerCase().includes(q));

    const matchTab       = activeTab === 'All' || l.lead_type === activeTab;
    const matchStatus    = filters.status === 'All' || (l.status || '').toLowerCase() === filters.status.toLowerCase();
    const matchSource    = filters.source === 'All' || l.source === filters.source;
    const matchIndustry  = filters.industry === 'All' || l.industry === filters.industry;
    const matchService   = filters.service === 'All' || l.service === filters.service;
    const matchLocation  = filters.location === 'All' || (l.city || '') === filters.location;
    const matchDesig     = filters.designation === 'All' || (l.job_title || '') === filters.designation;
    const matchTags      = filters.tags === 'All' || (l.tags || '').split(',').map((t: string) => t.trim()).includes(filters.tags);
    const createdAt = new Date(l.created_at);
    const matchDateFrom  = !filters.dateFrom || createdAt >= new Date(filters.dateFrom);
    const matchDateTo    = !filters.dateTo   || createdAt <= new Date(filters.dateTo + 'T23:59:59');

    return matchSearch && matchTab && matchStatus && matchSource && matchIndustry &&
           matchService && matchLocation && matchDesig && matchTags && matchDateFrom && matchDateTo;
  });

  const setFilter = (key: keyof typeof defaultFilters, val: string) =>
    setFilters(prev => ({ ...prev, [key]: val }));

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    setActiveTab('All');
  };

  const tabCounts = {
    All: leads.length,
    Calling: leads.filter(l => l.lead_type === 'Calling').length,
    Email: leads.filter(l => l.lead_type === 'Email').length,
    WhatsApp: leads.filter(l => l.lead_type === 'WhatsApp').length,
  };

  return (
    <div className="leads-page">

      {/* ── Unified Header Card (top bar + expandable filter) ── */}
      <div className="leads-header-card glass-card">

        {/* Top Bar row */}
        <div className="unified-top-bar">
          <div className="utb-left">
            <h1>Leads</h1>
            <div className="v-divider" />
            <div className="channel-tabs">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.key}
                    className={`channel-tab ${activeTab === tab.key ? 'active' : ''}`}
                    style={{ '--tab-color': tab.color } as any}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon size={14} color={activeTab === tab.key ? tab.color : '#94a3b8'} />
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-count">{tabCounts[tab.key]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="utb-right">
            {/* Global Search */}
            <div className="search-box">
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by name, email, phone, company, domain…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />}
            </div>

            <button className="icon-btn" onClick={handleDownload} title="Export CSV"><Download size={16} /></button>
            <button className="icon-btn" onClick={() => setIsUploadOpen(true)} title="Import CSV"><Upload size={16} /></button>

            <button className="btn-primary compact-btn" onClick={() => {
              setNewLead({ first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '', city: '', website: '', notes: '', source: 'Website', status: 'New', lead_type: activeTab === 'All' ? 'Calling' : activeTab, industry: '', service: '', address: '', pincode: '', state: '', country: '', tags: '' });
              setEditingId(null); setIsModalOpen(true);
            }}>
              <Plus size={16} /><span>Add Lead</span>
            </button>

            <div className="v-divider" />

            {/* Filter Toggle */}
            <button
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Advanced Filters"
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
              <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Clear All — only when something is active */}
            {(activeFilterCount > 0 || searchTerm) && (
              <button
                className="clear-all-btn"
                onClick={() => { clearAllFilters(); setSearchTerm(''); setShowFilters(false); }}
                title="Clear all filters and search"
              >
                <X size={13} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel — slides open INSIDE the same card */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="filter-panel">
                {/* Divider line */}
                <div className="fp-top-divider" />

                {/* Panel Header */}
                <div className="fp-header">
                  <div className="fp-title"><SlidersHorizontal size={14} /> Filter By</div>
                  {activeFilterCount > 0 && (
                    <button className="fp-clear" onClick={clearAllFilters}>
                      <X size={13} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                    </button>
                  )}
                </div>

                {/* All Dropdowns in one line */}
                <div className="fp-row">

                  <div className="fp-group">
                    <label>Status</label>
                    <div className="fp-select-wrap">
                      <select value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                        {uniqueStatuses.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={12} className="fp-chevron" />
                    </div>
                  </div>

                  <div className="fp-group">
                    <label>Source</label>
                    <div className="fp-select-wrap">
                      <select value={filters.source} onChange={e => setFilter('source', e.target.value)}>
                        {uniqueSources.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={12} className="fp-chevron" />
                    </div>
                  </div>

                  <div className="fp-group">
                    <label>Industry</label>
                    <div className="fp-select-wrap">
                      <select value={filters.industry} onChange={e => setFilter('industry', e.target.value)}>
                        {uniqueIndustries.length > 1 ? uniqueIndustries.map(s => <option key={s}>{s}</option>) : <><option>All</option><option>Technology</option><option>Healthcare</option><option>Finance</option><option>Real Estate</option><option>Education</option><option>Retail</option><option>Other</option></>}
                      </select>
                      <ChevronDown size={12} className="fp-chevron" />
                    </div>
                  </div>

                  <div className="fp-group">
                    <label><Component size={12} /> Category</label>
                    <div className="fp-select-wrap">
                      <select value={filters.service} onChange={e => setFilter('service', e.target.value)}>
                        {uniqueServices.length > 1 ? uniqueServices.map(s => <option key={s}>{s}</option>) : <><option>All</option><option>Software</option><option>Consulting</option><option>Support</option><option>Training</option><option>Other</option></>}
                      </select>
                      <ChevronDown size={12} className="fp-chevron" />
                    </div>
                  </div>

                  <div className="fp-group">
                    <label><MapPin size={12} /> City</label>
                    <div className="fp-select-wrap">
                      <select value={filters.location} onChange={e => setFilter('location', e.target.value)}>
                        {uniqueLocations.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={12} className="fp-chevron" />
                    </div>
                  </div>

                  <div className="fp-group">
                    <label><Briefcase size={12} /> Designation</label>
                    <div className="fp-select-wrap">
                      <select value={filters.designation} onChange={e => setFilter('designation', e.target.value)}>
                        {uniqueDesignations.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={12} className="fp-chevron" />
                    </div>
                  </div>

                  <div className="fp-group">
                    <label><Tag size={12} /> Tag</label>
                    <div className="fp-select-wrap">
                      <select value={filters.tags} onChange={e => setFilter('tags', e.target.value)}>
                        {uniqueTags.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={12} className="fp-chevron" />
                    </div>
                  </div>

                  <div className="fp-group">
                    <label><Calendar size={12} /> From</label>
                    <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
                  </div>

                  <div className="fp-group">
                    <label><Calendar size={12} /> To</label>
                    <input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
                  </div>

                </div>

                {/* Active chips */}
                {activeFilterCount > 0 && (
                  <div className="fp-chips">
                    {activeTab !== 'All' && <span className="fp-chip">Channel: {activeTab} <X size={10} style={{cursor:'pointer'}} onClick={() => setActiveTab('All')} /></span>}
                    {filters.status !== 'All' && <span className="fp-chip">Status: {filters.status} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('status', 'All')} /></span>}
                    {filters.source !== 'All' && <span className="fp-chip">Source: {filters.source} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('source', 'All')} /></span>}
                    {filters.industry !== 'All' && <span className="fp-chip">Industry: {filters.industry} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('industry', 'All')} /></span>}
                    {filters.service !== 'All' && <span className="fp-chip">Category: {filters.service} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('service', 'All')} /></span>}
                    {filters.location !== 'All' && <span className="fp-chip"><MapPin size={10} /> {filters.location} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('location', 'All')} /></span>}
                    {filters.designation !== 'All' && <span className="fp-chip"><Briefcase size={10} /> {filters.designation} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('designation', 'All')} /></span>}
                    {filters.tags !== 'All' && <span className="fp-chip"><Tag size={10} /> {filters.tags} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('tags', 'All')} /></span>}
                    {filters.dateFrom && <span className="fp-chip">From: {filters.dateFrom} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('dateFrom', '')} /></span>}
                    {filters.dateTo && <span className="fp-chip">To: {filters.dateTo} <X size={10} style={{cursor:'pointer'}} onClick={() => setFilter('dateTo', '')} /></span>}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* end leads-header-card */}

      {/* Leads Table */}
      <div className="leads-list glass-card" ref={menuRef}>
         <table className="leads-grid-table">
            <thead>
              <tr>
                <th>Company &amp; Person</th>
                <th>Contact Info</th>
                <th>City</th>
                <th>Category</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Added On</th>
                <th style={{width:'48px'}}></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No leads found. Try adjusting your filters or add new leads.</td></tr>
              )}
              {filteredLeads.map((lead) => {
                const tags = (lead.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
                const avatarLetter = (lead.company || lead.name || '?').charAt(0).toUpperCase();
                return (
                <tr key={lead.id}>

                  {/* Col 1: Company & Person */}
                  <td>
                    <div className="contact-cell">
                      <div className="contact-avatar" style={{ background: lead.lead_type === 'WhatsApp' ? 'rgba(37,211,102,0.1)' : lead.lead_type === 'Email' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: lead.lead_type === 'WhatsApp' ? '#25d366' : lead.lead_type === 'Email' ? '#f59e0b' : '#3b82f6' }}>
                        {avatarLetter}
                      </div>
                      <div className="contact-info">
                        <span
                          className="lead-company-link"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          {lead.company || '—'}
                        </span>
                        <span
                          className="lead-person-link"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          {lead.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Col 2: Contact Info — Phone + Email */}
                  <td>
                    <div className="contact-info-cell">
                      <span className="ci-row">
                        <Phone size={11} color="#3b82f6" />
                        <span>{lead.phone || '—'}</span>
                      </span>
                      <span className="ci-row">
                        <Mail size={11} color="#f59e0b" />
                        <span>{lead.email || '—'}</span>
                      </span>
                    </div>
                  </td>

                  {/* Col 3: City */}
                  <td>
                    {lead.city ? (
                      <span className="city-cell">
                        <MapPin size={12} color="#94a3b8" />
                        {lead.city}
                      </span>
                    ) : <span style={{color:'#475569'}}>—</span>}
                  </td>

                  {/* Col 4: Category / Service */}
                  <td>
                    {lead.service ? (
                      <span className="category-badge">{lead.service}</span>
                    ) : (
                      <span style={{color:'#475569', fontSize:'0.82rem'}}>{lead.source || '—'}</span>
                    )}
                  </td>

                  {/* Col 5: Tags */}
                  <td>
                    <div className="tags-cell">
                      {tags.length > 0
                        ? tags.slice(0,3).map((t: string) => <span key={t} className="tag-pill">{t}</span>)
                        : <span style={{color:'#475569'}}>—</span>
                      }
                      {tags.length > 3 && <span className="tag-pill more">+{tags.length - 3}</span>}
                    </div>
                  </td>

                  {/* Col 6: Status */}
                  <td>
                    <span className={`status-tag ${lead.status?.toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </td>

                  {/* Col 7: Date */}
                  <td style={{fontSize:'0.82rem', color:'#64748b', whiteSpace:'nowrap'}}>
                    {new Date(lead.created_at).toLocaleDateString('en-IN')}
                  </td>

                  {/* Col 8: 3-dot action menu */}
                  <td className="actions" style={{position:'relative'}}>
                    <button
                      className="icon-btn dot-menu-btn"
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === lead.id ? null : lead.id); }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === lead.id && (
                      <div className="dot-menu-dropdown">
                        <button onClick={() => { navigate(`/leads/${lead.id}`); setOpenMenuId(null); }}>
                          <Eye size={14} /> View
                        </button>
                        <button onClick={() => { handleEdit(lead); setOpenMenuId(null); }}>
                          <Edit size={14} /> Edit
                        </button>
                        <button className="delete" onClick={() => { handleDelete(lead.id); setOpenMenuId(null); }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              )})}
            </tbody>
         </table>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="modal-content glass-card"
               onClick={(e) => e.stopPropagation()}
            >
               <div className="modal-header">
                  <h3>{editingId ? 'Edit Lead' : 'Add New Lead'}</h3>
                  <X className="close-btn" onClick={() => setIsModalOpen(false)} />
               </div>
               <div className="modal-scroll-body">
                  <div className="form-group">
                     <label>Lead Channel *</label>
                     <div className="lead-type-selector">
                       {(['Calling', 'Email', 'WhatsApp'] as string[]).map(type => (
                         <button type="button" key={type} className={`type-btn ${newLead.lead_type === type ? 'active' : ''}`}
                           style={{ '--type-color': type === 'Calling' ? '#10b981' : type === 'Email' ? '#f59e0b' : '#25d366' } as any}
                           onClick={() => setNewLead({...newLead, lead_type: type})}
                         >
                           {type === 'Calling' && <Phone size={14} />}
                           {type === 'Email' && <Mail size={14} />}
                           {type === 'WhatsApp' && <MessageCircle size={14} />}
                           {type}
                         </button>
                       ))}
                     </div>
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>First Name *</label>
                        <input type="text" value={newLead.first_name} onChange={e => setNewLead({...newLead, first_name: e.target.value})} placeholder="Rajesh" />
                     </div>
                     <div className="form-group">
                        <label>Last Name</label>
                        <input type="text" value={newLead.last_name} onChange={e => setNewLead({...newLead, last_name: e.target.value})} placeholder="Kumar" />
                     </div>
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} placeholder="rajesh@company.com" />
                     </div>
                     <div className="form-group">
                        <label>Phone Number</label>
                        <input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} placeholder="+91 98765 43210" />
                     </div>
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>Lead Source</label>
                        <select value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                           <option>Website</option>
                           <option>LinkedIn</option>
                           <option>Referral</option>
                           <option>Direct Mail</option>
                           <option>Social Media</option>
                           <option>Google Ads</option>
                           <option>File Upload</option>
                           <option>Other</option>
                        </select>
                     </div>
                     <div className="form-group">
                        <label>Status</label>
                        <select value={newLead.status} onChange={e => setNewLead({...newLead, status: e.target.value})}>
                           <option>New</option>
                           <option>Contacted</option>
                           <option>Qualified</option>
                           <option>Lost</option>
                        </select>
                     </div>
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>Company</label>
                        <input type="text" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} placeholder="TechCorp India" />
                     </div>
                     <div className="form-group">
                        <label>Job Title</label>
                        <input type="text" value={newLead.job_title} onChange={e => setNewLead({...newLead, job_title: e.target.value})} placeholder="CTO" />
                     </div>
                  </div>
                  <div className="form-group">
                     <label>Website</label>
                     <input type="text" value={newLead.website} onChange={e => setNewLead({...newLead, website: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>Industry</label>
                        <select value={newLead.industry} onChange={e => setNewLead({...newLead, industry: e.target.value})}>
                           <option value="">Select Industry</option>
                           <option>Technology</option>
                           <option>Healthcare</option>
                           <option>Finance</option>
                           <option>Real Estate</option>
                           <option>Education</option>
                           <option>Manufacturing</option>
                           <option>Retail</option>
                           <option>Other</option>
                        </select>
                     </div>
                     <div className="form-group">
                        <label>Service Category</label>
                        <select value={newLead.service} onChange={e => setNewLead({...newLead, service: e.target.value})}>
                           <option value="">Select Service</option>
                           <option>Software</option>
                           <option>Consulting</option>
                           <option>Support</option>
                           <option>Training</option>
                           <option>Other</option>
                        </select>
                     </div>
                  </div>
                  <div className="form-group">
                     <label>Full Address</label>
                     <input type="text" value={newLead.address} onChange={e => setNewLead({...newLead, address: e.target.value})} placeholder="123 Business Street, Office Block B..." />
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>City</label>
                        <input type="text" value={newLead.city} onChange={e => setNewLead({...newLead, city: e.target.value})} placeholder="Bangalore" />
                     </div>
                     <div className="form-group">
                        <label>Pincode</label>
                        <input type="text" value={newLead.pincode} onChange={e => setNewLead({...newLead, pincode: e.target.value})} placeholder="560001" />
                     </div>
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>State</label>
                        <input type="text" value={newLead.state} onChange={e => setNewLead({...newLead, state: e.target.value})} placeholder="Karnataka" />
                     </div>
                     <div className="form-group">
                        <label>Country</label>
                        <input type="text" value={newLead.country} onChange={e => setNewLead({...newLead, country: e.target.value})} placeholder="India" />
                     </div>
                  </div>
                  <div className="form-group">
                     <label>Tags (Comma separated)</label>
                     <input type="text" value={newLead.tags} onChange={e => setNewLead({...newLead, tags: e.target.value})} placeholder="e.g. VIP, Urgent, Requires Callback" />
                  </div>
                  <div className="form-group">
                     <label>Internal Notes</label>
                     <textarea rows={3} value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} placeholder="Add initial discussion points or background here..."></textarea>
                  </div>
               </div>
               <div className="modal-footer">
                  <button type="button" className="btn-primary full-width" onClick={handleSave}>
                     {editingId ? 'Update Lead' : 'Save Lead'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload CSV Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="modal-overlay" onClick={() => setIsUploadOpen(false)}>
            <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="modal-content glass-card"
               onClick={(e) => e.stopPropagation()}
            >
               <div className="modal-header">
                  <h3>Upload Leads from CSV</h3>
                  <X className="close-btn" onClick={() => setIsUploadOpen(false)} />
               </div>
               <div className="upload-section">
                  <div className="form-group">
                     <label>Assign to Channel *</label>
                     <div className="lead-type-selector">
                       {(['Calling', 'Email', 'WhatsApp'] as string[]).map(type => (
                         <button type="button" key={type} className={`type-btn ${uploadLeadType === type ? 'active' : ''}`}
                           style={{ '--type-color': type === 'Calling' ? '#10b981' : type === 'Email' ? '#f59e0b' : '#25d366' } as any}
                           onClick={() => setUploadLeadType(type)}
                         >
                           {type === 'Calling' && <Phone size={14} />}
                           {type === 'Email' && <Mail size={14} />}
                           {type === 'WhatsApp' && <MessageCircle size={14} />}
                           {type}
                         </button>
                       ))}
                     </div>
                  </div>
                  <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
                     <Upload size={36} color="#3b82f6" />
                     <p className="drop-title">Click to upload CSV file</p>
                     <p className="drop-desc">Supports .csv files with columns: Name, Email, Phone, Source</p>
                     <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileUpload} />
                  </div>
                  <div className="csv-example">
                    <h4>CSV Format Example:</h4>
                    <code>Name,Email,Phone,Source<br/>Rajesh Kumar,rajesh@mail.com,+91 98765 43210,Website<br/>Priya Sharma,priya@mail.com,+91 99887 12345,Referral</code>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .leads-page { display: flex; flex-direction: column; gap: 4px; }

        /* Single unified header card — rounded top only */
        .leads-header-card {
          border-radius: 12px 12px 0 0;
          overflow: hidden;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        /* Top bar row — no longer its own card */
        .unified-top-bar {
           display: flex;
           align-items: center;
           padding: 8px 16px;
           gap: 12px;
           flex-wrap: nowrap;
        }
        .utb-left {
           display: flex;
           align-items: center;
           gap: 12px;
           flex-shrink: 0;
        }
        .utb-left h1 { font-size: 1.15rem; font-weight: 700; white-space: nowrap; margin: 0; }
        .utb-right {
           display: flex;
           align-items: center;
           gap: 8px;
           flex: 1;  /* takes all remaining space */
        }

        .v-divider {
           width: 1px;
           height: 24px;
           background: rgba(255,255,255,0.1);
        }

        /* Compact Channel Tabs */
        .channel-tabs {
           display: flex;
           gap: 6px;
        }
        .channel-tab {
           display: flex;
           align-items: center;
           gap: 6px;
           padding: 0 12px;
           height: 36px;
           background: rgba(255,255,255,0.03);
           border: 1px solid var(--border-color);
           border-radius: 8px;
           cursor: pointer;
           transition: all 0.25s;
           color: var(--text-secondary);
           font-size: 0.8rem;
           white-space: nowrap;
        }
        .channel-tab:hover { border-color: var(--tab-color); color: var(--text-primary); }
        .channel-tab.active {
           border-color: var(--tab-color);
           background: color-mix(in srgb, var(--tab-color) 10%, transparent);
           color: var(--tab-color);
           box-shadow: 0 0 10px color-mix(in srgb, var(--tab-color) 12%, transparent);
        }
        .tab-label { font-weight: 500; }
        .tab-count {
           background: rgba(255,255,255,0.08);
           padding: 1px 6px;
           border-radius: 4px;
           font-size: 0.7rem;
           font-weight: 700;
        }
        .channel-tab.active .tab-count {
           background: color-mix(in srgb, var(--tab-color) 20%, transparent);
        }

        /* Search & Actions */
        .search-box {
           display: flex;
           align-items: center;
           gap: 8px;
           background: rgba(0, 0, 0, 0.2);
           padding: 0 14px;
           border-radius: 8px;
           flex: 1;          /* fills all available space */
           min-width: 180px;
           height: 36px;
           box-sizing: border-box;
           border: 1px solid var(--border-color);
           transition: border-color 0.25s;
        }
        .search-box:focus-within { border-color: #3b82f6; }
        .search-box input {
           background: transparent;
           border: none;
           color: white;
           font-size: 0.85rem;
           width: 100%;
           outline: none;
           padding: 0;
           height: 100%;
        }

        .filter-toggle.active {
           background: rgba(59,130,246,0.1);
           border-color: #3b82f6;
        }

        .compact-btn {
           height: 36px;
           padding: 0 14px;
           font-size: 0.85rem;
           border-radius: 8px;
           display: flex;
           align-items: center;
           justify-content: center;
        }

        /* ── Filter Toggle Button ── */
        .filter-toggle-btn {
          display: flex; align-items: center; gap: 7px;
          height: 36px; padding: 0 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: 8px; cursor: pointer;
          color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;
          transition: all 0.25s;
        }
        .filter-toggle-btn:hover { border-color: #3b82f6; color: white; background: rgba(59,130,246,0.08); }
        .filter-toggle-btn.active { background: rgba(59,130,246,0.12); border-color: #3b82f6; color: #3b82f6; }
        .filter-badge {
          background: #3b82f6; color: white; font-size: 0.62rem; font-weight: 700;
          padding: 2px 6px; border-radius: 10px; line-height: 1.2;
        }

        /* Clear All Button */
        .clear-all-btn {
          display: flex; align-items: center; gap: 5px;
          height: 36px; padding: 0 12px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px; cursor: pointer;
          color: #f87171; font-size: 0.82rem; font-weight: 600;
          transition: all 0.2s; white-space: nowrap;
          font-family: inherit;
        }
        .clear-all-btn:hover { background: rgba(239,68,68,0.18); border-color: #ef4444; color: #ef4444; }
        /* ── Filter Panel ── */
        .filter-panel { padding: 0 20px 14px; display: flex; flex-direction: column; gap: 10px; }
        .fp-top-divider { height: 1px; background: rgba(255,255,255,0.07); margin-bottom: 4px; }
        .fp-header { display: flex; justify-content: space-between; align-items: center; }
        .fp-title { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .fp-clear { display: flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171; padding: 5px 10px; border-radius: 7px; cursor: pointer; font-size: 0.78rem; font-weight: 600; transition: all 0.2s; }
        .fp-clear:hover { background: rgba(239,68,68,0.18); }
        .fp-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          gap: 8px;
          align-items: flex-end;
          width: 100%;
        }
        .fp-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
        .fp-group label { display: flex; align-items: center; gap: 3px; font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #64748b; white-space: nowrap; overflow: hidden; }
        .fp-group input, .fp-group select { width: 100%; padding: 6px 8px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; color: white; font-size: 0.78rem; outline: none; font-family: inherit; transition: border-color 0.2s; -webkit-appearance: none; appearance: none; }
        .fp-group input:focus, .fp-group select:focus { border-color: #3b82f6; }
        .fp-select-wrap { position: relative; }
        .fp-select-wrap select { padding-right: 26px; cursor: pointer; }
        .fp-chevron { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #475569; pointer-events: none; }
        .fp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .fp-chip { display: inline-flex; align-items: center; gap: 5px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #60a5fa; padding: 3px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
        .fp-chip svg { cursor: pointer; opacity: 0.7; }
        .fp-chip svg:hover { opacity: 1; }

        /* Table */
        .leads-list {
          border-radius: 12px !important;
        }
        .leads-grid-table { width: 100%; border-collapse: collapse; }
        .leads-grid-table th {
           text-align: left;
           padding: 12px 20px;
           background: rgba(255, 255, 255, 0.02);
           color: var(--text-secondary);
           font-weight: 500;
           font-size: 0.75rem;
           text-transform: uppercase;
           letter-spacing: 0.5px;
        }
        .leads-list tr:hover { background: rgba(255, 255, 255, 0.02); }
        .leads-grid-table td { padding: 12px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }

        .contact-cell { display: flex; align-items: center; gap: 12px; }
        .contact-avatar {
           width: 36px; height: 36px;
           border-radius: 9px;
           display: flex; align-items: center; justify-content: center;
           font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
        }
        .contact-info { display: flex; flex-direction: column; gap: 2px; }
        .lead-company-link {
           font-weight: 700; font-size: 0.88rem; color: #e2e8f0;
           cursor: pointer; transition: color 0.2s;
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
        }
        .lead-company-link:hover { color: #3b82f6; text-decoration: underline; }
        .lead-person-link {
           font-size: 0.75rem; color: #64748b;
           cursor: pointer; transition: color 0.2s;
           white-space: nowrap;
        }
        .lead-person-link:hover { color: #94a3b8; }

        /* Contact Info cell */
        .contact-info-cell { display: flex; flex-direction: column; gap: 4px; }
        .ci-row { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #94a3b8; white-space: nowrap; }

        /* City cell */
        .city-cell { display: inline-flex; align-items: center; gap: 5px; font-size: 0.82rem; color: #94a3b8; }

        /* Category badge */
        .category-badge {
           display: inline-block; padding: 3px 10px; border-radius: 6px;
           font-size: 0.75rem; font-weight: 600;
           background: rgba(139,92,246,0.1); color: #a78bfa;
           border: 1px solid rgba(139,92,246,0.2);
        }

        /* Tags */
        .tags-cell { display: flex; flex-wrap: wrap; gap: 4px; }
        .tag-pill {
           display: inline-flex; align-items: center;
           padding: 2px 8px; border-radius: 5px;
           font-size: 0.7rem; font-weight: 600;
           background: rgba(16,185,129,0.1); color: #34d399;
           border: 1px solid rgba(16,185,129,0.2); white-space: nowrap;
        }
        .tag-pill.more { background: rgba(255,255,255,0.05); color: #64748b; border-color: rgba(255,255,255,0.08); }

        /* Channel Badge */
        .channel-badge {
           display: inline-flex; align-items: center; gap: 6px;
           padding: 4px 10px; border-radius: 6px;
           font-size: 0.75rem; font-weight: 600;
        }
        .channel-badge.calling { color: #10b981; background: rgba(16,185,129,0.1); }
        .channel-badge.email { color: #f59e0b; background: rgba(245,158,11,0.1); }
        .channel-badge.whatsapp { color: #25d366; background: rgba(37,211,102,0.1); }

        .status-tag {
           padding: 4px 10px; border-radius: 6px;
           font-size: 0.75rem; font-weight: 600;
           background: rgba(255, 255, 255, 0.05);
        }
        .status-tag.new { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .status-tag.contacted { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }
        .status-tag.qualified { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .status-tag.lost { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
        .icon-btn {
           background: transparent;
           border: 1px solid transparent;
           color: var(--text-secondary);
           height: 32px;
           width: 32px;
           display: flex;
           align-items: center;
           justify-content: center;
           border-radius: 6px;
           cursor: pointer; transition: all 0.2s;
        }
        .icon-btn:hover { color: white; background: rgba(255,255,255,0.06); border-color: var(--border-color); }
        .icon-btn.delete:hover { color: #ef4444; background: rgba(239,68,68,0.06); }

        /* 3-dot menu */
        .dot-menu-btn { border-radius: 6px; }
        .dot-menu-dropdown {
          position: absolute; right: 48px; top: 50%; transform: translateY(-50%);
          background: #1e2535; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 200; min-width: 130px;
        }
        .dot-menu-dropdown button {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 10px 14px;
          background: transparent; border: none;
          color: #cbd5e1; font-size: 0.83rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
          font-family: inherit;
        }
        .dot-menu-dropdown button:hover { background: rgba(255,255,255,0.06); color: white; }
        .dot-menu-dropdown button.delete { color: #f87171; }
        .dot-menu-dropdown button.delete:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
        .dot-menu-dropdown button + button { border-top: 1px solid rgba(255,255,255,0.05); }

        /* Lead Type Selector */
        .lead-type-selector {
           display: flex; gap: 10px;
        }
        .type-btn {
           flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
           padding: 10px; border-radius: 10px; cursor: pointer;
           background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);
           color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;
           transition: all 0.3s;
        }
        .type-btn.active {
           border-color: var(--type-color);
           background: color-mix(in srgb, var(--type-color) 12%, transparent);
           color: var(--type-color);
           box-shadow: 0 0 12px color-mix(in srgb, var(--type-color) 20%, transparent);
        }
        .type-btn:hover { border-color: var(--type-color); color: var(--type-color); }

        /* Upload Section */
        .upload-section { display: flex; flex-direction: column; gap: 20px; }
        .dropzone {
           border: 2px dashed var(--border-color);
           border-radius: 16px; padding: 40px;
           text-align: center; cursor: pointer;
           transition: all 0.3s;
           display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .dropzone:hover { border-color: #3b82f6; background: rgba(59,130,246,0.05); }
        .drop-title { font-weight: 600; font-size: 1rem; }
        .drop-desc { color: var(--text-secondary); font-size: 0.85rem; }
        .csv-example {
           background: rgba(0,0,0,0.3); padding: 16px 20px; border-radius: 12px;
           border: 1px solid var(--border-color);
        }
        .csv-example h4 { font-size: 0.85rem; margin-bottom: 8px; color: var(--text-secondary); }
        .csv-example code { font-family: monospace; color: #10b981; font-size: 0.8rem; line-height: 1.6; }

        /* Modal Styles */
        .modal-overlay {
           position: fixed; top: 0; left: 0; right: 0; bottom: 0;
           background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px);
           z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content { 
           width: 100%; max-width: 600px; background: #11141a !important; 
           max-height: 90vh; overflow: hidden;
           display: flex; flex-direction: column;
        }
        .modal-header { display: flex; justify-content: space-between; padding: 32px 32px 16px 32px; flex-shrink: 0; }
        .modal-scroll-body { 
           flex: 1; overflow-y: auto; padding: 8px 32px; min-height: 0;
        }
        .modal-footer {
           flex-shrink: 0; padding: 16px 32px 32px 32px;
           background: #11141a; border-top: 1px solid rgba(255,255,255,0.05);
           position: relative; z-index: 10;
        }
        .close-btn { cursor: pointer; color: var(--text-secondary); }
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        label { font-size: 0.85rem; color: var(--text-secondary); }
        input, select, textarea {
           padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color);
           border-radius: 10px; color: white; outline: none; font-family: inherit; resize: vertical;
        }
        input:focus, select:focus, textarea:focus { border-color: var(--primary-color); }
        .full-width { width: 100%; margin-top: 12px; }

        @media (max-width: 1400px) {
          .search-box { width: 180px; }
          .search-box:focus-within { width: 220px; }
          .channel-tab span.tab-label { display: none; }
        }
        @media (max-width: 900px) {
          .unified-top-bar { flex-direction: column; align-items: stretch; flex-wrap: wrap; }
          .utb-right { justify-content: space-between; flex-wrap: wrap; }
          .search-box { flex: 1; width: auto; }
          .v-divider { display: none; }
          .channel-tab span.tab-label { display: inline; }
        }
        @media (max-width: 768px) {
          .channel-tabs { flex-wrap: auto; overflow-x: auto; }
          .expanded-filters { flex-direction: column; align-items: stretch; }
          .form-row { grid-template-columns: 1fr; }
          .fp-row { flex-wrap: wrap; }
          .fp-group { min-width: 120px; }
          .leads-list { overflow-x: auto; }
        }
        /* Upload Modal Styles */
        .upload-section {
           padding: 24px;
           display: flex;
           flex-direction: column;
           gap: 20px;
        }
        .dropzone {
           border: 2px dashed rgba(59, 130, 246, 0.3);
           border-radius: 12px;
           padding: 40px 20px;
           text-align: center;
           background: rgba(59, 130, 246, 0.04);
           cursor: pointer;
           transition: all 0.2s;
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 12px;
        }
        .dropzone:hover {
           border-color: #3b82f6;
           background: rgba(59, 130, 246, 0.08);
           transform: translateY(-2px);
        }
        .drop-title {
           font-size: 1.05rem;
           font-weight: 600;
           color: #e2e8f0;
           margin: 0;
        }
        .drop-desc {
           font-size: 0.85rem;
           color: #94a3b8;
           margin: 0;
        }
        .csv-example {
           background: rgba(0, 0, 0, 0.2);
           padding: 16px;
           border-radius: 8px;
           border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .csv-example h4 {
           margin: 0 0 10px 0;
           font-size: 0.85rem;
           color: #cbd5e1;
           font-weight: 600;
        }
        .csv-example code {
           display: block;
           font-family: "Fira Code", monospace;
           font-size: 0.8rem;
           color: #34d399;
           white-space: pre-wrap;
           word-break: break-all;
           line-height: 1.6;
           padding: 10px;
           background: rgba(0, 0, 0, 0.2);
           border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default LeadsPage;
