import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import '../index.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [data, setData] = useState<{
    agentPerformance: any[];
    pipelineFunnel: any[];
    revenueByMonth: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error("Failed to load reports", e);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Generating Reports...</div>;
  if (!data) return <div style={{ padding: '40px', color: '#ef4444' }}>Error loading reports.</div>;

  return (
    <div className="dash-container" style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', overflowY: 'auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp color="#3b82f6" /> Analytics Overview
        </h1>
        <p style={{ color: '#64748b', marginTop: '6px' }}>Performance metrics and agent statistics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Agent Performance Table/Cards */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#8b5cf6" /> Agent Leaderboard
          </h2>
          {data.agentPerformance.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text)', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Agent</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Leads Own</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Deals Won</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agentPerformance.map((u, i) => (
                    <tr key={u.email} style={{ borderBottom: i !== data.agentPerformance.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '14px 0', fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: '14px 0' }}>{u.total_leads}</td>
                      <td style={{ padding: '14px 0', color: '#10b981' }}>{u.deals_won || 0}</td>
                      <td style={{ padding: '14px 0', fontWeight: 600 }}>${(u.revenue_won || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ color: '#94a3b8', fontSize: '14px' }}>No agents found.</p>}
        </div>

        {/* Revenue Area Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
           <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#10b981" /> Monthly Revenue Closed
          </h2>
          <div style={{ height: '260px', minHeight: '260px' }}>
             {data.revenueByMonth.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                   <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                   <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>No completed deals yet.</div>
             )}
          </div>
        </div>

      </div>

      {/* Pipeline Funnel */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '30px' }}>
         <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#f59e0b" /> Pipeline Funnel Distribution
         </h2>
         <div style={{ height: '300px', minHeight: '300px' }}>
            {data.pipelineFunnel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.pipelineFunnel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                   <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                   <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={120} />
                   <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                   <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                     {data.pipelineFunnel.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Bar>
                 </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: '#94a3b8', fontSize: '14px' }}>No active deals in the pipeline.</p>}
         </div>
      </div>

    </div>
  );
}
