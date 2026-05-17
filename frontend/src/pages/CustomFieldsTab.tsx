import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sliders } from 'lucide-react';
import axios from 'axios';

export default function CustomFieldsTab() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newField, setNewField] = useState({
    label: '',
    field_type: 'text',
    entity_type: 'lead',
    options: '',
    required: false
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const resp = await axios.get(`/api/custom-fields`);
      setFields(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/custom-fields`, newField);
      setShowAdd(false);
      setNewField({ label: '', field_type: 'text', entity_type: 'lead', options: '', required: false });
      fetchFields();
    } catch (err: any) {
      alert("Failed to add field: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteField = async (id: number) => {
    if (!window.confirm("Delete this custom field? All data for this field across all records will be permanently lost!")) return;
    try {
      await axios.delete(`/api/custom-fields/${id}`);
      fetchFields();
    } catch (err: any) {
      alert("Failed to delete field: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="setting-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2>Dynamic Custom Fields</h2>
          <p className="sub-text">Define custom attributes to collect specific data for your Leads and Deals.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} style={{marginRight: 6}}/> New Field
        </button>
      </div>

      {loading ? (
        <p>Loading custom fields...</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {fields.map(field => (
            <div key={field.id} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {field.label}
                  {field.required === 1 && <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>Required</span>}
                </h4>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span><span style={{color: '#64748b'}}>Entity:</span> {field.entity_type.charAt(0).toUpperCase() + field.entity_type.slice(1)}</span>
                  <span><span style={{color: '#64748b'}}>Type:</span> {field.field_type}</span>
                  {field.options && <span><span style={{color: '#64748b'}}>Options:</span> {field.options}</span>}
                  <span><span style={{color: '#64748b'}}>Key:</span> {field.field_key}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => handleDeleteField(field.id)} style={{ color: '#ef4444', padding: '8px', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
             <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
               <Sliders size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
               <p style={{ margin: 0 }}>No custom fields defined.</p>
             </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>Add Custom Field</h2>
              <button className="close-btn" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleAddField}>
              <div className="form-group">
                <label>Field Label</label>
                <input required type="text" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} placeholder="e.g. GST Number" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={newField.entity_type} onChange={e => setNewField({...newField, entity_type: e.target.value})}>
                    <option value="lead">Lead / Contact</option>
                    <option value="deal">Deal / Opportunity</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Field Type</label>
                  <select value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})}>
                    <option value="text">Text (Short)</option>
                    <option value="textarea">Textarea (Long)</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
              </div>
              
              {newField.field_type === 'select' && (
                <div className="form-group">
                  <label>Dropdown Options (comma separated)</label>
                  <input required type="text" value={newField.options} onChange={e => setNewField({...newField, options: e.target.value})} placeholder="e.g. Option A, Option B, Option C" />
                </div>
              )}
              
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" id="required-cb" checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} style={{ width: 'auto' }} />
                <label htmlFor="required-cb" style={{ cursor: 'pointer' }}>Make this field Required</label>
              </div>

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Field</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
