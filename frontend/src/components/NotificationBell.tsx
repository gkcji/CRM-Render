import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, BellOff, Info, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const typeIcon: Record<string, any> = {
  info:    <Info size={14} color="#3b82f6" />,
  warning: <AlertTriangle size={14} color="#f59e0b" />,
  success: <CheckCircle2 size={14} color="#10b981" />,
  deal:    <Zap size={14} color="#8b5cf6" />,
};

const typeColor: Record<string, string> = {
  info:    'rgba(59,130,246,0.12)',
  warning: 'rgba(245,158,11,0.12)',
  success: 'rgba(16,185,129,0.12)',
  deal:    'rgba(139,92,246,0.12)',
};

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const resp = await axios.get(`/api/notifications`);
      setNotifs(resp.data);
    } catch (e) { /* silent */ }
  };

  // Poll every 15 seconds for new notifications
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.is_read).length;

  const markRead = async (id: number) => {
    await axios.put(`/api/notifications/${id}/read`);
    fetchNotifs();
  };

  const markAllRead = async () => {
    await axios.put(`/api/notifications/read-all`);
    fetchNotifs();
  };

  const deleteNotif = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await axios.delete(`/api/notifications/${id}`);
    fetchNotifs();
  };

  const handleClick = async (n: any) => {
    if (!n.is_read) await markRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const timeAgo = (ts: string) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Trigger */}
      <button
        id="notif-bell-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: open ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: open ? '#3b82f6' : 'var(--text-secondary)',
          transition: 'all 0.2s',
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: '#fff',
            fontSize: '0.65rem', fontWeight: 700,
            minWidth: 16, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', border: '2px solid var(--bg-color)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 360, zIndex: 9999,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} color="#3b82f6" />
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Notifications</strong>
                {unread > 0 && (
                  <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>{unread} new</span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                  <BellOff size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '0.9rem' }}>All caught up! No notifications.</p>
                </div>
              ) : (
                notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 18px',
                      cursor: n.link ? 'pointer' : 'default',
                      background: n.is_read ? 'transparent' : 'rgba(59,130,246,0.04)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s',
                      alignItems: 'flex-start',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(59,130,246,0.04)')}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: typeColor[n.type] || typeColor.info,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {typeIcon[n.type] || typeIcon.info}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: n.is_read ? 400 : 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{n.title}</p>
                        <span style={{ fontSize: '0.72rem', color: '#475569', flexShrink: 0, marginLeft: 8 }}>{timeAgo(n.created_at)}</span>
                      </div>
                      {n.body && <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={e => deleteNotif(e, n.id)}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', flexShrink: 0, padding: 2, opacity: 0.5 }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
