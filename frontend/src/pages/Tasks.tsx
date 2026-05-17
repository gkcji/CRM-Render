import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Clock, CalendarClock, Briefcase, UserCircle, 
  Trash2, AlertCircle, Calendar
} from 'lucide-react';

const Tasks = ({ authUser }: { authUser?: any }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'pending'|'completed'|'overdue'>('pending');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const resp = await fetch(`/api/tasks`);
      const data = await resp.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}/complete`, { method: 'PUT' });
      fetchTasks();
    } catch (err) {
      alert('Error completing task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if(!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      alert('Error deleting task');
    }
  };

  const now = new Date();
  
  const filteredTasks = tasks.filter(t => {
     if(filter === 'all') return true;
     if(filter === 'completed') return t.completed;
     if(filter === 'pending') return !t.completed;
     if(filter === 'overdue') return !t.completed && new Date(t.due_date) < now;
     return true;
  });

  if (loading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading all tasks...</div>;

  const [viewMode, setViewMode] = useState<'list'|'calendar'>('calendar');

  const overdueCount = tasks.filter(t => !t.completed && new Date(t.due_date) < now).length;
  const pendingCount = tasks.filter(t => !t.completed && new Date(t.due_date) >= now).length;

  // --- Calendar Logic ---
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = currentMonth.getDay();
  const getDaysArray = () => {
     let days = [];
     for(let i=0; i<firstDayIndex; i++) days.push(null);
     for(let i=1; i<=daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
     return days;
  };

  return (
    <div className="tasks-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="page-header" style={{ marginBottom: 20 }}>
         <div className="header-left">
           <h1>Task Center</h1>
           <p>Manage all your global tasks, follow-ups, and calendar reminders.</p>
         </div>
         <div className="utb-right" style={{ display: 'flex', gap: '8px', background: 'var(--card-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button 
               onClick={() => setViewMode('list')} 
               style={{ background: viewMode === 'list' ? 'var(--primary-glow)' : 'transparent', color: viewMode === 'list' ? '#3b82f6' : 'var(--text-secondary)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >List View</button>
            <button 
               onClick={() => setViewMode('calendar')} 
               style={{ background: viewMode === 'calendar' ? 'var(--primary-glow)' : 'transparent', color: viewMode === 'calendar' ? '#3b82f6' : 'var(--text-secondary)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >Calendar View</button>
         </div>
      </header>

      {viewMode === 'list' && (
      <div className="stats-row" style={{ marginBottom: 20 }}>
         <div className="stat-card glass-card">
            <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444'}}>
               <AlertCircle size={20} />
            </div>
            <div className="stat-info">
               <h3>Overdue</h3>
               <span className="stat-value">{overdueCount}</span>
            </div>
         </div>
         <div className="stat-card glass-card">
            <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b'}}>
               <CalendarClock size={20} />
            </div>
            <div className="stat-info">
               <h3>Upcoming</h3>
               <span className="stat-value">{pendingCount}</span>
            </div>
         </div>
         <div className="stat-card glass-card">
            <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#10b981'}}>
               <CheckCircle size={20} />
            </div>
            <div className="stat-info">
               <h3>Completed</h3>
               <span className="stat-value">{tasks.filter(t => t.completed).length}</span>
            </div>
         </div>
      </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={20}/> {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
               <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer' }}>Prev</button>
                  <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer' }}>Today</button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer' }}>Next</button>
               </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', flex: 1, borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ background: 'var(--card-bg)', padding: '10px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{d}</div>
               ))}
               {getDaysArray().map((d, i) => {
                  if(!d) return <div key={`empty-${i}`} style={{ background: 'var(--bg-color)' }} />;
                  const dateStr = d.toISOString().split('T')[0];
                  const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
                  const isToday = d.toDateString() === today.toDateString();
                  return (
                     <div key={i} style={{ background: isToday ? 'var(--primary-glow)' : 'var(--card-bg)', padding: '8px', minHeight: '100px', display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto' }}>
                        <span style={{ fontSize: '0.9rem', color: isToday ? '#3b82f6' : 'var(--text-primary)', fontWeight: isToday ? 700 : 500 }}>{d.getDate()}</span>
                        {dayTasks.map(t => (
                           <Link to={`/leads/${t.lead_id}`} key={t.id} style={{ fontSize: '0.75rem', padding: '4px 6px', background: t.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: t.completed ? '#10b981' : '#3b82f6', borderRadius: 4, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span>{t.completed ? <CheckCircle size={10}/> : <Clock size={10}/>}</span> {t.title}
                           </Link>
                        ))}
                     </div>
                  );
               })}
            </div>
        </div>
      ) : (
      <div className="tasks-container glass-card" style={{ flex: 1, marginBottom: 0 }}>
         <div className="tasks-filters">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All Tasks</button>
            <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
            <button className={filter === 'overdue' ? 'active' : ''} onClick={() => setFilter('overdue')}>Overdue</button>
            <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
         </div>

         <div className="tasks-list">
            {filteredTasks.length === 0 ? (
               <div className="empty-state">No tasks found for this filter.</div>
            ) : (
               filteredTasks.map((t, i) => (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={t.id} 
                    className={`global-task-card ${t.completed ? 'completed' : new Date(t.due_date) < now ? 'overdue' : 'upcoming'}`}
                 >
                    <div className="task-left">
                       {!t.completed ? (
                          <button className="check-btn" onClick={() => handleCompleteTask(t.id)}>
                             <CheckCircle size={24} color="#64748b" />
                          </button>
                       ) : (
                          <CheckCircle size={24} color="#10b981" />
                       )}
                       
                       <div className="task-content">
                          <h4 style={{textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#64748b' : 'white'}}>
                             {t.title}
                          </h4>
                          <div className="task-meta">
                             <span className={`date-badge ${!t.completed && new Date(t.due_date) < now ? 'overdue' : ''}`}>
                                <Clock size={12}/> {new Date(t.due_date).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}
                             </span>
                             {t.lead_name && (
                                <Link to={`/leads/${t.lead_id}`} className="meta-link"><UserCircle size={12}/> {t.lead_name}</Link>
                             )}
                             {t.deal_title && (
                                <Link to={`/deals/${t.deal_id}`} className="meta-link deal"><Briefcase size={12}/> {t.deal_title}</Link>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="task-actions">
                       <button className="del-btn" onClick={() => handleDeleteTask(t.id)} title="Delete Task">
                          <Trash2 size={16}/>
                       </button>
                    </div>
                 </motion.div>
               ))
             )}
          </div>
       </div>
      )}

      <style>{`
        .tasks-page { display: flex; flex-direction: column; gap: 32px; height: 100%; }
        
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; flex-shrink: 0; }
        .stat-card { padding: 24px; display: flex; align-items: center; gap: 20px; border-radius: 16px; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-info h3 { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 1.8rem; font-weight: 700; color: white; display: block; margin-top: 4px; }

        .tasks-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; border-radius: 16px; min-height: 0; }
        
        .tasks-filters {
           display: flex; gap: 8px; padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); flex-shrink: 0;
        }
        .tasks-filters button {
           background: rgba(255,255,255,0.05); border: none; color: var(--text-secondary);
           padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
        }
        .tasks-filters button:hover { background: rgba(255,255,255,0.1); color: white; }
        .tasks-filters button.active { background: var(--primary-color); color: white; font-weight: 600; }

        .tasks-list { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        
        .global-task-card {
           display: flex; justify-content: space-between; align-items: center;
           background: rgba(0,0,0,0.2); padding: 16px 20px; border-radius: 12px;
           border: 1px solid rgba(255,255,255,0.05); border-left: 3px solid transparent;
        }
        .global-task-card.overdue { border-left-color: #ef4444; }
        .global-task-card.upcoming { border-left-color: #f59e0b; }
        .global-task-card.completed { border-left-color: #10b981; opacity: 0.7; }

        .task-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; }
        .check-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; margin-top: 2px; }
        .check-btn:hover svg { stroke: #10b981; }

        .task-content { display: flex; flex-direction: column; gap: 6px; }
        .task-content h4 { font-size: 1rem; font-weight: 500; }
        
        .task-meta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
        .date-badge { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
        .date-badge.overdue { color: #fca5a5; background: rgba(239,68,68,0.1); }
        
        .meta-link { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #3b82f6; text-decoration: none; padding: 2px 8px; border-radius: 4px; background: rgba(59,130,246,0.1); transition: background 0.2s; }
        .meta-link:hover { background: rgba(59,130,246,0.2); }
        .meta-link.deal { color: #8b5cf6; background: rgba(139,92,246,0.1); }
        .meta-link.deal:hover { background: rgba(139,92,246,0.2); }

        .task-actions { display: flex; align-items: center; gap: 8px; }
        .del-btn { background: rgba(239,68,68,0.1); border: none; color: #ef4444; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: all 0.2s; }
        .global-task-card:hover .del-btn { opacity: 1; }
        .del-btn:hover { background: #ef4444; color: white; }

        .empty-state { text-align: center; color: var(--text-secondary); padding: 40px; font-style: italic; }

        @media (max-width: 768px) {
           .stats-row { grid-template-columns: 1fr; }
           .tasks-filters { overflow-x: auto; }
           .tasks-filters button { white-space: nowrap; }
           .del-btn { opacity: 1; } /* Always show on touch */
        }
      `}</style>
    </div>
  );
};

export default Tasks;
