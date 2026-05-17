import { useEffect, useState } from 'react';
import { 
  Plus, 
  IndianRupee, 
  Calendar,
  Trash2,
  X,
  Eye,
  UserCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Edit2,
  FileText,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const PipelinePage = ({ authUser }: { authUser?: any }) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<{ title: string; value: number; stage: string; expected_close: string; lead_id: number | null }>({ title: '', value: 0, stage: 'Discovery', expected_close: '', lead_id: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Match these EXACTLY with the Lead Details Deal Form
  const stages = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  useEffect(() => {
    fetchDeals();
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const resp = await fetch(`/api/leads`);
      const data = await resp.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeals = async () => {
    try {
      const resp = await fetch(`/api/deals`);
      const data = await resp.json();
      setDeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newDeal.title.trim()) { alert("Please enter a deal title."); return; }
    if (!newDeal.lead_id) { alert("Please select an associated Contact / Company for this deal."); return; }
    try {
      let response;
      if (editingId) {
        response = await fetch(`/api/deals/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDeal)
        });
      } else {
        response = await fetch(`/api/deals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDeal)
        });
      }
      
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || 'Failed to save deal');

      setIsModalOpen(false);
      fetchDeals();
      setNewDeal({ title: '', value: 0, stage: 'Discovery', expected_close: '', lead_id: null });
      setEditingId(null);
    } catch (err: any) { alert("Error saving deal: " + err.message); }
  };

  const handleEdit = (deal: any) => {
    setNewDeal({ title: deal.title, value: deal.value || 0, stage: deal.stage || 'Discovery', expected_close: deal.expected_close || '', lead_id: deal.lead_id || null });
    setEditingId(deal.id);
    setIsModalOpen(true);
    
    // Set initial search term if lead_id exists
    if (deal.lead_id) {
       const matchedLead = leads.find(l => l.id === deal.lead_id);
       if (matchedLead) setLeadSearchTerm(`${matchedLead.name} ${matchedLead.company ? `- ${matchedLead.company}` : ''}`);
    } else {
       setLeadSearchTerm('');
    }
  };

  const filteredLeads = leads.filter(l => {
     const term = leadSearchTerm.toLowerCase();
     return (
       (l.name && l.name.toLowerCase().includes(term)) ||
       (l.company && l.company.toLowerCase().includes(term)) ||
       (l.email && l.email.toLowerCase().includes(term)) ||
       (l.phone && l.phone.toLowerCase().includes(term)) ||
       (l.website && l.website.toLowerCase().includes(term)) ||
       (l.city && l.city.toLowerCase().includes(term)) ||
       (l.state && l.state.toLowerCase().includes(term)) ||
       (l.job_title && l.job_title.toLowerCase().includes(term))
     );
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete deal?")) return;
    try {
      await fetch(`/api/deals/${id}`, { method: 'DELETE' });
      fetchDeals();
    } catch (err) { alert("Error deleting deal"); }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const stage = destination.droppableId;
    const dealId = parseInt(draggableId, 10);
    const deal = deals.find(d => d.id === dealId);
    
    if (deal && deal.stage !== stage) {
       const currentIndex = stages.indexOf(deal.stage);
       const targetIndex = stages.indexOf(stage);
       if (targetIndex > currentIndex + 1) {
          alert("You cannot skip stages! A deal must progress step-by-step.");
          return;
       }
       // Optimistic UI update
       setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage } : d));
       try {
          await fetch(`/api/deals/${dealId}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ stage })
          });
          fetchDeals(); // Re-sync to get correct history/timestamps
       } catch(err) { fetchDeals(); }
    }
  };

  if (loading) return <div className="loading-state">Syncing Your Pipeline...</div>;

  return (
    <div className="pipeline-page">
      <header className="page-header">
         <div className="header-left">
           <h1>Sales Pipeline</h1>
           <p>Visualize and optimize your deal workflow.</p>
         </div>
         <button className="btn-primary" onClick={() => {
            setNewDeal({ title: '', value: 0, stage: 'Discovery', expected_close: '', lead_id: null });
            setEditingId(null);
            setLeadSearchTerm('');
            setIsModalOpen(true);
         }}>
            <Plus size={18} />
            <span>Create New Opportunity</span>
         </button>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="pipeline-kanban">
           {stages.map((stage) => (
             <div key={stage} className="pipeline-column">
                <div className="column-header">
                   <div className="title-group">
                     <h3>{stage}</h3>
                     <span className="deal-count">{deals.filter((d: any) => d.stage === stage).length}</span>
                   </div>
                   <div className="column-revenue">
                      {deals.filter((d: any) => d.stage === stage).reduce((acc: number, curr: any) => acc + (curr.value || 0), 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                   </div>
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div 
                      className={`deal-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ minHeight: '150px' }}
                    >
                       {deals.filter((d: any) => d.stage === stage).map((deal: any, index: number) => (
                         <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
                           {(provided, snapshot) => (
                             <div 
                               className={`deal-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                               ref={provided.innerRef}
                               {...provided.draggableProps}
                               {...provided.dragHandleProps}
                               onClick={() => navigate(`/deals/${deal.id}`)}
                               style={{ ...provided.draggableProps.style }}
                             >
                                <div className="card-header">
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                                     <span className="deal-title">{deal.title}</span>
                                     {deal.quote_status === 'Accepted' && (
                                       <span className="quote-accepted-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, animation: 'pulse-slow 2s infinite' }}>
                                          <CheckCircle size={10} /> Quote Checked
                                       </span>
                                     )}
                                   </div>
                                   <div style={{ position: 'relative', zIndex: 10 }}>
                                      <button 
                                         className="icon-btn" 
                                         onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === deal.id ? null : deal.id); }}
                                         onBlur={() => setTimeout(() => setActiveMenuId(null), 150)}
                                      >
                                         <MoreVertical size={16} color="#94a3b8" />
                                      </button>
                                      {activeMenuId === deal.id && (
                                         <div className="card-actions-menu">
                                            <div className="cam-item" onMouseDown={(e) => { e.preventDefault(); navigate(`/deals/${deal.id}`); }}>
                                               <Eye size={12} color="#3b82f6" /> View Deal
                                            </div>
                                            <div className="cam-item" onMouseDown={(e) => { e.preventDefault(); setActiveMenuId(null); handleEdit(deal); }}>
                                               <Edit2 size={12} color="#10b981" /> Edit Deal
                                            </div>
                                             <div className="cam-item" onMouseDown={(e) => { e.preventDefault(); navigate(`/deals/${deal.id}/quote`); }}>
                                                <FileText size={12} color="#f59e0b" /> Generate Proposal
                                             </div>
                                             <div className="cam-item" onMouseDown={(e) => { e.preventDefault(); setActiveMenuId(null); handleDelete(deal.id); }}>
                                                <Trash2 size={12} color="#ef4444" /> Delete
                                             </div>
                                         </div>
                                      )}
                                   </div>
                                </div>
                                <div className="card-body">
                                   <div className="deal-value">
                                      <IndianRupee size={12} />
                                      <span>{deal.value?.toLocaleString('en-IN')}</span>
                                   </div>
                                   <div className="deal-dates-row">
                                     <div className="deal-date" title="Created Date">
                                        <Clock size={11} />
                                        <span>{new Date(deal.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                     </div>
                                     {deal.expected_close && (
                                       <div className="deal-date expected" title="Expected Close">
                                          <Calendar size={11} />
                                          <span>{new Date(deal.expected_close).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                       </div>
                                     )}
                                   </div>
                                </div>
                      <div className="card-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                           <div className="contact-name-bottom">
                              <UserCircle size={12} /> {deal.lead_name || 'No Contact Assigned'}
                           </div>
                           <div className="priority-dot high"></div>
                         </div>
                         {deal.lead_company && (
                           <div className="contact-name-bottom" style={{ color: '#94a3b8' }}>
                              <Building2 size={11} /> {deal.lead_company}
                           </div>
                         )}
                      </div>
                   </div>
                 )}
               </Draggable>
             ))}
             {provided.placeholder}
             <button className="add-deal-inline" onClick={() => {
                 setNewDeal({ title: '', value: 0, stage, expected_close: '', lead_id: null });
                 setEditingId(null);
                 setLeadSearchTerm('');
                 setIsModalOpen(true);
             }}>
                <Plus size={14} /> Add Deal
             </button>
          </div>
        )}
      </Droppable>
   </div>
 ))}
</div>
</DragDropContext>

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="modal-content glass-card"
            >
               <div className="modal-header">
                  <h3>{editingId ? 'Edit Deal' : 'New Opportunity'}</h3>
                  <X className="close-btn" onClick={() => setIsModalOpen(false)} />
               </div>
               <div className="modal-scroll-body">
                   <div className="form-group">
                     <label>Deal Title *</label>
                     <input type="text" value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})} placeholder="e.g. Enterprise License" />
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                     <label>Associated Contact / Company *</label>
                     <input
                       type="text"
                       placeholder="Search by name, email, company, domain..."
                       value={leadSearchTerm}
                       onChange={(e) => {
                         setLeadSearchTerm(e.target.value);
                         setIsLeadDropdownOpen(true);
                         if (e.target.value === '') setNewDeal({...newDeal, lead_id: null });
                       }}
                       onFocus={() => setIsLeadDropdownOpen(true)}
                       onBlur={() => setTimeout(() => setIsLeadDropdownOpen(false), 200)}
                     />
                     {isLeadDropdownOpen && (
                       <div className="custom-dropdown">
                         {filteredLeads.map(lead => (
                             <div 
                               key={lead.id} 
                               className="dropdown-item"
                               onMouseDown={(e) => {
                                 e.preventDefault(); // Prevents input from losing focus prematurely
                                 setNewDeal({...newDeal, lead_id: lead.id});
                                 setLeadSearchTerm(`${lead.name} ${lead.company ? `- ${lead.company}` : ''}`);
                                 setIsLeadDropdownOpen(false);
                               }}
                             >
                             <div className="di-name">{lead.name} {lead.job_title && <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#94a3b8' }}>({lead.job_title})</span>}</div>
                             <div className="di-sub">
                               {lead.company && <span><Building2 size={10}/> {lead.company}</span>}
                               {lead.email && <span><Mail size={10}/> {lead.email}</span>}
                               {lead.phone && <span><Phone size={10}/> {lead.phone}</span>}
                               {(lead.city || lead.state) && <span><MapPin size={10}/> {[lead.city, lead.state].filter(Boolean).join(', ')}</span>}
                             </div>
                           </div>
                         ))}
                         {filteredLeads.length === 0 && (
                           <div className="dropdown-empty">No matching contacts found. Please type a valid name or email.</div>
                         )}
                       </div>
                     )}
                  </div>
                  <div className="form-row">
                     <div className="form-group">
                        <label>Expected Value (₹)</label>
                        <input type="number" value={newDeal.value === 0 ? '' : newDeal.value} onChange={e => setNewDeal({...newDeal, value: Number(e.target.value)})} placeholder="100000" />
                     </div>
                     <div className="form-group">
                        <label>Stage</label>
                        <select value={newDeal.stage} onChange={e => setNewDeal({...newDeal, stage: e.target.value})}>
                           {stages.map((s, index) => {
                              if (!editingId) {
                                  // New deals must go layer by layer. Lock dropdown to 1st stage.
                                  return <option key={s} value={s} disabled={index > 0}>{s}</option>;
                              }
                              // When editing, allow jumping backwards or EXACTLY 1 step forward.
                              const originalStage = deals.find(d => d.id === editingId)?.stage || 'Discovery';
                              const currentIndex = stages.indexOf(originalStage);
                              return <option key={s} value={s} disabled={index > currentIndex + 1}>{s}</option>;
                           })}
                        </select>
                     </div>
                  </div>
                  <div className="form-group">
                     <label>Expected Close Date</label>
                     <input type="date" value={newDeal.expected_close ? newDeal.expected_close.split('T')[0] : ''} onChange={e => setNewDeal({...newDeal, expected_close: e.target.value})} />
                  </div>
               </div>
               <div className="modal-footer">
                  <button type="button" className="btn-primary full-width" onClick={handleSave}>
                     {editingId ? 'Update Deal' : 'Save Deal'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .pipeline-page { display: flex; flex-direction: column; gap: 32px; height: 100%; min-width: 0; width: 100%; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; }

        .pipeline-kanban {
           display: flex;
           gap: 24px;
           overflow-x: auto;
           overflow-y: hidden;
           padding-bottom: 20px;
           flex: 1;
           min-width: 0;
           width: 100%;
        }

        .pipeline-column {
           min-width: 280px;
           flex: 1;
           display: flex;
           flex-direction: column;
           gap: 10px;
           background: rgba(255, 255, 255, 0.015);
           border-radius: 6px;
           padding: 10px;
           border-top: 3px solid #3b82f6;
        }
        .pipeline-column:nth-child(1) { border-top-color: #94a3b8; }
        .pipeline-column:nth-child(2) { border-top-color: #3b82f6; }
        .pipeline-column:nth-child(3) { border-top-color: #f59e0b; }
        .pipeline-column:nth-child(4) { border-top-color: #10b981; }

        .column-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding-bottom: 8px;
           border-bottom: 1px solid rgba(255,255,255,0.05);
           margin-bottom: 4px;
        }

        .title-group { display: flex; align-items: center; gap: 8px; }
        .title-group h3 { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #cbd5e1; letter-spacing: 0.5px; margin: 0; }
        .deal-count { 
           background: rgba(255, 255, 255, 0.08); 
           padding: 2px 6px; 
           border-radius: 4px; 
           font-size: 0.7rem; 
           color: #94a3b8;
           font-weight: 600;
        }

        .column-revenue { font-size: 0.75rem; font-weight: 600; color: #cbd5e1; opacity: 0.8; }

        .deal-list {
           display: flex;
           flex-direction: column;
           gap: 10px;
        }

        .deal-card {
           padding: 12px;
           cursor: grab;
           background: rgba(255,255,255,0.04);
           border: 1px solid rgba(255,255,255,0.06);
           border-radius: 6px;
           box-shadow: 0 1px 3px rgba(0,0,0,0.2);
           transition: all 0.2s;
        }
        .deal-card:hover { 
           border-color: #3b82f6; 
           transform: translateY(-2px);
           box-shadow: 0 4px 8px rgba(0,0,0,0.3);
           background: rgba(255,255,255,0.06);
        }

        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .deal-title { font-weight: 600; font-size: 0.85rem; color: #f8fafc; line-height: 1.2; }
        .deal-company { font-size: 0.72rem; color: #94a3b8; font-weight: 500; display: flex; align-items: center; }

        .card-body { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .deal-value { display: flex; align-items: center; gap: 4px; color: #10b981; font-weight: 600; font-size: 0.9rem; }
        .deal-dates-row { display: flex; justify-content: space-between; align-items: center; }
        .deal-date { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 0.72rem; }
        .deal-date.expected { color: #f59e0b; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; }
        .contact-name-bottom { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #cbd5e1; font-weight: 500; }
        .priority-dot { width: 6px; height: 6px; border-radius: 50%; }
        .priority-dot.high { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }

        .add-deal-inline {
           background: transparent;
           border: 1px dashed rgba(255,255,255,0.15);
           color: #94a3b8;
           padding: 8px;
           border-radius: 6px;
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           gap: 6px;
           font-size: 0.8rem;
           transition: all 0.2s;
           margin-top: 4px;
        }
        .add-deal-inline:hover { background: rgba(255, 255, 255, 0.05); color: white; border-style: solid; }

        .icon-btn {
           background: transparent;
           border: none;
           cursor: pointer;
           padding: 2px;
           border-radius: 4px;
           display: flex;
           align-items: center;
           justify-content: center;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.1); }
        .card-actions-menu {
           position: absolute;
           top: 100%;
           right: 0;
           background: #1e293b;
           border: 1px solid var(--border-color);
           border-radius: 6px;
           padding: 4px;
           display: flex;
           flex-direction: column;
           gap: 2px;
           box-shadow: 0 4px 12px rgba(0,0,0,0.5);
           min-width: 110px;
        }
        .cam-item {
           display: flex; align-items: center; gap: 6px;
           padding: 6px 8px; font-size: 0.75rem; color: #f8fafc;
           cursor: pointer; border-radius: 4px; transition: background 0.2s;
        }
        .cam-item:hover { background: rgba(59,130,246,0.15); }

        .custom-dropdown {
           position: absolute;
           top: 100%;
           left: 0;
           width: 100%;
           background: #1e293b;
           border: 1px solid var(--border-color);
           border-radius: 8px;
           margin-top: 4px;
           z-index: 50;
           max-height: 200px;
           overflow-y: auto;
           box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .dropdown-item {
           padding: 10px 12px;
           cursor: pointer;
           border-bottom: 1px solid rgba(255,255,255,0.05);
           transition: background 0.2s;
        }
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover { background: rgba(59,130,246,0.1); }
        .di-name { font-weight: 600; font-size: 0.85rem; color: #f8fafc; }
        .di-sub { display: flex; gap: 8px; font-size: 0.7rem; color: #94a3b8; margin-top: 4px; flex-wrap: wrap; }
        .di-sub span { display: flex; align-items: center; gap: 3px; }
        .dropdown-empty { padding: 12px; font-size: 0.8rem; color: #94a3b8; text-align: center; }

        /* Modal Styles */
        .modal-overlay {
           position: fixed; top: 0; left: 0; right: 0; bottom: 0;
           background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px);
           z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content { 
           width: 100%; max-width: 500px; background: #11141a !important; 
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
        input, select {
           padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color);
           border-radius: 10px; color: white; outline: none;
        }
        input:focus { border-color: var(--primary-color); }
        .full-width { width: 100%; margin-top: 12px; }

        @media (max-width: 768px) {
          .pipeline-header { flex-direction: column; align-items: stretch; gap: 16px; }
          .ph-right { align-items: stretch; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default PipelinePage;

