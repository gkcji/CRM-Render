import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Printer, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuoteGenerator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  // Proposal configuration states
  const [companyName, setCompanyName] = useState('Aura Enterprise Solutions');
  const [items, setItems] = useState([{ desc: 'Software License', qty: 1, price: 0 }]);
  const [taxRate, setTaxRate] = useState(0); // e.g. 18 for GST or 10 for VAT

  useEffect(() => {
    Promise.all([
      fetch(`/api/deals`).then(r => r.json()),
      fetch(`/api/products`).then(r => r.json())
    ]).then(([dResult, pResult]) => {
      const found = dResult.find((x: any) => x.id === Number(id));
      setDeal(found);
      if (found) {
        setItems([{ desc: found.title, qty: 1, price: Number(found.value) || 0 }]);
      }
      setProducts(pResult);
      setLoading(false);
    });
  }, [id]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  const handleAddProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    if (!pId) return;
    const prod = products.find(p => p.id === Number(pId));
    if (prod) {
      setItems([...items, { desc: prod.name, qty: 1, price: Number(prod.price) }]);
    }
    e.target.value = ''; // Reset select
  };

  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/deals/${id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('crm-token')}` },
        body: JSON.stringify({ items_json: items, total_value: total })
      });
      const data = await res.json();
      if (data.success) {
        setPublicUrl(data.url);
      } else {
        alert(data.error || 'Failed to generate link.');
      }
    } catch (e) {
      alert('Error generating secure link.');
    }
    setGenerating(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Loading Deal Data...</div>;
  if (!deal) return <div style={{ padding: '40px', color: '#ef4444' }}>Deal not found.</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      
      {/* Configuration Header (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/deals')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
           <select className="input-field" onChange={handleAddProduct} style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px' }}>
             <option value="">+ Add Product from Catalog</option>
             {products.map(p => (
               <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
             ))}
           </select>
           <button onClick={() => setItems([...items, { desc: 'Custom Item', qty: 1, price: 0 }])} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
             + Add Custom Item
           </button>
           <button onClick={handlePrint} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Printer size={16} /> Print / Save as PDF
           </button>
           {publicUrl ? (
             <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
               Link Generated: <a href={publicUrl} target="_blank" rel="noreferrer" style={{ color: '#059669', textDecoration: 'underline' }}>View Public URL</a>
             </div>
           ) : (
             <button onClick={handleGenerateLink} disabled={generating} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: generating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
               <Send size={16} /> {generating ? 'Generating...' : 'Get Final Public Link'}
             </button>
           )}
        </div>
      </div>

      {/* A4 Document Canvas */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="quote-document" style={{ background: '#ffffff', padding: '60px', borderRadius: '4px', minHeight: '1056px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', color: '#0f172a' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '30px', marginBottom: '40px' }}>
             <div>
                <h1 style={{ margin: 0, fontSize: '28px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={28}/> PROPOSAL</h1>
                <p style={{ margin: '10px 0 0 0', color: '#64748b', fontSize: '14px' }}>Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Quote #: QTE-{deal.id}-{(Math.random()*10000).toFixed(0)}</p>
             </div>
             <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' }}>{companyName}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>123 Enterprise Suite<br/>Business District, NY 10001<br/>billing@aura-crm.local</p>
             </div>
         </div>

         <div style={{ display: 'flex', marginBottom: '50px' }}>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Prepared For</h4>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{deal.lead_name || 'Client Name'}</p>
                <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{deal.lead_company || 'Company TBD'}</p>
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Overview</h4>
                <p style={{ margin: 0, fontWeight: 500 }}>{deal.title}</p>
                <p style={{ margin: '4px 0 0 0', color: '#475569' }}>Expected Completion: {deal.expected_close ? new Date(deal.expected_close).toLocaleDateString() : 'TBD'}</p>
            </div>
         </div>

         {/* Line Items */}
         <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
             <thead>
                 <tr style={{ borderBottom: '2px solid #0f172a' }}>
                     <th style={{ textAlign: 'left', padding: '12px', color: '#0f172a' }}>Description</th>
                     <th style={{ textAlign: 'center', padding: '12px', color: '#0f172a', width: '80px' }}>Qty</th>
                     <th style={{ textAlign: 'right', padding: '12px', color: '#0f172a', width: '120px' }}>Unit Price</th>
                     <th style={{ textAlign: 'right', padding: '12px', color: '#0f172a', width: '120px' }}>Total</th>
                     <th className="no-print" style={{ width: '40px' }}></th>
                 </tr>
             </thead>
             <tbody>
                 {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px 12px', color: '#334155' }}>
                            <input value={item.desc} onChange={e => {
                                const n = [...items]; n[idx].desc = e.target.value; setItems(n);
                            }} style={{ width: '100%', border: 'all', background: 'transparent', outline: 'none', borderBottom: '1px dashed #cbd5e1' }} className="no-print-border"/>
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center', color: '#334155' }}>
                            <input type="number" value={item.qty} onChange={e => {
                                const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n);
                            }} style={{ width: '60px', textAlign: 'center', border: 'all', background: 'transparent', outline: 'none', borderBottom: '1px dashed #cbd5e1' }} />
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'right', color: '#334155' }}>
                            <input type="number" value={item.price} onChange={e => {
                                const n = [...items]; n[idx].price = Number(e.target.value); setItems(n);
                            }} style={{ width: '80px', textAlign: 'right', border: 'all', background: 'transparent', outline: 'none', borderBottom: '1px dashed #cbd5e1' }} />
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500, color: '#0f172a' }}>₹{(item.qty * item.price).toLocaleString('en-IN')}</td>
                        <td className="no-print" style={{ textAlign: 'center' }}>
                            <button onClick={() => {
                                const n = items.filter((_, i) => i !== idx);
                                setItems(n.length === 0 ? [{ desc: 'Custom Item', qty: 1, price: 0 }] : n);
                            }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </td>
                    </tr>
                 ))}
             </tbody>
         </table>
         
         {/* Totals */}
         <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <div style={{ width: '300px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', color: '#475569' }}>
                     <span>Subtotal</span>
                     <span>${subtotal.toLocaleString()}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', color: '#475569' }}>
                     <span>Tax Rate (%) <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: '1px solid #cbd5e1' }} className="no-print-border" /></span>
                     <span>${tax.toLocaleString()}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 12px', background: '#f8fafc', borderRaduis: '8px', marginTop: '10px', borderTop: '2px solid #3b82f6' }}>
                     <span style={{ fontWeight: 600, fontSize: '18px' }}>Total Due</span>
                     <span style={{ fontWeight: 700, fontSize: '20px', color: '#3b82f6' }}>${total.toLocaleString()}</span>
                 </div>
             </div>
         </div>

         <style>
             {`
                @media print {
                   body * { visibility: hidden; }
                   .quote-document, .quote-document * { visibility: visible; }
                   .quote-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; margin: 0; padding: 0; }
                   .no-print { display: none !important; }
                   .no-print-border { border: none !important; }
                   .sb-rail { display: none !important; }
                   input { border: none !important; color: inherit; font-family: inherit; font-size: inherit; appearance: none; pointer-events: none; }
                }
             `}
         </style>
      </motion.div>
    </div>
  );
}
