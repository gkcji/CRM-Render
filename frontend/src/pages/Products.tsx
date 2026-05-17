import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products({ authUser }: { authUser?: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', description: '', price: '', billing_freq: 'One-Time'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const resp = await axios.get(`/api/products`);
      setProducts(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/products/${editingId}`, newProduct);
      } else {
        await axios.post(`/api/products`, newProduct);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewProduct({ name: '', sku: '', description: '', price: '', billing_freq: 'One-Time' });
      fetchProducts();
    } catch (err: any) {
      alert("Failed to save product: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (prod: any) => {
    setNewProduct({
      name: prod.name,
      sku: prod.sku || '',
      description: prod.description || '',
      price: prod.price || '',
      billing_freq: prod.billing_freq || 'One-Time'
    });
    setEditingId(prod.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="leads-page">
      <div className="leads-header-card glass-card">
        <div className="unified-top-bar">
          <div className="utb-left">
            <h1>Products & Services</h1>
            <div className="v-divider" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
               Catalog your standard offerings for easy quoting.
            </p>
          </div>
          <div className="utb-right">
            <div className="search-wrap">
              <Search size={16} className="search-icon" />
              <input 
                 type="text" 
                 placeholder="Search by name or SKU..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {authUser?.role === 'Admin' && (
               <button className="btn-primary" onClick={() => {
                  setEditingId(null);
                  setNewProduct({ name: '', sku: '', description: '', price: '', billing_freq: 'One-Time' });
                  setIsModalOpen(true);
               }}>
                 <Plus size={16} /> Add Product
               </button>
            )}
          </div>
        </div>
      </div>

      <div className="leads-content glass-card">
         {loading ? (
             <p style={{ padding: 20 }}>Loading catalog...</p>
         ) : filtered.length === 0 ? (
             <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Package size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                <p>No products found in the catalog.</p>
             </div>
         ) : (
             <div className="table-responsive">
                <table className="leads-table">
                   <thead>
                     <tr>
                       <th>Product Name</th>
                       <th>SKU / Code</th>
                       <th>Description</th>
                       <th>Price (₹)</th>
                       <th>Billing</th>
                       {authUser?.role === 'Admin' && <th style={{ textAlign: 'right' }}>Actions</th>}
                     </tr>
                   </thead>
                   <tbody>
                     {filtered.map(p => (
                        <tr key={p.id}>
                           <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</td>
                           <td style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>{p.sku || '—'}</td>
                           <td style={{ color: 'var(--text-secondary)' }}>{p.description || '—'}</td>
                           <td style={{ fontWeight: 600, color: '#10b981' }}>{Number(p.price).toLocaleString('en-IN')}</td>
                           <td><span className="leads-tag">{p.billing_freq}</span></td>
                           {authUser?.role === 'Admin' && (
                               <td style={{ textAlign: 'right' }}>
                                 <button className="icon-btn" onClick={() => handleEdit(p)} style={{ marginRight: 8, color: '#60a5fa' }}><Edit3 size={16} /></button>
                                 <button className="icon-btn" onClick={() => handleDelete(p.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                               </td>
                           )}
                        </tr>
                     ))}
                   </tbody>
                </table>
             </div>
         )}
      </div>

      <AnimatePresence>
         {isModalOpen && (
             <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <motion.div className="modal-content glass-card" initial={{ y: 50 }} animate={{ y: 0 }}>
                  <div className="modal-header">
                     <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
                     <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                  </div>
                  <form className="modal-body" onSubmit={handleSave}>
                     <div className="form-group">
                        <label>Product / Service Name *</label>
                        <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. SEO Retainer" />
                     </div>
                     <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                           <label>SKU / Internal Code</label>
                           <input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="e.g. SEO-001" />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                           <label>Base Price Option (₹)</label>
                           <input type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="0.00" />
                        </div>
                     </div>
                     <div className="form-group">
                        <label>Billing Frequency</label>
                        <select value={newProduct.billing_freq} onChange={e => setNewProduct({...newProduct, billing_freq: e.target.value})}>
                           <option value="One-Time">One-Time</option>
                           <option value="Monthly">Monthly</option>
                           <option value="Quarterly">Quarterly</option>
                           <option value="Annually">Annually</option>
                        </select>
                     </div>
                     <div className="form-group">
                        <label>Description (shown on quotes)</label>
                        <textarea rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Brief description of the deliverables..."></textarea>
                     </div>
                     <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Product</button>
                     </div>
                  </form>
               </motion.div>
             </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
