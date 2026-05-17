import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, UserCircle, Briefcase, Mail, Phone,
  CalendarClock, Activity, AlertCircle, CheckCircle, Clock,
  Plus, Bell, StickyNote, IndianRupee,
  TrendingUp, Target, ChevronRight, ExternalLink, Trash2,
  Edit3, Save, X, Flag, BarChart2,
  PhoneCall, FileText, Users, Calendar, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomFieldsBlock from '../components/CustomFieldsBlock';

const STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const stageColors: Record<string, { bg: string; color: string; border: string }> = {
  Discovery:   { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa', border: '#a78bfa' },
  Proposal:    { bg: 'rgba(59,130,246,0.15)',   color: '#60a5fa', border: '#60a5fa' },
  Negotiation: { bg: 'rgba(245,158,11,0.15)',   color: '#fbbf24', border: '#fbbf24' },
  Won:         { bg: 'rgba(16,185,129,0.15)',    color: '#34d399', border: '#34d399' },
  Lost:        { bg: 'rgba(239,68,68,0.15)',     color: '#f87171', border: '#f87171' },
};

const activityTypeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Note:          { icon: <StickyNote size={14} />,  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  Call:          { icon: <PhoneCall size={14} />,   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Email:         { icon: <Mail size={14} />,         color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  Meeting:       { icon: <Users size={14} />,        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Contract Sent': { icon: <FileText size={14} />,  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  'Stage Change':  { icon: <TrendingUp size={14} />,color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
};

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Low Priority' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Medium Priority' },
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'High Priority' },
};

const DealDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [stageHistory, setStageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'activity' | 'notes'>('overview');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingCloseDate, setIsEditingCloseDate] = useState(false);
  const [tempCloseDate, setTempCloseDate] = useState('');

  const [newTask, setNewTask] = useState({ title: '', due_date: '' });
  const [newActivity, setNewActivity] = useState({ type: 'Note', description: '' });
  const [dealNotes, setDealNotes] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [dRes, tRes, aRes, hRes] = await Promise.all([
        fetch(`/api/deals/${id}`),
        fetch(`/api/deals/${id}/tasks`),
        fetch(`/api/deals/${id}/activities`),
        fetch(`/api/deals/${id}/stage-history`),
      ]);
      const d = await dRes.json();
      setDeal(d);
      setDealNotes(d.notes || '');
      setTempNotes(d.notes || '');
      setTempCloseDate(d.expected_close ? d.expected_close.split('T')[0] : '');
      setTasks(await tRes.json());
      setActivities(await aRes.json());
      setStageHistory(await hRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/deals/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: tempNotes }),
      });
      setDealNotes(tempNotes);
      setIsEditingNotes(false);
    } finally { setIsSaving(false); }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) { alert('Enter task title'); return; }
    await fetch(`/api/deals/${id}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask),
    });
    setNewTask({ title: '', due_date: '' }); setShowAddTask(false); fetchAll();
  };

  const completeTask = async (taskId: number) => {
    await fetch(`/api/tasks/${taskId}/complete`, { method: 'PUT' });
    fetchAll();
  };

  const addActivity = async () => {
    if (!newActivity.description.trim()) { alert('Enter description'); return; }
    await fetch(`/api/deals/${id}/activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newActivity),
    });
    setNewActivity({ type: 'Note', description: '' }); setShowAddActivity(false); fetchAll();
  };

  const deleteActivity = async (actId: number) => {
    if (!window.confirm('Delete this activity?')) return;
    await fetch(`/api/activities/${actId}`, { method: 'DELETE' });
    fetchAll();
  };

  const changeStage = async (stage: string) => {
    const currentIndex = STAGES.indexOf(deal.stage);
    const targetIndex = STAGES.indexOf(stage);
    if (targetIndex > currentIndex + 1) {
      alert('Deal must progress step-by-step through each stage.');
      return;
    }
    await fetch(`/api/deals/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }),
    });
    fetchAll();
  };

  const setPriority = async (priority: string) => {
    await fetch(`/api/deals/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priority }),
    });
    fetchAll();
  };

  const saveCloseDate = async () => {
    await fetch(`/api/deals/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expected_close: tempCloseDate || null }),
    });
    setIsEditingCloseDate(false);
    fetchAll();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8', fontSize: '1.1rem' }}>
      Loading deal profile...
    </div>
  );
  if (!deal) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <AlertCircle size={48} color="#ef4444" />
      <p style={{ color: '#ef4444', marginTop: 12 }}>Deal not found.</p>
      <Link to="/deals" style={{ color: '#3b82f6' }}>← Back to Pipeline</Link>
    </div>
  );

  const now = new Date();
  const pending = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);
  const overdue = pending.filter(t => new Date(t.due_date) <= now);
  const upcoming = pending.filter(t => new Date(t.due_date) > now);

  const sc = stageColors[deal.stage] || stageColors.Discovery;
  const pc = priorityConfig[deal.priority || 'Medium'];
  const stageIdx = STAGES.indexOf(deal.stage);
  const isWonOrLost = deal.stage === 'Won' || deal.stage === 'Lost';

  // Build unified timeline: activities + stage history merged and sorted by date
  const combinedTimeline = [
    ...activities.map((a: any) => ({ ...a, _type: 'activity' })),
    ...stageHistory.map((h: any) => ({
      id: `sh-${h.id}`,
      _type: 'stage',
      type: 'Stage Change',
      description: `Moved from **${h.from_stage || 'Start'}** → **${h.to_stage}**`,
      created_at: h.changed_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="dd-page">

      {/* ── HERO BANNER ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="dd-hero glass-card">

        {/* Row 1: Back button + Deal Title (page breadcrumb) */}
        <div className="dd-hero-top">
          <div className="dd-hero-breadcrumb">
            <button className="dd-back" onClick={() => navigate('/deals')}>
              <ArrowLeft size={16} /> Back to Pipeline
            </button>
            <span className="dd-breadcrumb-sep">·</span>
            <span className="dd-breadcrumb-title">{deal.title}</span>
          </div>
          <div className="dd-hero-badges">
            <span className="dd-stage-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}44` }}>
              {deal.stage}
            </span>
            <span className="dd-priority-badge" style={{ background: pc.bg, color: pc.color }}>
              <Flag size={11} /> {deal.priority || 'Medium'}
            </span>
            {deal.quote_status === 'Accepted' && (
              <span className="dd-priority-badge" style={{ background: '#dcfce7', color: '#166534', animation: 'pulse-slow 2s infinite', fontSize: '11px', fontWeight: 600 }}>
                <CheckCircle size={12} /> Quote Checked
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="dd-hero-divider" />

        {/* Row 2: Contact box + Deal name + meta */}
        <div className="dd-hero-info">

          {/* Connected Contact Row — shown above title */}
          {deal.lead && (
            <div className="dd-contact-row">
              <div className="dd-contact-avatar">{deal.lead.name?.charAt(0)}</div>
              <div className="dd-contact-info">
                <span className="dd-contact-name">{deal.lead.name}</span>
                {deal.lead.company && <span className="dd-contact-company"><Building2 size={11} />{deal.lead.company}</span>}
              </div>
              {deal.lead.phone && <span className="dd-contact-chip"><Phone size={11} />{deal.lead.phone}</span>}
              {deal.lead.email && <span className="dd-contact-chip"><Mail size={11} />{deal.lead.email}</span>}
              <Link to={`/leads/${deal.lead.id}`} className="dd-contact-link" title="Open Lead Profile">
                <ExternalLink size={14} />
              </Link>
            </div>
          )}

          <div className="dd-title-row">
            <span className="dd-deal-label"><TrendingUp size={11} /> DEAL</span>
            <h1 className="dd-title">{deal.title}</h1>
          </div>

          {/* Meta Row */}
          <div className="dd-hero-meta">
            <div className="dd-hero-value">
              <IndianRupee size={20} color="#10b981" />
              <span>{Number(deal.value || 0).toLocaleString('en-IN')}</span>
            </div>

            {/* Editable Close Date */}
            <div className="dd-close-date-group">
              <Calendar size={12} color="#64748b" />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Close:</span>
              {isEditingCloseDate ? (
                <>
                  <input
                    type="date"
                    className="dd-inline-date"
                    value={tempCloseDate}
                    onChange={e => setTempCloseDate(e.target.value)}
                    autoFocus
                  />
                  <button className="dd-date-save" onClick={saveCloseDate}><Save size={12} /></button>
                  <button className="dd-date-cancel" onClick={() => setIsEditingCloseDate(false)}><X size={12} /></button>
                </>
              ) : (
                <button className="dd-date-display" onClick={() => { setTempCloseDate(deal.expected_close ? deal.expected_close.split('T')[0] : ''); setIsEditingCloseDate(true); }}>
                  {deal.expected_close
                    ? new Date(deal.expected_close).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                    : <span style={{ color: '#475569', fontStyle: 'italic' }}>Set close date</span>}
                  <Edit3 size={11} color="#475569" />
                </button>
              )}
            </div>

            <span className="dd-meta-chip">
              <Clock size={12} /> Created: {new Date(deal.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </span>

            {/* Stats inline */}
            <div className="dd-hero-stats" style={{ marginLeft: 'auto' }}>
              <div className="dd-hstat"><span style={{ color: overdue.length > 0 ? '#ef4444' : '#64748b' }}>{overdue.length}</span><label>Overdue</label></div>
              <div className="dd-hstat"><span style={{ color: '#f59e0b' }}>{upcoming.length}</span><label>Tasks</label></div>
              <div className="dd-hstat"><span style={{ color: '#10b981' }}>{done.length}</span><label>Done</label></div>
              <div className="dd-hstat"><span style={{ color: '#3b82f6' }}>{activities.length}</span><label>Logs</label></div>
            </div>
          </div>
        </div>

      </motion.div>


      {/* ── MAIN BODY ── */}
      <div className="dd-body">

        {/* ── LEFT SIDEBAR ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="dd-sidebar">

          {/* Priority */}
          <div className="dd-block glass-card">
            <h3 className="dd-block-title"><Flag size={14} /> Deal Priority</h3>
            <div className="dd-priority-btns">
              {Object.entries(priorityConfig).map(([p, cfg]) => (
                <button key={p}
                  className={`dd-priority-btn ${(deal.priority || 'Medium') === p ? 'active' : ''}`}
                  style={(deal.priority || 'Medium') === p ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + '66' } : {}}
                  onClick={() => setPriority(p)}
                >
                  <Flag size={12} /> {p}
                </button>
              ))}
            </div>
          </div>

          {/* Connected Lead */}
          {deal.lead && (
            <div className="dd-block glass-card">
              <h3 className="dd-block-title"><UserCircle size={14} /> Connected Contact</h3>
              <Link to={`/leads/${deal.lead.id}`} className="dd-lead-banner">
                <div className="dd-lead-avatar">{deal.lead.name?.charAt(0) || '?'}</div>
                <div className="dd-lead-info">
                  <span className="dd-lead-name">{deal.lead.name}</span>
                  <span className="dd-lead-meta">{deal.lead.company || 'No company'}</span>
                </div>
                <ExternalLink size={14} color="#3b82f6" />
              </Link>
              <div className="dd-lead-details">
                {deal.lead.email && <div className="dd-lrow"><Mail size={13} />{deal.lead.email}</div>}
                {deal.lead.phone && <div className="dd-lrow"><Phone size={13} />{deal.lead.phone}</div>}
                {deal.lead.job_title && <div className="dd-lrow"><Briefcase size={13} />{deal.lead.job_title}</div>}
                {deal.lead.industry && <div className="dd-lrow"><Building2 size={13} />{deal.lead.industry}</div>}
              </div>
            </div>
          )}

          {/* Deal Stats */}
          <div className="dd-block glass-card">
            <h3 className="dd-block-title"><BarChart2 size={14} /> Deal Stats</h3>
            <div className="dd-stats-grid">
              <div className="dd-stat-item">
                <label>Value</label>
                <span style={{ color: '#10b981' }}>₹{Number(deal.value || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="dd-stat-item">
                <label>Stage</label>
                <span style={{ color: sc.color }}>{deal.stage}</span>
              </div>
              <div className="dd-stat-item">
                <label>Tasks</label>
                <span style={{ color: '#f59e0b' }}>{tasks.length}</span>
              </div>
              <div className="dd-stat-item">
                <label>Activities</label>
                <span style={{ color: '#3b82f6' }}>{activities.length}</span>
              </div>
              {deal.expected_close && (
                <div className="dd-stat-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Expected Close</label>
                  <span style={{ color: '#f59e0b' }}>{new Date(deal.expected_close).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                </div>
              )}
            </div>
          </div>

          <CustomFieldsBlock entityType="deal" entityId={Number(id)} />
        </motion.div>

        {/* ── RIGHT MAIN CONTENT ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dd-main glass-card">

          {/* Tabs */}
          <div className="dd-tabs">
            {([
              { key: 'overview', label: 'Overview', icon: <BarChart2 size={15} /> },
              { key: 'tasks',    label: 'Tasks',    icon: <CheckSquare size={15} />, badge: pending.length },
              { key: 'activity', label: 'Activity',  icon: <Activity size={15} />, badge: activities.length },
              { key: 'notes',    label: 'Notes',    icon: <StickyNote size={15} /> },
            ] as any[]).map(tab => (
              <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
                {tab.icon} {tab.label}
                {tab.badge > 0 && <span className="dd-badge">{tab.badge}</span>}
              </button>
            ))}
          </div>

          <div className="dd-tab-body">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="dd-overview">
                <h3 className="dd-section-title"><TrendingUp size={16} /> Pipeline Journey</h3>
                <div className="dd-timeline">
                  {/* Show creation event */}
                  <div className="dd-tl-item">
                    <div className="dd-tl-icon" style={{ background: 'rgba(16,185,129,0.1)', borderColor: '#10b981' }}>
                      <Plus size={14} color="#10b981" />
                    </div>
                    <div className="dd-tl-content">
                      <div className="dd-tl-header">
                        <strong>Deal Created</strong>
                        <span className="dd-tl-time"><Clock size={11} />{new Date(deal.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <p className="dd-tl-desc">Deal entered pipeline at <strong>Discovery</strong> stage.</p>
                    </div>
                  </div>
                  {/* Stage history entries */}
                  {stageHistory.map((h: any) => {
                    const toConf = stageColors[h.to_stage] || stageColors.Discovery;
                    return (
                      <div key={h.id} className="dd-tl-item">
                        <div className="dd-tl-icon" style={{ background: toConf.bg, borderColor: toConf.color }}>
                          <ChevronRight size={14} color={toConf.color} />
                        </div>
                        <div className="dd-tl-content">
                          <div className="dd-tl-header">
                            <strong>Stage Advanced</strong>
                            <span className="dd-tl-time"><Clock size={11} />{new Date(h.changed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                          <p className="dd-tl-desc">
                            Moved from <span style={{ color: stageColors[h.from_stage]?.color || '#94a3b8' }}>{h.from_stage || 'Start'}</span>{' '}
                            → <span style={{ color: toConf.color, fontWeight: 700 }}>{h.to_stage}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {stageHistory.length === 0 && (
                    <div className="dd-tl-empty">
                      <Target size={32} color="#1e293b" />
                      <p>No stage changes yet. Move this deal forward to track its journey!</p>
                    </div>
                  )}
                </div>

                {activities.length > 0 && (
                  <>
                    <h3 className="dd-section-title" style={{ marginTop: 32 }}><Activity size={16} /> Recent Activity</h3>
                    <div className="dd-timeline">
                      {activities.slice(0, 3).map((act: any) => {
                        const cfg = activityTypeConfig[act.type] || activityTypeConfig.Note;
                        return (
                          <div key={act.id} className="dd-tl-item">
                            <div className="dd-tl-icon" style={{ background: cfg.bg, borderColor: cfg.color + '55' }}>
                              <span style={{ color: cfg.color }}>{cfg.icon}</span>
                            </div>
                            <div className="dd-tl-content">
                              <div className="dd-tl-header">
                                <strong>{act.type}</strong>
                                <span className="dd-tl-time"><Clock size={11} />{new Date(act.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </div>
                              <p className="dd-tl-desc">{act.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {activities.length > 3 && (
                      <button className="dd-see-more" onClick={() => setActiveTab('activity')}>
                        View all {activities.length} activities <ChevronRight size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TASKS TAB ── */}
            {activeTab === 'tasks' && (
              <div>
                <AnimatePresence>
                  {!showAddTask ? (
                    <button className="dd-add-btn" onClick={() => setShowAddTask(true)}>
                      <Plus size={16} /> Schedule New Task
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dd-form-card">
                      <h4><Bell size={15} /> New Task / Reminder</h4>
                      <input type="text" placeholder="e.g. Follow up on contract, Send revised proposal..."
                        value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                      <div className="dd-form-row">
                        <input type="datetime-local" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                        <button type="button" className="btn-primary" onClick={addTask}><CheckCircle size={14} /> Schedule</button>
                        <button type="button" className="btn-cancel" onClick={() => { setShowAddTask(false); setNewTask({ title: '', due_date: '' }); }}><X size={14} /></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {overdue.length > 0 && (
                  <div className="dd-task-section">
                    <div className="dd-slabel" style={{ color: '#ef4444' }}><AlertCircle size={12} /> Overdue · {overdue.length}</div>
                    {overdue.map((t: any) => <DTaskCard key={t.id} task={t} type="overdue" onComplete={completeTask} />)}
                  </div>
                )}
                {upcoming.length > 0 && (
                  <div className="dd-task-section">
                    <div className="dd-slabel" style={{ color: '#f59e0b' }}><CalendarClock size={12} /> Upcoming · {upcoming.length}</div>
                    {upcoming.map((t: any) => <DTaskCard key={t.id} task={t} type="upcoming" onComplete={completeTask} />)}
                  </div>
                )}
                {done.length > 0 && (
                  <div className="dd-task-section">
                    <div className="dd-slabel" style={{ color: '#10b981' }}><CheckCircle size={12} /> Completed · {done.length}</div>
                    {done.map((t: any) => <DTaskCard key={t.id} task={t} type="completed" onComplete={completeTask} />)}
                  </div>
                )}
                {tasks.length === 0 && !showAddTask && (
                  <div className="dd-empty">
                    <CalendarClock size={44} color="#1e293b" />
                    <p>No tasks scheduled yet</p>
                    <span>Add deal-specific tasks and follow-up reminders here.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVITY LOG TAB ── */}
            {activeTab === 'activity' && (
              <div>
                <AnimatePresence>
                  {!showAddActivity ? (
                    <button className="dd-add-btn" onClick={() => setShowAddActivity(true)}>
                      <Plus size={16} /> Log Deal Event
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dd-form-card">
                      <h4><Activity size={15} /> Log New Event</h4>
                      <div className="dd-activity-type-row">
                        {Object.entries(activityTypeConfig).filter(([k]) => k !== 'Stage Change').map(([k, cfg]) => (
                          <button key={k}
                            className={`dd-type-btn ${newActivity.type === k ? 'active' : ''}`}
                            style={newActivity.type === k ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color + '66' } : {}}
                            onClick={() => setNewActivity({ ...newActivity, type: k })}
                          >
                            <span style={newActivity.type === k ? { color: cfg.color } : {}}>{cfg.icon}</span> {k}
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Describe the interaction: what was discussed, outcome, next steps..."
                        value={newActivity.description}
                        onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                        rows={4}
                      />
                      <div className="dd-form-row">
                        <button type="button" className="btn-primary" onClick={addActivity}><Save size={14} /> Log Event</button>
                        <button type="button" className="btn-cancel" onClick={() => { setShowAddActivity(false); setNewActivity({ type: 'Note', description: '' }); }}><X size={14} /> Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="dd-timeline">
                  <AnimatePresence>
                    {combinedTimeline.map((item: any) => {
                      const cfg = activityTypeConfig[item.type] || activityTypeConfig.Note;
                      return (
                        <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="dd-tl-item">
                          <div className="dd-tl-icon" style={{ background: cfg.bg, borderColor: cfg.color + '55' }}>
                            <span style={{ color: cfg.color }}>{cfg.icon}</span>
                          </div>
                          <div className="dd-tl-content">
                            <div className="dd-tl-header">
                              <strong>{item.type}</strong>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="dd-tl-time"><Clock size={11} />{new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                {item._type === 'activity' && (
                                  <button className="dd-del-btn" onClick={() => deleteActivity(item.id)} title="Delete activity">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="dd-tl-desc" dangerouslySetInnerHTML={{ __html: item.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {combinedTimeline.length === 0 && (
                    <div className="dd-empty">
                      <Activity size={44} color="#1e293b" />
                      <p>No activity logged yet</p>
                      <span>Log calls, emails, meetings, and proposals to track deal progress.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── NOTES TAB ── */}
            {activeTab === 'notes' && (
              <div className="dd-notes-tab">
                <div className="dd-notes-header">
                  <h4><StickyNote size={16} /> Deal Notes & Strategy</h4>
                  {!isEditingNotes ? (
                    <button className="btn-primary" onClick={() => { setTempNotes(dealNotes); setIsEditingNotes(true); setTimeout(() => notesRef.current?.focus(), 100); }}>
                      <Edit3 size={14} /> {dealNotes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={saveNotes} disabled={isSaving}>
                        <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="btn-cancel" onClick={() => setIsEditingNotes(false)}><X size={14} /> Cancel</button>
                    </div>
                  )}
                </div>
                {isEditingNotes ? (
                  <textarea
                    ref={notesRef}
                    className="dd-notes-area"
                    placeholder="Write negotiation points, client feedback, pricing strategy, decision makers, next steps..."
                    value={tempNotes}
                    onChange={e => setTempNotes(e.target.value)}
                  />
                ) : (
                  dealNotes ? (
                    <div className="dd-notes-display">
                      <p>{dealNotes}</p>
                    </div>
                  ) : (
                    <div className="dd-empty">
                      <StickyNote size={44} color="#1e293b" />
                      <p>No notes added yet</p>
                      <span>Add deal strategy, client feedback, pricing notes and more.</span>
                    </div>
                  )
                )}
              </div>
            )}

          </div>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .dd-page { display: flex; flex-direction: column; gap: 24px; font-family: 'Inter', sans-serif; }

        /* ── HERO ── */
        .dd-hero { padding: 28px 32px; display: flex; flex-direction: column; gap: 16px; }
        .dd-hero-top { display: flex; justify-content: space-between; align-items: center; }
        .dd-hero-breadcrumb { display: flex; align-items: center; gap: 10px; }
        .dd-back { display: inline-flex; align-items: center; gap: 7px; background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: color 0.2s; padding: 0; }
        .dd-back:hover { color: white; }
        .dd-breadcrumb-sep { color: #334155; font-size: 1rem; }
        .dd-breadcrumb-title { font-size: 0.88rem; font-weight: 600; color: #94a3b8; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dd-hero-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0 -32px; }
        .dd-hero-badges { display: flex; gap: 8px; align-items: center; }
        .dd-stage-badge { font-size: 0.72rem; padding: 5px 14px; border-radius: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .dd-priority-badge { font-size: 0.72rem; padding: 5px 12px; border-radius: 20px; font-weight: 600; display: flex; align-items: center; gap: 5px; }

        .dd-hero-body { display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
        .dd-hero-icon { width: 72px; height: 72px; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dd-hero-info { flex: 1; min-width: 200px; }
        .dd-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .dd-deal-label { display: inline-flex; align-items: center; gap: 4px; font-size: 0.62rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #3b82f6; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); padding: 4px 9px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; }
        .dd-title { font-size: 1.65rem; font-weight: 800; color: white; margin: 0; line-height: 1.2; }

        /* Contact Row */
        .dd-contact-row { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px; background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.12); border-radius: 10px; padding: 8px 12px; max-width: 100%; }
        .dd-contact-avatar { width: 26px; height: 26px; border-radius: 7px; background: rgba(59,130,246,0.2); color: #60a5fa; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.82rem; flex-shrink: 0; }
        .dd-contact-info { display: flex; flex-direction: column; gap: 2px; margin-right: 4px; }
        .dd-contact-name { font-size: 0.88rem; font-weight: 700; color: #f1f5f9; line-height: 1; }
        .dd-contact-company { font-size: 0.72rem; color: #64748b; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .dd-contact-chip { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #94a3b8; background: rgba(255,255,255,0.04); padding: 3px 8px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); }
        .dd-contact-link { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); color: #3b82f6; transition: all 0.2s; text-decoration: none; flex-shrink: 0; }
        .dd-contact-link:hover { background: rgba(59,130,246,0.22); transform: scale(1.05); }

        /* Meta Row & Editable Date */
        .dd-hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .dd-hero-value { display: flex; align-items: center; gap: 4px; font-size: 1.8rem; font-weight: 800; color: #10b981; }
        .dd-meta-chip { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: #64748b; background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); }
        .dd-close-date-group { display: flex; align-items: center; gap: 6px; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2); padding: 4px 10px; border-radius: 20px; }
        .dd-date-display { display: flex; align-items: center; gap: 6px; background: none; border: none; color: #f59e0b; font-size: 0.78rem; font-weight: 600; cursor: pointer; padding: 0; transition: opacity 0.2s; }
        .dd-date-display:hover { opacity: 0.8; }
        .dd-inline-date { background: rgba(0,0,0,0.3); border: 1px solid rgba(245,158,11,0.4); border-radius: 6px; color: #f59e0b; font-size: 0.75rem; padding: 2px 6px; outline: none; width: 130px; }
        .dd-date-save { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #10b981; border-radius: 5px; cursor: pointer; padding: 3px 6px; display: flex; align-items: center; }
        .dd-date-cancel { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #ef4444; border-radius: 5px; cursor: pointer; padding: 3px 6px; display: flex; align-items: center; }

        .dd-hero-stats { display: flex; gap: 2px; background: rgba(0,0,0,0.2); border-radius: 16px; padding: 4px; border: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
        .dd-hstat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 18px; }
        .dd-hstat span { font-size: 1.5rem; font-weight: 700; }
        .dd-hstat label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 600; }

        /* ── STAGE JOURNEY ── */
        .dd-stage-journey { display: flex; align-items: flex-start; gap: 0; padding: 20px 0 8px; overflow-x: auto; }
        .dd-journey-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 80px; position: relative; }
        .dd-journey-line { flex: 1; height: 2px; background: rgba(255,255,255,0.06); position: absolute; top: 18px; right: 50%; left: -50%; z-index: 0; }
        .dd-journey-line.active { background: linear-gradient(90deg, rgba(16,185,129,0.4), rgba(59,130,246,0.4)); }
        .dd-journey-node { width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #64748b; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; position: relative; z-index: 1; }
        .dd-journey-node.completed { background: rgba(16,185,129,0.15); border-color: #10b981; color: #10b981; }
        .dd-journey-node.locked { opacity: 0.35; cursor: not-allowed; }
        .dd-journey-node:not(.locked):not([disabled]):hover { transform: scale(1.1); }
        .dd-journey-node.lost { border-color: #ef444466; color: #ef4444; }
        .dd-journey-label { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .dd-journey-label span { font-size: 0.72rem; font-weight: 600; color: #64748b; text-align: center; }
        .dd-journey-date { font-size: 0.62rem; color: #475569; }

        /* ── BODY ── */
        .dd-body { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 960px) { .dd-body { grid-template-columns: 1fr; } }

        /* ── SIDEBAR ── */
        .dd-sidebar { display: flex; flex-direction: column; gap: 16px; }
        .dd-block { padding: 20px; }
        .dd-block-title { display: flex; align-items: center; gap: 8px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 14px; }
        .dd-priority-btns { display: flex; flex-direction: column; gap: 6px; }
        .dd-priority-btn { width: 100%; padding: 9px 14px; border-radius: 8px; text-align: left; cursor: pointer; font-size: 0.83rem; font-weight: 600; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); color: #64748b; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .dd-priority-btn:hover { background: rgba(255,255,255,0.06); color: white; }
        .dd-priority-btn.active { font-weight: 700; }

        .dd-lead-banner { display: flex; align-items: center; gap: 12px; background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.15); border-radius: 10px; padding: 14px; text-decoration: none; margin-bottom: 14px; transition: all 0.2s; }
        .dd-lead-banner:hover { background: rgba(59,130,246,0.12); }
        .dd-lead-avatar { width: 38px; height: 38px; border-radius: 10px; background: rgba(59,130,246,0.2); color: #60a5fa; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; }
        .dd-lead-info { flex: 1; }
        .dd-lead-name { display: block; font-size: 0.9rem; font-weight: 700; color: white; }
        .dd-lead-meta { font-size: 0.75rem; color: #64748b; }
        .dd-lead-details { display: flex; flex-direction: column; gap: 8px; }
        .dd-lrow { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #94a3b8; }

        .dd-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .dd-stat-item { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px 12px; }
        .dd-stat-item label { display: block; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 600; margin-bottom: 4px; }
        .dd-stat-item span { font-size: 0.95rem; font-weight: 700; color: #f1f5f9; }

        /* ── MAIN ── */
        .dd-main { display: flex; flex-direction: column; overflow: hidden; }
        .dd-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 8px; flex-shrink: 0; overflow-x: auto; }
        .dd-tabs button { background: none; border: none; border-bottom: 2px solid transparent; padding: 16px 18px; color: #64748b; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; white-space: nowrap; }
        .dd-tabs button:hover { color: #e2e8f0; }
        .dd-tabs button.active { color: #3b82f6; border-bottom-color: #3b82f6; }
        .dd-badge { background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 10px; font-weight: 700; }
        .dd-tab-body { padding: 24px; overflow-y: auto; max-height: 620px; }

        /* ── OVERVIEW ── */
        .dd-overview { display: flex; flex-direction: column; }
        .dd-section-title { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dd-tl-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px; color: #334155; text-align: center; font-size: 0.85rem; }
        .dd-see-more { display: flex; align-items: center; gap: 6px; background: none; border: none; color: #3b82f6; font-size: 0.82rem; font-weight: 600; cursor: pointer; padding: 8px 0; margin-top: 8px; transition: opacity 0.2s; }
        .dd-see-more:hover { opacity: 0.7; }

        /* ── NOTES ── */
        .dd-notes-tab { display: flex; flex-direction: column; gap: 16px; }
        .dd-notes-header { display: flex; justify-content: space-between; align-items: center; }
        .dd-notes-header h4 { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; color: #f1f5f9; margin: 0; }
        .dd-notes-area { width: 100%; min-height: 380px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; color: #e2e8f0; resize: vertical; outline: none; font-family: inherit; font-size: 0.92rem; line-height: 1.7; transition: border-color 0.2s; box-sizing: border-box; }
        .dd-notes-area:focus { border-color: #3b82f6; }
        .dd-notes-display { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; min-height: 200px; }
        .dd-notes-display p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.7; white-space: pre-wrap; margin: 0; }

        /* ── ACTIVITY LOG ── */
        .dd-activity-type-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .dd-type-btn { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #64748b; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .dd-type-btn:hover { color: white; background: rgba(255,255,255,0.06); }
        .dd-type-btn.active { font-weight: 700; }
        .dd-del-btn { background: none; border: none; cursor: pointer; color: #ef4444; opacity: 0; transition: opacity 0.2s; padding: 2px; display: flex; border-radius: 4px; }
        .dd-tl-item:hover .dd-del-btn { opacity: 1; }
        .dd-del-btn:hover { background: rgba(239,68,68,0.1); }

        /* ── TIMELINE ── */
        .dd-timeline { display: flex; flex-direction: column; padding-left: 16px; position: relative; }
        .dd-timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.04); border-radius: 2px; }
        .dd-tl-item { display: flex; gap: 16px; margin-bottom: 20px; position: relative; }
        .dd-tl-icon { width: 32px; height: 32px; border-radius: 50%; background: #1e293b; border: 2px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 1; }
        .dd-tl-content { flex: 1; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 14px 16px; transition: border-color 0.2s; }
        .dd-tl-item:hover .dd-tl-content { border-color: rgba(255,255,255,0.09); }
        .dd-tl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .dd-tl-header strong { font-size: 0.82rem; font-weight: 700; color: white; }
        .dd-tl-time { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #475569; }
        .dd-tl-desc { font-size: 0.88rem; color: #cbd5e1; line-height: 1.55; white-space: pre-wrap; margin: 0; }

        /* ── TASKS ── */
        .dd-task-section { margin-bottom: 24px; }
        .dd-slabel { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.04); }

        /* ── SHARED ── */
        .dd-add-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 13px 18px; border-radius: 12px; cursor: pointer; background: rgba(59,130,246,0.07); border: 1.5px dashed rgba(59,130,246,0.3); color: #3b82f6; font-size: 0.9rem; font-weight: 600; transition: all 0.25s; margin-bottom: 20px; }
        .dd-add-btn:hover { background: rgba(59,130,246,0.14); border-style: solid; }
        .dd-form-card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
        .dd-form-card h4 { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; color: #f1f5f9; margin: 0 0 4px 0; }
        .dd-form-card input, .dd-form-card select, .dd-form-card textarea { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; outline: none; font-family: inherit; font-size: 0.9rem; transition: border-color 0.2s; box-sizing: border-box; }
        .dd-form-card input:focus, .dd-form-card select:focus, .dd-form-card textarea:focus { border-color: #3b82f6; }
        .dd-form-card textarea { resize: vertical; min-height: 100px; }
        .dd-form-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .btn-cancel:hover { background: rgba(255,255,255,0.05); color: white; }

        /* ── EMPTY ── */
        .dd-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 50px 20px; text-align: center; }
        .dd-empty p { font-size: 1rem; font-weight: 600; color: #475569; margin: 0; }
        .dd-empty span { font-size: 0.82rem; color: #334155; max-width: 260px; }

        .dd-task-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; }
        .dd-task-card.overdue { background: rgba(239,68,68,0.04); border-left: 3px solid #ef4444; }
        .dd-task-card.upcoming { background: rgba(245,158,11,0.03); border-left: 3px solid #f59e0b; }
        .dd-task-card.completed { opacity: 0.55; border-left: 3px solid #10b981; }
        .dd-check-btn { background: none; border: none; cursor: pointer; display: flex; padding: 0; }
        .dd-task-info { flex: 1; }
        .dd-task-title { font-size: 0.9rem; font-weight: 600; color: #f1f5f9; margin: 0 0 4px; }
        .dd-task-title.done { text-decoration: line-through; color: #4b5563; }
        .dd-task-date { display: flex; align-items: center; gap: 5px; font-size: 0.73rem; }
        .dd-task-date.overdue { color: #f87171; }
        .dd-task-date.upcoming { color: #fbbf24; }
        .dd-task-date.completed { color: #6b7280; }
      `}</style>
    </div>
  );
};

const DTaskCard = ({ task, type, onComplete }: { task: any; type: string; onComplete: (id: number) => void }) => (
  <div className={`dd-task-card ${type}`}>
    <button className="dd-check-btn" onClick={() => type !== 'completed' && onComplete(task.id)}>
      <CheckCircle size={22} color={type === 'completed' ? '#10b981' : '#334155'} />
    </button>
    <div className="dd-task-info">
      <p className={`dd-task-title ${type === 'completed' ? 'done' : ''}`}>{task.title}</p>
      <span className={`dd-task-date ${type}`}>
        <Clock size={11} />
        {type === 'overdue' ? 'Was due ' : ''}{new Date(task.due_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </span>
    </div>
    {type !== 'completed' && <ChevronRight size={16} color="#1e293b" />}
  </div>
);

export default DealDetails;
