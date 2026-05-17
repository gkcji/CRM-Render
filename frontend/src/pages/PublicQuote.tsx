import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function PublicQuote() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/quote/${token}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
           setData(d);
           if(d.deal?.quote_status === 'Accepted') setAccepted(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error fetching proposal.");
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/quote/${token}/accept`, { method: 'POST' });
      const d = await res.json();
      if (d.success) setAccepted(true);
      else alert(d.error || 'Failed to accept quote');
    } catch (e) {
      alert('Network error accepting quote');
    }
    setAccepting(false);
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#64748b' }}>Loading proposal...</div>;
  if (error) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#ef4444', fontWeight: 600 }}>{error}</div>;

  const { deal, lead } = data;
  let items = [];
  try { items = JSON.parse(deal.quote_items || '[]'); } catch(e){}

  const subtotal = items.reduce((sum: number, it: any) => sum + (it.price * it.qty), 0);
  const tax = subtotal * 0.18; // assuming 18% standard for demo
  const total = subtotal + tax;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", sans-serif', background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)', display: 'flex', justifyContent: 'center' }}>
      <motion.div 
         initial={{ y: 30, opacity: 0 }} 
         animate={{ y: 0, opacity: 1 }} 
         transition={{ duration: 0.5 }}
         style={{ width: '100%', maxWidth: '800px', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e2e8f0' }}
      >
         {/* HEADER */}
         <div style={{ background: '#0f172a', padding: '40px 50px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={24} color="#38bdf8"/> PROPOSAL
               </h1>
               <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>Ref: QTE-{deal.id}-{token?.slice(0,6).toUpperCase()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
               <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>Aura Enterprise Solutions</h3>
               <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '13px', lineHeight: 1.4 }}>123 Tech Park, Innovation Way<br/>billing@aura-crm.local</p>
            </div>
         </div>

         {/* ABOUT CLIENT */}
         <div style={{ padding: '40px 50px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
            <div>
               <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Prepared For</p>
               <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{lead.name}</h2>
               <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#475569' }}>{lead.company || 'Our Valued Client'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
               <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</p>
               {accepted ? (
                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '30px', fontSize: '13px', fontWeight: 700 }}>
                   <CheckCircle size={14} /> ACCEPTED
                 </span>
               ) : (
                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: '30px', fontSize: '13px', fontWeight: 700 }}>
                   <Clock size={14} /> PENDING APPROVAL
                 </span>
               )}
            </div>
         </div>

         {/* ITEMS */}
         <div style={{ padding: '40px 50px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#0f172a' }}>Investment Preview</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
               <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                     <th style={{ padding: '14px', textAlign: 'left', borderRadius: '8px 0 0 8px', fontWeight: 600 }}>Item Description</th>
                     <th style={{ padding: '14px', textAlign: 'center', fontWeight: 600 }}>Quantity</th>
                     <th style={{ padding: '14px', textAlign: 'right', fontWeight: 600 }}>Price</th>
                     <th style={{ padding: '14px', textAlign: 'right', borderRadius: '0 8px 8px 0', fontWeight: 600 }}>Line Total</th>
                  </tr>
               </thead>
               <tbody>
                  {items.map((it: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                       <td style={{ padding: '20px 14px', fontWeight: 500, color: '#334155' }}>{it.desc}</td>
                       <td style={{ padding: '20px 14px', textAlign: 'center', color: '#475569' }}>{it.qty}</td>
                       <td style={{ padding: '20px 14px', textAlign: 'right', color: '#475569' }}>
                           ₹{Number(it.price).toLocaleString('en-IN')}
                       </td>
                       <td style={{ padding: '20px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                           ₹{(it.price * it.qty).toLocaleString('en-IN')}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>

            {/* TOTALS */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
               <div style={{ width: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', color: '#64748b', fontSize: '14px' }}>
                     <span>Subtotal</span>
                     <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
                     <span>Taxes (18%)</span>
                     <span>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0 0', color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>
                     <span>Total Due</span>
                     <span style={{ color: '#3b82f6' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* ACTION FOOTER */}
         <div style={{ background: '#f8fafc', padding: '40px 50px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
            {accepted ? (
              <div style={{ textAlign: 'center' }}>
                 <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                 <h2 style={{ margin: 0, color: '#064e3b', fontSize: '22px' }}>Quote Accepted!</h2>
                 <p style={{ margin: '10px 0 0', color: '#475569' }}>Thank you for your business. We will be in touch shortly with the next steps.</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', width: '100%' }}>
                 <p style={{ margin: '0 0 24px', color: '#475569', fontSize: '15px' }}>
                    By clicking to accept this quote, you agree to the standard terms of service.
                 </p>
                 <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAccept}
                    disabled={accepting}
                    style={{ 
                       background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                       color: '#fff', 
                       border: 'none', 
                       padding: '16px 40px', 
                       borderRadius: '100px', 
                       fontSize: '18px', 
                       fontWeight: 700, 
                       cursor: accepting ? 'wait' : 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '12px',
                       margin: '0 auto',
                       boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
                    }}
                 >
                    {accepting ? 'Processing...' : 'Accept Quote & Approve'} <ArrowRight size={20} />
                 </motion.button>
              </div>
            )}
         </div>

      </motion.div>
    </div>
  );
}
