import { useEffect, useState } from 'react';
import { Shield, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const actionColors: Record<string, string> = {
  'LOGIN': '#3b82f6',
  'CREATE': '#10b981',
  'UPDATE': '#f59e0b',
  'DELETE': '#ef4444',
  'STAGE_CHANGE': '#8b5cf6',
  'ASSIGN': '#ec4899',
};

const entityEmoji: Record<string, string> = {
  'lead': '👤',
  'deal': '💼',
  'task': '✅',
  'user': '🔑',
  'system': '⚙️',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('All');

  useEffect(() => {
    fetch(`/api/audit-logs`)
      .then(r => r.json())
      .then(d => {
        setLogs(Array.isArray(d) ? d : []);
        setFiltered(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = logs;
    if (filterAction !== 'All') result = result.filter(l => l.action === filterAction);
    if (search) result = result.filter(l =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, filterAction, logs]);

  const uniqueActions = ['All', ...Array.from(new Set(logs.map(l => l.action)))];

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Shield size={24} color="#06b6d4" /> Immutable Audit Log
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
          Every action in the CRM is recorded here. This log cannot be modified.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="#94a3b8" />
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            style={{ padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' }}>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Events', value: logs.length, color: '#3b82f6' },
          { label: 'Showing', value: filtered.length, color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '14px 20px', display: 'flex', gap: '12px', alignItems: 'center', minWidth: '140px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Log Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading audit trail...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Shield size={40} color="#334155" style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ margin: 0 }}>No audit events recorded yet.</p>
            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Events will appear here once agents start using the CRM.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--text)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: '#64748b' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 500 }}>When</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 500 }}>Action</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 500 }}>Entity</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 500 }}>By Agent</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 500 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: (actionColors[log.action] || '#64748b') + '22',
                        color: actionColors[log.action] || '#94a3b8',
                        padding: '3px 10px', borderRadius: '99px', fontWeight: 600, fontSize: '11px'
                      }}>
                        {log.action || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {entityEmoji[log.entity_type?.toLowerCase()] || '📋'}
                        <span style={{ textTransform: 'capitalize' }}>{log.entity_type}</span>
                        {log.entity_id && <span style={{ color: '#64748b' }}>#{log.entity_id}</span>}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{log.user_name || 'System'}</div>
                      {log.user_role && <div style={{ color: '#64748b', fontSize: '11px' }}>{log.user_role}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', maxWidth: '300px' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {log.details || '—'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        table { table-layout: auto; }
        thead tr { position: sticky; top: 0; background: var(--surface); }
      `}</style>
    </div>
  );
}
