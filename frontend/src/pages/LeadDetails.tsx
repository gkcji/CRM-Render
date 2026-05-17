import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Globe,
  Phone, Mail, Calendar, MessageCircle, FileText,
  UserCircle, Tag, Component, Factory, Activity,
  CheckCircle, Presentation, Clock, Bell, Trash2,
  CalendarClock, AlertCircle, Plus, ChevronRight, IndianRupee, ExternalLink, Edit3
} from 'lucide-react';
import { motion } from 'framer-motion';
import CustomFieldsBlock from '../components/CustomFieldsBlock';

const LeadDetailsPage: React.FC<{ authUser?: any }> = ({ authUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'followups' | 'timeline' | 'deals' | 'notes' | 'email'>('followups');
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' });

  const [newActivity, setNewActivity] = useState({ type: 'Call', description: '' });
  const [newTask, setNewTask] = useState({ title: '', due_date: '' });
  const [newDeal, setNewDeal] = useState({ title: '', value: '', stage: 'Discovery', expected_close: '' });
  const [loading, setLoading] = useState(true);
  const [showAddFollowup, setShowAddFollowup] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => { 
    fetchLeadDetails(); 
    fetchTemplates();
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const resp = await fetch(`/api/email-templates`);
      setTemplates(await resp.json());
    } catch (e) { console.error('Error fetching templates', e); }
  };

  const fetchLeadDetails = async () => {
    try {
      const resp = await fetch(`/api/leads/${id}`);
      const data = await resp.json();
      if (data.lead) {
        setLead(data.lead); setActivities(data.activities || []);
        setTasks(data.tasks || []); setDeals(data.deals || []);
      } else { setLead(data); }
    } catch (err) { alert('Error loading lead details.'); }
    finally { setLoading(false); }
  };

  const handleAddActivity = async () => {
    if (!newActivity.description.trim()) { alert("Please describe the interaction."); return; }
    try {
      const resp = await fetch(`/api/leads/${id}/activities`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newActivity)
      });
      if (!resp.ok) throw new Error('Failed');
      setNewActivity({ type: 'Call', description: '' }); setShowAddActivity(false); fetchLeadDetails();
    } catch { alert('Error adding activity'); }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) { alert("Please enter a followup title."); return; }
    if (!newTask.due_date) { alert("Please select a due date."); return; }
    try {
      const resp = await fetch(`/api/leads/${id}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask)
      });
      if (!resp.ok) throw new Error('Failed');
      setNewTask({ title: '', due_date: '' }); setShowAddFollowup(false); fetchLeadDetails();
    } catch { alert('Error scheduling followup'); }
  };

  const handleDeleteActivity = async (actId: number) => {
    if (!window.confirm("Delete this interaction log?")) return;
    try {
      await fetch(`/api/activities/${actId}`, { method: 'DELETE' });
      fetchLeadDetails();
    } catch { alert('Error deleting interaction'); }
  };

  const handleCompleteTask = async (taskId: number) => {
    try { await fetch(`/api/tasks/${taskId}/complete`, { method: 'PUT' }); fetchLeadDetails(); }
    catch { alert('Error completing task'); }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Delete this follow-up?')) return;
    try { await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' }); fetchLeadDetails(); }
    catch { alert('Error deleting task'); }
  };

  const handleAddDeal = async () => {
    if (!newDeal.title.trim()) { alert("Please enter a deal title."); return; }
    if (!newDeal.expected_close) { alert("Please select an expected close date."); return; }
    try {
      const resp = await fetch(`/api/deals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDeal, lead_id: id })
      });
      if (!resp.ok) throw new Error('Failed');
      setNewDeal({ title: '', value: '', stage: 'Discovery', expected_close: '' }); setShowAddDeal(false); fetchLeadDetails();
    } catch { alert('Error creating deal'); }
  };

  const handleSaveNotes = async () => {
    try {
      const parts = (lead.name || '').split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      const payload = {
        ...lead,
        first_name,
        last_name,
        notes: tempNotes
      };

      const resp = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Failed');
      
      setIsEditingNotes(false);
      fetchLeadDetails();
    } catch { 
      alert('Error updating notes'); 
    }
  };

  const logPhoneCallInit = async (phone: string) => {
    window.location.href = `tel:${phone}`;
    try {
      await fetch(`/api/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'Call', description: `Initiated outbound click-to-call dialer to ${phone}.` })
      });
      fetchLeadDetails();
    } catch (e) { console.error('Error logging call', e); }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:'1.1rem' }}>Loading profile...</div>;
  if (!lead) return <div style={{ padding:'40px', color:'#ef4444' }}>Lead not found.</div>;

  const now = new Date();
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks = pendingTasks.filter(t => new Date(t.due_date) <= now);
  const upcomingTasks = pendingTasks.filter(t => new Date(t.due_date) > now);
  const totalDealValue = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  const channelColor = lead.lead_type === 'WhatsApp' ? '#25d366' : lead.lead_type === 'Email' ? '#f59e0b' : '#3b82f6';
  const channelBg = lead.lead_type === 'WhatsApp' ? 'rgba(37,211,102,0.12)' : lead.lead_type === 'Email' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)';

  const activityTypeColor: Record<string, string> = { Call: '#3b82f6', Email: '#f59e0b', Meeting: '#8b5cf6', Note: '#10b981' };

  return (
    <div className="ld-page">

      {/* ── TOP HERO BANNER ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="ld-hero glass-card">
        <button className="ld-back" onClick={() => navigate('/leads')}>
          <ArrowLeft size={16} /> Back to Leads
        </button>

        <div className="ld-hero-body">
          <div className="ld-avatar" style={{ background: channelBg, color: channelColor }}>
            {lead.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="ld-hero-info">
            <div className="ld-name-row">
              <h1>{lead.name}</h1>
              <span className={`ld-status ${(lead.status || 'new').toLowerCase()}`}>{lead.status || 'New'}</span>
              <span className="ld-channel" style={{ background: channelBg, color: channelColor }}>
                {lead.lead_type === 'WhatsApp' && <MessageCircle size={12} />}
                {lead.lead_type === 'Email' && <Mail size={12} />}
                {(!lead.lead_type || lead.lead_type === 'Calling') && <Phone size={12} />}
                {lead.lead_type || 'Calling'}
              </span>
            </div>
            <p className="ld-subtitle">{[lead.job_title, lead.company].filter(Boolean).join(' at ') || 'No role / company added'}</p>
            <div className="ld-contact-chips">
              {lead.phone && (
                 <span className="ld-chip" style={{ cursor: 'pointer', borderColor: 'rgba(59,130,246,0.5)', background: 'rgba(59,130,246,0.1)' }} onClick={() => logPhoneCallInit(lead.phone)}>
                    <Phone size={13} color="#3b82f6" />
                    <span style={{ color: '#3b82f6', fontWeight: 500 }}>{lead.phone}</span>
                 </span>
              )}
              {lead.email && <span className="ld-chip"><Mail size={13} />{lead.email}</span>}
              {lead.city && <span className="ld-chip"><MapPin size={13} />{[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
          <div className="ld-hero-right">
            {lead.tags && (
              <div className="ld-hero-tags">
                <Tag size={13} color="#94a3b8" />
                {lead.tags.split(',').map((tag: string, i: number) => (
                  <span key={`tag-${i}`} className="ld-hero-tag">{tag.trim()}</span>
                ))}
              </div>
            )}
            <div className="ld-hero-stats">
              <div className="ld-hstat">
                <span style={{ color: overdueTasks.length > 0 ? '#ef4444' : '#94a3b8' }}>{overdueTasks.length}</span>
                <label>Overdue</label>
              </div>
              <div className="ld-hstat">
                <span style={{ color: '#f59e0b' }}>{upcomingTasks.length}</span>
                <label>Upcoming</label>
              </div>
              <div className="ld-hstat">
                <span style={{ color: '#10b981' }}>{deals.length}</span>
                <label>Deals</label>
              </div>
              <div className="ld-hstat">
                <span style={{ color: '#3b82f6' }}>{activities.length}</span>
                <label>Logs</label>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="ld-body">
        {/* ── LEFT SIDEBAR ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="ld-sidebar">

          {/* Contact Info Block */}
          <div className="ld-block glass-card">
            <h3 className="ld-block-title"><UserCircle size={16} /> Contact Details</h3>
            <div className="ld-info-grid">
              <InfoItem icon={<Building2 size={14}/>} label="Company" value={lead.company || '—'} />
              <InfoItem icon={<Factory size={14}/>} label="Industry" value={lead.industry || '—'} />
              <InfoItem icon={<Component size={14}/>} label="Service" value={lead.service || '—'} />
              <InfoItem icon={<Globe size={14}/>} label="Website" value={lead.website || '—'} link={lead.website} />
              <InfoItem icon={<UserCircle size={14}/>} label="Source" value={lead.source || '—'} />
              <InfoItem icon={<Calendar size={14}/>} label="Added" value={new Date(lead.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
              {(lead.address || lead.city || lead.state || lead.country) && (
                <InfoItem icon={<MapPin size={14}/>} label="Address" value={[lead.address, lead.city, lead.state, lead.pincode, lead.country].filter(Boolean).join(', ')} />
              )}
            </div>
          </div>

          <CustomFieldsBlock entityType="lead" entityId={Number(id)} />
        </motion.div>

        {/* ── RIGHT MAIN CONTENT ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ld-main glass-card">

          {/* Tabs */}
          <div className="ld-tabs">
            <button className={activeTab === 'followups' ? 'active' : ''} onClick={() => setActiveTab('followups')}>
              <CalendarClock size={15} /> Follow-ups
              {pendingTasks.length > 0 && <span className="ld-badge">{pendingTasks.length}</span>}
            </button>
            <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}>
              <Activity size={15} /> Timeline
            </button>
            <button className={activeTab === 'deals' ? 'active' : ''} onClick={() => setActiveTab('deals')}>
              <Presentation size={15} /> Deals
              {deals.length > 0 && <span className="ld-badge ld-badge-green">{deals.length}</span>}
            </button>
            <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>
              <FileText size={15} /> Notes
            </button>
            <button className={activeTab === 'email' ? 'active' : ''} onClick={() => setActiveTab('email')}>
              <Mail size={15} /> Email
            </button>
          </div>

          <div className="ld-tab-body">

            {/* ─── FOLLOWUPS TAB ─── */}
            {activeTab === 'followups' && (
              <div>
                {!showAddFollowup ? (
                  <button className="ld-add-btn" onClick={() => setShowAddFollowup(true)}>
                    <Plus size={16} /> Schedule New Follow-up
                  </button>
                ) : (
                  <div className="ld-form-card">
                    <h4><Bell size={15} /> New Follow-up Reminder</h4>
                    <input type="text" placeholder="e.g. Call back about quotation, Send revised proposal..."
                      value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                    <div className="ld-form-row">
                      <input type="datetime-local" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                      <button type="button" className="btn-primary" onClick={handleAddTask}>Schedule</button>
                      <button type="button" className="btn-cancel" onClick={() => { setShowAddFollowup(false); setNewTask({ title: '', due_date: '' }); }}>Cancel</button>
                    </div>
                  </div>
                )}

                {overdueTasks.length > 0 && (
                  <div className="ld-task-section">
                    <div className="ld-section-label" style={{ color: '#ef4444' }}><AlertCircle size={13} /> Overdue · {overdueTasks.length}</div>
                    {overdueTasks.map((t: any) => <TaskCard key={t.id} task={t} type="overdue" onComplete={handleCompleteTask} onDelete={handleDeleteTask} />)}
                  </div>
                )}
                {upcomingTasks.length > 0 && (
                  <div className="ld-task-section">
                    <div className="ld-section-label" style={{ color: '#f59e0b' }}><CalendarClock size={13} /> Upcoming · {upcomingTasks.length}</div>
                    {upcomingTasks.map((t: any) => <TaskCard key={t.id} task={t} type="upcoming" onComplete={handleCompleteTask} onDelete={handleDeleteTask} />)}
                  </div>
                )}
                {completedTasks.length > 0 && (
                  <div className="ld-task-section">
                    <div className="ld-section-label" style={{ color: '#10b981' }}><CheckCircle size={13} /> Completed · {completedTasks.length}</div>
                    {completedTasks.map((t: any) => <TaskCard key={t.id} task={t} type="completed" onComplete={handleCompleteTask} onDelete={handleDeleteTask} />)}
                  </div>
                )}
                {tasks.length === 0 && !showAddFollowup && (
                  <div className="ld-empty">
                    <CalendarClock size={44} color="#1e293b" />
                    <p>No follow-ups scheduled yet</p>
                    <span>Set reminders for callbacks, proposals, and meetings.</span>
                  </div>
                )}
              </div>
            )}

            {/* ─── TIMELINE TAB ─── */}
            {activeTab === 'timeline' && (
              <div>
                {!showAddActivity ? (
                  <button className="ld-add-btn" onClick={() => setShowAddActivity(true)}>
                    <Plus size={16} /> Log Interaction
                  </button>
                ) : (
                  <div className="ld-form-card">
                    <h4><Activity size={15} /> Log Interaction</h4>
                    <div className="ld-form-row">
                      <select value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}>
                        <option>Call</option><option>Email</option><option>Meeting</option><option>Note</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Describe this interaction in detail..."
                      value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} />
                    <div className="ld-form-row">
                      <button type="button" className="btn-primary" onClick={handleAddActivity}>Log It</button>
                      <button type="button" className="btn-cancel" onClick={() => { setShowAddActivity(false); setNewActivity({ type: 'Call', description: '' }); }}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="ld-timeline">
                  {activities.length > 0 ? activities.map((act: any) => (
                    <div key={act.id} className="ld-tl-item">
                      <div className="ld-tl-dot" style={{ background: activityTypeColor[act.type] || '#64748b' }} />
                      <div className="ld-tl-content">
                        <div className="ld-tl-header">
                          <span className="ld-tl-type" style={{ background: (activityTypeColor[act.type] || '#64748b') + '22', color: activityTypeColor[act.type] || '#64748b' }}>
                            {act.type}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="ld-tl-time"><Clock size={11} />{new Date(act.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            <button className="ld-tl-del" onClick={() => handleDeleteActivity(act.id)} title="Delete interaction"><Trash2 size={13} /></button>
                          </div>
                        </div>
                        <p className="ld-tl-desc">{act.description}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="ld-empty">
                      <Activity size={44} color="#1e293b" />
                      <p>No interactions logged</p>
                      <span>Log your first call, email, or meeting above.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── DEALS TAB ─── */}
            {activeTab === 'deals' && (
              <div>
                {deals.length > 0 && (
                  <div className="ld-deal-summary">
                    <div className="lds-item"><IndianRupee size={14} /><span>Total Pipeline Value</span><strong>₹{totalDealValue.toLocaleString('en-IN')}</strong></div>
                    <div className="lds-item"><Presentation size={14} /><span>Active Deals</span><strong>{deals.length}</strong></div>
                  </div>
                )}

                {!showAddDeal ? (
                  <button className="ld-add-btn" onClick={() => setShowAddDeal(true)}>
                    <Plus size={16} /> Create New Deal
                  </button>
                ) : (
                  <div className="ld-form-card">
                    <h4><Presentation size={15} /> New Deal</h4>
                    <input type="text" placeholder="Deal title e.g., Enterprise Site License"
                      value={newDeal.title} onChange={e => setNewDeal({ ...newDeal, title: e.target.value })} />
                    <div className="ld-form-row">
                      <input type="number" placeholder="Value (₹)" value={newDeal.value}
                        onChange={e => setNewDeal({ ...newDeal, value: e.target.value })} style={{ maxWidth: '130px' }} />
                      <select value={newDeal.stage} onChange={e => setNewDeal({ ...newDeal, stage: e.target.value })}>
                        <option>Discovery</option><option>Proposal</option><option>Negotiation</option><option>Won</option><option>Lost</option>
                      </select>
                      <input type="date" value={newDeal.expected_close} onChange={e => setNewDeal({ ...newDeal, expected_close: e.target.value })} />
                    </div>
                    <div className="ld-form-row" style={{ marginTop: 4 }}>
                      <button type="button" className="btn-primary" onClick={handleAddDeal}>Create Deal</button>
                      <button type="button" className="btn-cancel" onClick={() => { setShowAddDeal(false); setNewDeal({ title: '', value: '', stage: 'Discovery', expected_close: '' }); }}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="ld-deals-list">
                  {deals.length > 0 ? deals.map((deal: any) => (
                    <div key={deal.id} className="ld-deal-card">
                      <div className="ldd-left">
                        <div className="ldd-icon"><Presentation size={18} /></div>
                        <div>
                          <h4>{deal.title}</h4>
                          <span className="ldd-meta">Close: {deal.expected_close ? new Date(deal.expected_close).toLocaleDateString('en-IN') : 'TBD'}</span>
                        </div>
                      </div>
                      <div className="ldd-right">
                        <div className="ldd-value">₹{Number(deal.value || 0).toLocaleString('en-IN')}</div>
                        <span className={`ldd-stage ${(deal.stage || '').toLowerCase()}`}>{deal.stage}</span>
                        <Link to={`/deals/${deal.id}`} className="ldd-link" title="Open Deal"><ExternalLink size={14} /></Link>
                      </div>
                    </div>
                  )) : (
                    <div className="ld-empty">
                      <Presentation size={44} color="#1e293b" />
                      <p>No deals attached yet</p>
                      <span>Create your first deal opportunity for this lead.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ─── NOTES TAB ─── */}
            {activeTab === 'notes' && (
              <div className="ld-notes-tab">
                {!isEditingNotes ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                      <button className="ld-add-btn" onClick={() => { setTempNotes(lead.notes || ''); setIsEditingNotes(true); }}>
                        <Edit3 size={16} /> {lead.notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    </div>
                    {lead.notes ? (
                      <div className="ld-card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="ld-notes-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#cbd5e1', margin: 0 }}>
                          {lead.notes}
                        </p>
                      </div>
                    ) : (
                      <div className="ld-empty">
                        <FileText size={44} color="#1e293b" />
                        <p>No internal notes added yet</p>
                        <span>Click Add Notes to start recording information.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="ld-form-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', color: '#e2e8f0', margin: 0 }}>
                      <FileText size={16} color="#3b82f6" /> {lead.notes ? 'Edit Internal Notes' : 'Add Internal Notes'}
                    </h4>
                    <textarea 
                      style={{ width: '100%', minHeight: '180px', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#e2e8f0', resize: 'vertical', fontSize: '0.95rem', fontFamily: 'inherit' }}
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Start typing your internal notes or append new updates here..."
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button type="button" className="btn-primary" onClick={handleSaveNotes} style={{ padding: '8px 24px' }}>Save Notes</button>
                      <button type="button" className="btn-cancel" onClick={() => setIsEditingNotes(false)} style={{ padding: '8px 24px' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── EMAIL TAB ─── */}
            {activeTab === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Template Picker */}
                <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 18px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 8 }}>📋 INSERT FROM TEMPLATE</label>
                  <select
                    onChange={e => {
                      const tpl = templates.find((t: any) => t.id === Number(e.target.value));
                      if (tpl) {
                        const name = lead?.name || 'there';
                        setEmailDraft({
                          subject: tpl.subject.replace(/\{name\}/gi, name),
                          body: tpl.body.replace(/\{name\}/gi, name).replace(/\{email\}/gi, lead?.email || '').replace(/\{company\}/gi, lead?.company || '')
                        });
                      }
                    }}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  >
                    <option value="">— Select a template to auto-fill —</option>
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
                      No templates yet. Create them in <strong>Settings → Email Templates</strong>.
                    </p>
                  )}
                </div>

                {/* Compose Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>TO</label>
                    <input
                      type="text"
                      readOnly
                      value={lead?.email || '(no email on file)'}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#94a3b8', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>SUBJECT</label>
                    <input
                      type="text"
                      placeholder="Email subject..."
                      value={emailDraft.subject}
                      onChange={e => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>BODY</label>
                    <textarea
                      rows={9}
                      placeholder="Compose your email here… Use {name}, {company} as smart placeholders."
                      value={emailDraft.body}
                      onChange={e => setEmailDraft({ ...emailDraft, body: e.target.value })}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                {/* Action Row */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className="btn-cancel"
                    onClick={() => setEmailDraft({ subject: '', body: '' })}
                  >
                    Clear Draft
                  </button>
                  <button
                    className="btn-primary"
                    style={{ opacity: lead?.email ? 1 : 0.5 }}
                    onClick={() => {
                      if (!lead?.email) { alert('This lead has no email address.'); return; }
                      const mailto = `mailto:${lead.email}?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`;
                      window.open(mailto);
                      // Auto-log the email activity
                      fetch(`/api/leads/${id}/activities`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'Email', description: `Sent email: "${emailDraft.subject}"` })
                      }).then(() => fetchLeadDetails());
                    }}
                  >
                    <Mail size={15} /> Open in Mail App
                  </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .ld-page { display: flex; flex-direction: column; gap: 24px; font-family: 'Inter', sans-serif; }

        /* ── HERO ── */
        .ld-hero { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
        .ld-back { display: inline-flex; align-items: center; gap: 7px; background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.85rem; font-weight: 500; padding: 0; transition: color 0.2s; }
        .ld-back:hover { color: white; }
        .ld-hero-body { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        .ld-avatar { width: 76px; height: 76px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 700; flex-shrink: 0; }
        .ld-hero-info { flex: 1; min-width: 200px; }
        .ld-name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
        .ld-name-row h1 { font-size: 1.7rem; font-weight: 700; color: white; }
        .ld-status { font-size: 0.7rem; padding: 4px 10px; border-radius: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .ld-status.new { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .ld-status.contacted { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .ld-status.qualified { background: rgba(16,185,129,0.15); color: #34d399; }
        .ld-status.lost { background: rgba(239,68,68,0.15); color: #f87171; }
        .ld-status.converted { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .ld-channel { display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
        .ld-subtitle { font-size: 0.95rem; color: #94a3b8; margin-bottom: 12px; }
        .ld-contact-chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .ld-chip { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 8px; font-size: 0.8rem; color: #cbd5e1; }
        .ld-hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .ld-hero-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: flex-end; }
        .ld-hero-tag { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); color: #60a5fa; padding: 3px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .ld-hero-stats { display: flex; gap: 2px; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 4px; border: 1px solid rgba(255,255,255,0.05); }
        .ld-hstat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 20px; border-radius: 12px; }
        .ld-hstat span { font-size: 1.6rem; font-weight: 700; }
        .ld-hstat label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 600; }

        /* ── BODY GRID ── */
        .ld-body { display: grid; grid-template-columns: 300px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 960px) { .ld-body { grid-template-columns: 1fr; } .ld-hero-stats { display: none; } }

        /* ── SIDEBAR ── */
        .ld-sidebar { display: flex; flex-direction: column; gap: 16px; }
        .ld-block { padding: 20px 24px; }
        .ld-block-title { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 16px; }
        .ld-info-grid { display: flex; flex-direction: column; gap: 0; }
        .ld-info-row { display: flex; gap: 0; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .ld-info-row:last-child { border-bottom: none; }
        .ld-info-icon { display: flex; align-items: flex-start; padding-top: 2px; width: 28px; flex-shrink: 0; color: #475569; }
        .ld-info-inner { display: flex; flex-direction: column; gap: 2px; }
        .ld-info-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 600; }
        .ld-info-value { font-size: 0.85rem; color: #cbd5e1; word-break: break-all; }
        .ld-info-link { color: #3b82f6; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem; }
        .ld-info-link:hover { text-decoration: underline; }
        .ld-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .ld-tag { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 6px; font-size: 0.78rem; color: #94a3b8; }
        .ld-notes-text { font-size: 0.9rem; color: #94a3b8; line-height: 1.7; white-space: pre-wrap; }

        /* ── MAIN CONTENT ── */
        .ld-main { display: flex; flex-direction: column; overflow: hidden; }
        .ld-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 8px; flex-shrink: 0; }
        .ld-tabs button { background: none; border: none; border-bottom: 2px solid transparent; padding: 16px 20px; color: #64748b; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; position: relative; }
        .ld-tabs button:hover { color: #e2e8f0; }
        .ld-tabs button.active { color: var(--primary-color, #3b82f6); border-bottom-color: var(--primary-color, #3b82f6); }
        .ld-badge { background: #ef4444; color: white; font-size: 0.62rem; padding: 2px 6px; border-radius: 10px; font-weight: 700; }
        .ld-badge-green { background: #059669 !important; }
        .ld-tab-body { padding: 24px; overflow-y: auto; max-height: 580px; }

        /* ── FORMS ── */
        .ld-add-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 14px 18px; border-radius: 12px; cursor: pointer; background: rgba(59,130,246,0.07); border: 1.5px dashed rgba(59,130,246,0.3); color: #3b82f6; font-size: 0.9rem; font-weight: 600; transition: all 0.25s; margin-bottom: 20px; }
        .ld-add-btn:hover { background: rgba(59,130,246,0.14); border-style: solid; }
        .ld-form-card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
        .ld-form-card h4 { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; color: #f1f5f9; margin-bottom: 4px; }
        .ld-form-card input, .ld-form-card select { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; outline: none; font-family: inherit; font-size: 0.9rem; transition: border-color 0.2s; }
        .ld-form-card input:focus, .ld-form-card select:focus { border-color: var(--primary-color, #3b82f6); }
        .ld-form-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.25s; }
        .btn-cancel:hover { background: rgba(255,255,255,0.05); color: white; }

        /* ── TASKS ── */
        .ld-task-section { margin-bottom: 24px; }
        .ld-section-label { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .ld-task-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; }
        .ld-task-card.overdue { background: rgba(239,68,68,0.04); border-left: 3px solid #ef4444; }
        .ld-task-card.upcoming { background: rgba(245,158,11,0.03); border-left: 3px solid #f59e0b; }
        .ld-task-card.completed { opacity: 0.6; border-left: 3px solid #10b981; }
        .ld-task-card:hover { background: rgba(255,255,255,0.03); }
        .ld-task-check { background: none; border: none; cursor: pointer; display: flex; padding: 0; }
        .ld-task-check:hover svg { color: #10b981; }
        .ld-task-info { flex: 1; }
        .ld-task-title { font-size: 0.9rem; font-weight: 600; color: #f1f5f9; margin-bottom: 4px; }
        .ld-task-title.done { text-decoration: line-through; color: #4b5563; }
        .ld-task-date { display: flex; align-items: center; gap: 5px; font-size: 0.73rem; }
        .ld-task-date.overdue { color: #f87171; }
        .ld-task-date.upcoming { color: #fbbf24; }
        .ld-task-date.completed { color: #6b7280; }
        .ld-task-del { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; color: #64748b; transition: all 0.2s; border-radius: 6px; }
        .ld-task-del:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        /* ── TIMELINE ── */
        .ld-timeline { display: flex; flex-direction: column; padding-left: 20px; position: relative; }
        .ld-timeline::before { content: ''; position: absolute; left: 7px; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.05); border-radius: 2px; }
        .ld-tl-item { display: flex; gap: 16px; margin-bottom: 20px; position: relative; }
        .ld-tl-dot { width: 14px; height: 14px; border-radius: 50%; position: absolute; left: -20px; top: 4px; border: 2px solid #0f172a; z-index: 1; flex-shrink: 0; }
        .ld-tl-content { flex: 1; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 16px; }
        .ld-tl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .ld-tl-type { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 5px; }
        .ld-tl-time { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #475569; }
        .ld-tl-del { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s; opacity: 0; }
        .ld-tl-item:hover .ld-tl-del { opacity: 1; }
        .ld-tl-del:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .ld-tl-desc { font-size: 0.88rem; color: #cbd5e1; line-height: 1.5; }

        /* ── DEALS TAB ── */
        .ld-deal-summary { display: flex; gap: 16px; margin-bottom: 20px; }
        .lds-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); padding: 12px 16px; border-radius: 10px; font-size: 0.85rem; color: #64748b; flex: 1; }
        .lds-item strong { color: white; font-size: 1rem; margin-left: auto; }
        .ld-deals-list { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
        .ld-deal-card { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 20px; transition: all 0.2s; }
        .ld-deal-card:hover { border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.04); }
        .ldd-left { display: flex; align-items: center; gap: 14px; }
        .ldd-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(59,130,246,0.12); color: #3b82f6; display: flex; align-items: center; justify-content: center; }
        .ldd-left h4 { font-size: 0.95rem; font-weight: 600; color: #f1f5f9; }
        .ldd-meta { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
        .ldd-right { display: flex; align-items: center; gap: 12px; }
        .ldd-value { font-size: 1rem; font-weight: 700; color: #10b981; }
        .ldd-stage { font-size: 0.65rem; padding: 3px 8px; border-radius: 5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(255,255,255,0.08); color: #94a3b8; }
        .ldd-stage.won { background: rgba(16,185,129,0.15); color: #34d399; }
        .ldd-stage.lost { background: rgba(239,68,68,0.15); color: #f87171; }
        .ldd-stage.proposal { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .ldd-stage.negotiation { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .ldd-stage.discovery { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .ldd-link { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: rgba(59,130,246,0.1); color: #3b82f6; text-decoration: none; transition: all 0.2s; }
        .ldd-link:hover { background: #3b82f6; color: white; }

        /* ── EMPTY STATES ── */
        .ld-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 50px 20px; text-align: center; }
        .ld-empty p { font-size: 1rem; font-weight: 600; color: #475569; }
        .ld-empty span { font-size: 0.82rem; color: #334155; max-width: 260px; }

        @media (max-width: 768px) {
          .ld-body { flex-direction: column; }
          .ld-sidebar { width: 100%; top: 0; position: relative; }
          .ld-hero { padding: 20px 16px; }
          .ld-hero-stats { grid-template-columns: 1fr 1fr; display: grid; width: 100%; gap: 10px; }
          .ld-hstat { width: 100%; justify-content: space-between; flex-direction: row-reverse; padding: 10px 14px; }
          .ld-hero-right { width: 100%; }
          .ld-deal-summary { flex-direction: column; }
          .ld-deal-card { flex-direction: column; align-items: flex-start; gap: 12px; }
          .ldd-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

// Sub-components
const InfoItem = ({ icon, label, value, link }: { icon: any, label: string, value: string, link?: string }) => (
  <div className="ld-info-row">
    <div className="ld-info-icon">{icon}</div>
    <div className="ld-info-inner">
      <span className="ld-info-label">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="ld-info-link">{value} <ExternalLink size={11} /></a>
      ) : (
        <span className="ld-info-value">{value}</span>
      )}
    </div>
  </div>
);

const TaskCard = ({ task, type, onComplete, onDelete }: { task: any, type: string, onComplete: (id: number) => void, onDelete: (id: number) => void }) => (
  <div className={`ld-task-card ${type}`}>
    <button className="ld-task-check" onClick={() => type !== 'completed' && onComplete(task.id)} title={type === 'completed' ? 'Completed' : 'Mark as done'}>
      <CheckCircle size={20} color={type === 'completed' ? '#10b981' : '#334155'} />
    </button>
    <div className="ld-task-info">
      <p className={`ld-task-title ${type === 'completed' ? 'done' : ''}`}>{task.title}</p>
      <span className={`ld-task-date ${type}`}>
        <Clock size={11} />
        {type === 'overdue' ? 'Was due ' : type === 'completed' ? 'Done · ' : ''}
        {new Date(task.due_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </span>
    </div>
    <button className="ld-task-del" onClick={() => onDelete(task.id)} title="Delete follow-up">
      <Trash2 size={14} />
    </button>
  </div>
);

export default LeadDetailsPage;
