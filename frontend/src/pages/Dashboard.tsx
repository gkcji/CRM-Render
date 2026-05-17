import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ReTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import {
  Users, TrendingUp, Layers, CalendarClock, MessageSquare,
  Mail, Phone, ChevronRight, AlertCircle, Clock, BarChart2, Target, Building2, CheckCircle, Trash2, IndianRupee
} from 'lucide-react';

interface DashboardStats {
  totalLeads: number;
  dueFollowupsCount: number;
  upcomingFollowupsCount: number;
  convertedCount: number;
  recentLeads: any[];
  dueTasks: any[];
  upcomingTasks: any[];
  channelCounts: any;
  industryCounts: any;
  pipelineFunnel: any[];
  revenueByMonth: any[];
}

const statusColors: Record<string, { color: string; bg: string }> = {
  new:        { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  contacted:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  qualified:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  converted:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  lost:       { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchDashboardStats = () => {
    fetch(`/api/stats`)
      .then(r => r.json())
      .then(data => {
        const cCounts: Record<string, number> = {};
        if (Array.isArray(data.channelCounts)) {
          data.channelCounts.forEach((item: any) => { cCounts[item.lead_type || 'Unknown'] = item.count; });
        }
        const iCounts: Record<string, number> = {};
        if (Array.isArray(data.leadsByIndustry)) {
          data.leadsByIndustry.forEach((item: any) => { iCounts[item.industry || 'Unknown'] = item.count; });
        }
        setStats({
          totalLeads: data.totalLeads || 0,
          dueFollowupsCount: data.dueFollowupsCount || 0,
          upcomingFollowupsCount: data.upcomingFollowupsCount || 0,
          convertedCount: data.convertedCount || 0,
          recentLeads: data.recentLeads || [],
          dueTasks: data.dueTasks || [],
          upcomingTasks: data.upcomingTasks || [],
          channelCounts: cCounts,
          industryCounts: iCounts,
          pipelineFunnel: data.pipelineFunnel || [],
          revenueByMonth: data.revenueByMonth || []
        });
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleCompleteTask = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    try { await fetch(`/api/tasks/${taskId}/complete`, { method: 'PUT' }); fetchDashboardStats(); }
    catch { alert('Error completing task'); }
  };

  const handleDeleteTask = async (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    if (!window.confirm('Delete this follow-up?')) return;
    try { await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' }); fetchDashboardStats(); }
    catch { alert('Error deleting task'); }
  };

  const convertedPct = stats?.totalLeads ? ((stats.convertedCount / stats.totalLeads) * 100).toFixed(1) : '0.0';
  const now = new Date();

  const metricCards = [
    {
      label: 'Total Leads', value: stats?.totalLeads || 0, icon: <Users size={18} />,
      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', sub: 'All time contacts',
      delay: 0.05, onClick: () => navigate('/leads')
    },
    {
      label: 'Due Follow-ups', value: stats?.dueFollowupsCount || 0, icon: <AlertCircle size={18} />,
      color: '#ef4444', bg: 'rgba(239,68,68,0.1)', sub: 'Action required today',
      delay: 0.1, onClick: () => navigate('/leads')
    },
    {
      label: 'Converted', value: stats?.convertedCount || 0, icon: <TrendingUp size={18} />,
      color: '#10b981', bg: 'rgba(16,185,129,0.1)', sub: `${convertedPct}% conversion rate`,
      delay: 0.15, onClick: () => navigate('/leads')
    },
    {
      label: 'Upcoming Tasks', value: stats?.upcomingFollowupsCount || 0, icon: <Clock size={18} />,
      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', sub: 'Scheduled ahead',
      delay: 0.2, onClick: () => navigate('/leads')
    },
  ];

  return (
    <div className="db-page">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="db-channel-pills">
          <div className="db-pill">
            <span className="db-pill-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><MessageSquare size={14} /></span>
            <div><span>WhatsApp</span><strong>{stats?.channelCounts['WhatsApp'] || 0}</strong></div>
          </div>
          <div className="db-pill">
            <span className="db-pill-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><Phone size={14} /></span>
            <div><span>Calling</span><strong>{stats?.channelCounts['Calling'] || 0}</strong></div>
          </div>
          <div className="db-pill">
            <span className="db-pill-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><Mail size={14} /></span>
            <div><span>Email</span><strong>{stats?.channelCounts['Email'] || 0}</strong></div>
          </div>
        </div>
      </motion.div>

      {/* ── METRIC CARDS ── */}
      <div className="db-metrics">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: card.delay }}
            className="db-metric" onClick={card.onClick}
            style={{ '--card-color': card.color } as any}
          >
            <div className="db-metric-top">
              <p className="db-metric-label">{card.label}</p>
              <span className="db-metric-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</span>
            </div>
            <div className="db-metric-value" style={{ color: card.color }}>{card.value}</div>
            <p className="db-metric-sub">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="db-grid">

        {/* Due Follow-ups */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="db-card db-card-due">
          <div className="db-card-header">
            <div className="db-card-title-group">
              <span className="db-card-icon-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><AlertCircle size={15} /></span>
              <div>
                <h3>Due Follow-ups</h3>
                <p>Require immediate action</p>
              </div>
            </div>
            {stats?.dueTasks && stats.dueTasks.length > 0 && (
              <span className="db-urgent-badge">{stats.dueTasks.length} URGENT</span>
            )}
          </div>
          <div className="db-list">
            {stats?.dueTasks?.length > 0 ? stats.dueTasks.map((t: any) => (
              <div key={t.id} className="db-followup-item" onClick={() => navigate(`/leads/${t.lead_id}`)}>
                <div className="db-fi-left">
                  <button className="db-task-action check" onClick={(e) => handleCompleteTask(e, t.id)} title="Mark Complete">
                    <CheckCircle size={18} />
                  </button>
                  <div className="db-fi-avatar">{(t.lead_name || 'U').charAt(0)}</div>
                  <div>
                    <strong>{t.lead_name || 'Unknown Lead'}</strong>
                    <p>{t.title}</p>
                  </div>
                </div>
                <div className="db-fi-right">
                  <span className="db-due-chip">DUE</span>
                  <span className="db-fi-date">
                    <Clock size={10} />
                    {new Date(t.due_date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button className="db-task-action del" onClick={(e) => handleDeleteTask(e, t.id)} title="Delete Task">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="db-empty">
                <CalendarClock size={36} color="#1e293b" />
                <p>All caught up!</p>
                <span>No follow-ups due today.</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="db-card db-card-upcoming">
          <div className="db-card-header">
            <div className="db-card-title-group">
              <span className="db-card-icon-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><Layers size={15} /></span>
              <div>
                <h3>Upcoming Tasks</h3>
                <p>Scheduled ahead</p>
              </div>
            </div>
          </div>
          <div className="db-list">
            {stats?.upcomingTasks?.length > 0 ? stats.upcomingTasks.map((t: any) => (
              <div key={t.id} className="db-followup-item" onClick={() => navigate(`/leads/${t.lead_id}`)}>
                <div className="db-fi-left">
                  <button className="db-task-action check" onClick={(e) => handleCompleteTask(e, t.id)} title="Mark Complete">
                    <CheckCircle size={18} />
                  </button>
                  <div className="db-fi-avatar" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>{(t.lead_name || 'U').charAt(0)}</div>
                  <div>
                    <strong>{t.lead_name || 'Unknown Lead'}</strong>
                    <p>{t.title}</p>
                  </div>
                </div>
                <div className="db-fi-right">
                  <span className="db-fi-date">
                    <Clock size={10} />
                    {new Date(t.due_date).toLocaleString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                  <button className="db-task-action del" onClick={(e) => handleDeleteTask(e, t.id)} title="Delete Task">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="db-empty">
                <Target size={36} color="#1e293b" />
                <p>Nothing scheduled</p>
                <span>No upcoming tasks yet.</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Deal Pipeline Funnel - Recharts Bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="db-card db-card-source">
          <div className="db-card-header">
            <div className="db-card-title-group">
              <span className="db-card-icon-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><BarChart2 size={15} /></span>
              <div>
                <h3>Sales Pipeline Funnel</h3>
                <p>Deal stages progression</p>
              </div>
            </div>
          </div>
          <div className="db-bar-wrap" style={{ height: '220px', width: '100%', marginTop: '10px' }}>
            {stats?.pipelineFunnel?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.pipelineFunnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} interval={0} tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <ReTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    formatter={(value: any) => [`${value} Deals`, 'Count']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.pipelineFunnel.map((entry, index) => {
                      const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="db-empty" style={{ paddingTop: '50px' }}>
                  <BarChart2 size={36} color="#1e293b" />
                  <p>No Deal Data</p>
                </div>
            )}
          </div>
        </motion.div>

        {/* Expected Revenue - Area Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="db-card db-card-industry">
          <div className="db-card-header">
            <div className="db-card-title-group">
              <span className="db-card-icon-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><TrendingUp size={15} /></span>
              <div>
                <h3>Revenue Trajectory</h3>
                <p>Won deals by expected close month</p>
              </div>
            </div>
          </div>
          <div className="db-bar-wrap" style={{ height: '220px', width: '100%', marginTop: '10px' }}>
             {stats?.revenueByMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueByMonth} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => {
                       const d = new Date(val + '-01');
                       return d.toLocaleDateString('en-US', { month: 'short' });
                    }} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} 
                       tickFormatter={(value) => {
                           if(value >= 10000000) return `₹${(value/10000000).toFixed(1)}Cr`;
                           if(value >= 100000) return `₹${(value/100000).toFixed(1)}L`;
                           if(value >= 1000) return `₹${(value/1000).toFixed(1)}K`;
                           return `₹${value}`;
                       }} 
                    />
                    <ReTooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                       formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                       labelFormatter={(label) => new Date(label + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
             ) : (
                <div className="db-empty" style={{ paddingTop: '50px' }}>
                  <IndianRupee size={36} color="#1e293b" />
                  <p>No Revenue Data</p>
                </div>
             )}
          </div>
        </motion.div>

        {/* Recent Leads — Mini Card Grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="db-card db-card-recent">
          <div className="db-card-header">
            <div className="db-card-title-group">
              <span className="db-card-icon-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Users size={15} /></span>
              <div>
                <h3>Recently Added Leads</h3>
                <p>Latest contacts in pipeline</p>
              </div>
            </div>
            <button className="db-view-all" onClick={() => navigate('/leads')}>View all <ChevronRight size={13} /></button>
          </div>
          <div className="db-lead-cards">
            {stats?.recentLeads?.length > 0 ? stats.recentLeads.map((lead: any, i: number) => {
              const sc = statusColors[(lead.status || 'new').toLowerCase()] || statusColors.new;
              const initials = lead.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <motion.div key={lead.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.05 }}
                  className="db-lead-card" onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <div className="db-lc-top">
                    <div className="db-lc-avatar">{initials}</div>
                    <span className="db-lc-status" style={{ color: sc.color, background: sc.bg }}>{lead.status || 'New'}</span>
                  </div>
                  <div className="db-lc-name">{lead.name}</div>
                  {lead.company && <div className="db-lc-meta"><Building2 size={11} />{lead.company}</div>}
                  {lead.phone && <div className="db-lc-meta"><Phone size={11} />{lead.phone}</div>}
                  {lead.email && !lead.phone && <div className="db-lc-meta"><Mail size={11} />{lead.email}</div>}
                  <div className="db-lc-footer">
                    <span>{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    {lead.lead_type && <span className="db-lc-source">{lead.lead_type}</span>}
                  </div>
                </motion.div>
              );
            }) : <div className="db-empty"><Users size={36} color="#1e293b" /><p>No leads yet</p></div>}
          </div>
        </motion.div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .db-page {
          display: flex; flex-direction: column; gap: 24px;
          font-family: 'Inter', sans-serif;
          padding-bottom: 24px;
        }

        /* ── HEADER ── */
        .db-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .db-title { font-size: 1.75rem; font-weight: 800; color: #f8fafc; margin: 0 0 4px; }
        .db-subtitle { font-size: 0.85rem; color: #475569; margin: 0; }
        .db-channel-pills { display: flex; gap: 10px; }
        .db-pill {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          padding: 10px 16px; border-radius: 12px; transition: background 0.2s;
        }
        .db-pill:hover { background: rgba(255,255,255,0.06); }
        .db-pill-icon { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; }
        .db-pill div { display: flex; flex-direction: column; line-height: 1.2; }
        .db-pill span { font-size: 0.65rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .db-pill strong { font-size: 1rem; font-weight: 700; color: #f1f5f9; }

        /* ── METRIC CARDS ── */
        .db-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .db-metric {
          background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 22px 24px; cursor: pointer;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          border-left: 3px solid var(--card-color);
          position: relative; overflow: hidden;
        }
        .db-metric::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, var(--card-color), transparent);
          opacity: 0.4;
        }
        .db-metric:hover { transform: translateY(-3px); border-color: var(--card-color); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .db-metric-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
        .db-metric-label { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .db-metric-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; }
        .db-metric-value { font-size: 2.4rem; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .db-metric-sub { font-size: 0.72rem; color: #475569; margin: 0; }

        /* ── GRID ── */
        .db-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
        .db-card-due      { grid-column: 1; grid-row: 1; }
        .db-card-source   { grid-column: 2; grid-row: 1; }
        .db-card-industry { grid-column: 3; grid-row: 1; }
        .db-card-recent   { grid-column: 1 / 3; grid-row: 2; }
        .db-card-upcoming { grid-column: 3; grid-row: 2; }

        /* ── CARD BASE ── */
        .db-card {
          background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 4px;
          min-height: 280px;
        }
        .db-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 8px; }
        .db-card-title-group { display: flex; align-items: flex-start; gap: 12px; }
        .db-card-icon-badge { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; margin-top: 2px; }
        .db-card-header h3 { font-size: 0.95rem; font-weight: 700; color: #f1f5f9; margin: 0 0 3px; }
        .db-card-header p { font-size: 0.75rem; color: #475569; margin: 0; }
        .db-urgent-badge { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.25); padding: 3px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; }
        .db-view-all { display: flex; align-items: center; gap: 4px; background: none; border: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 0.75rem; font-weight: 600; padding: 5px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .db-view-all:hover { color: #f1f5f9; background: rgba(255,255,255,0.05); }

        /* ── FOLLOW-UP ITEMS ── */
        .db-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; }
        .db-list::-webkit-scrollbar { width: 3px; }
        .db-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .db-followup-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 14px; border-radius: 10px; cursor: pointer;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          transition: all 0.2s; gap: 12px;
        }
        .db-followup-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
        .db-fi-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .db-fi-avatar {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: rgba(239,68,68,0.12); color: #f87171;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem;
        }
        .db-fi-left div { min-width: 0; }
        .db-fi-left strong { display: block; font-size: 0.85rem; color: #e2e8f0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .db-fi-left p { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .db-fi-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .db-due-chip { background: rgba(239,68,68,0.12); color: #f87171; font-size: 0.6rem; font-weight: 700; padding: 2px 7px; border-radius: 20px; letter-spacing: 0.5px; }
        .db-fi-date { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #475569; }

        .db-task-action { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; color: #475569; transition: all 0.2s; border-radius: 6px; }
        .db-task-action.check:hover { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .db-task-action.del { margin-left: 4px; }
        .db-task-action.del:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        /* ── DONUT CHART ── */
        .db-donut-wrapper { display: flex; align-items: center; gap: 20px; flex: 1; }
        .db-donut-chart { position: relative; width: 130px; height: 130px; flex-shrink: 0; }
        .db-donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .db-donut-center span { display: block; font-size: 1.5rem; font-weight: 800; color: #f1f5f9; line-height: 1; }
        .db-donut-center label { font-size: 0.62rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .db-donut-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .db-legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; }
        .db-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .db-legend-label { color: #94a3b8; flex: 1; }
        .db-legend-val { font-weight: 700; color: #f1f5f9; }

        /* ── BAR CHART ── */
        .db-bar-wrap { flex: 1; min-height: 0; position: relative; }

        /* ── RECENT LEADS — CARD GRID ── */
        .db-lead-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
          gap: 12px;
        }
        .db-lead-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px; cursor: pointer;
          transition: all 0.2s; display: flex; flex-direction: column; gap: 6px;
        }
        .db-lead-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(59,130,246,0.25); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
        .db-lc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .db-lc-avatar {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          background: rgba(59,130,246,0.15); color: #60a5fa;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9rem; letter-spacing: 0.5px;
        }
        .db-lc-status { padding: 3px 9px; border-radius: 20px; font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
        .db-lc-name { font-size: 0.88rem; font-weight: 700; color: #f1f5f9; line-height: 1.3; }
        .db-lc-meta { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .db-lc-meta svg { flex-shrink: 0; color: #475569; }
        .db-lc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
        .db-lc-footer span { font-size: 0.68rem; color: #334155; }
        .db-lc-source { background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 20px; font-size: 0.62rem; color: #64748b; font-weight: 600; }

        /* ── EMPTY STATE ── */
        .db-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px 0; text-align: center; }
        .db-empty p { font-size: 0.9rem; font-weight: 600; color: #334155; margin: 0; }
        .db-empty span { font-size: 0.78rem; color: #1e293b; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1280px) {
          .db-grid { grid-template-columns: 1fr 1fr; }
          .db-card-due      { grid-column: 1; grid-row: 1; }
          .db-card-source   { grid-column: 2; grid-row: 1; }
          .db-card-industry { grid-column: 1; grid-row: 2; }
          .db-card-recent   { grid-column: 1 / -1; grid-row: 3; }
          .db-card-upcoming { grid-column: 2; grid-row: 2; }
          .db-lead-cards { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
        }
        @media (max-width: 900px) {
          .db-metrics { grid-template-columns: 1fr 1fr; }
          .db-grid { grid-template-columns: 1fr; }
          .db-card-due, .db-card-upcoming, .db-card-source, .db-card-industry, .db-card-recent { grid-column: 1 !important; grid-row: auto !important; }
          .db-channel-pills { display: none; }
          .db-lead-cards { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
