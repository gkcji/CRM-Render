import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings2, Save } from 'lucide-react';

interface CustomFieldsBlockProps {
  entityType: 'lead' | 'deal';
  entityId: number;
}

export default function CustomFieldsBlock({ entityType, entityId }: CustomFieldsBlockProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFieldsAndValues();
  }, [entityType, entityId]);

  const fetchFieldsAndValues = async () => {
    try {
      const resp = await axios.get(`/api/custom-field-values/${entityType}/${entityId}`);
      setFields(resp.data);
      const valMap: Record<number, string> = {};
      resp.data.forEach((f: any) => {
        valMap[f.id] = f.value || '';
      });
      setValues(valMap);
    } catch (err) {
      console.error("Failed to load custom fields", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
    for (const f of fields) {
      if (f.required === 1 && !values[f.id]) {
        alert(`${f.label} is a required field.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await axios.post(`/api/custom-field-values/${entityType}/${entityId}`, {
        values
      });
      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to save custom fields: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;
  if (fields.length === 0) return null; // Hide block entirely if no custom fields are defined for this entity type

  return (
    <div className="dd-block glass-card custom-fields-block" style={{ marginTop: '20px' }}>
      <div className="dd-block-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Settings2 size={16} color="#60a5fa" /> Custom Fields
        </h3>
        {isEditing ? (
          <button className="icon-btn" onClick={handleSave} disabled={isSaving} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: 'none' }}>
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
          </button>
        ) : (
          <button className="icon-btn" onClick={() => setIsEditing(true)} style={{ color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', background: 'transparent', border: 'none' }}>
            Edit Fields
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {fields.map(field => {
           let InputComponent: any = <input type="text" />;
           if (field.field_type === 'textarea') {
             InputComponent = <textarea rows={3} />;
           } else if (field.field_type === 'select') {
             const options = field.options ? field.options.split(',').map((o: string) => o.trim()) : [];
             InputComponent = (
                <select>
                   <option value="">- Select -</option>
                   {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
             );
           } else if (field.field_type === 'date') {
             InputComponent = <input type="date" />;
           } else if (field.field_type === 'number') {
             InputComponent = <input type="number" />;
           }

           const handleChange = (e: any) => {
             setValues({...values, [field.id]: e.target.value});
           };

           return (
             <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{field.label} {field.required === 1 && <span style={{color: '#ef4444'}}>*</span>}</span>
                </label>
                {isEditing ? (
                  React.cloneElement(InputComponent, {
                    value: values[field.id] || '',
                    onChange: handleChange,
                    style: {
                       width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                       borderRadius: '6px', color: 'var(--text-color)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
                    }
                  })
                ) : (
                  <div style={{ fontSize: '0.95rem', color: values[field.id] ? 'var(--text-color)' : '#475569', padding: '4px 0' }}>
                    {values[field.id] || '—'}
                  </div>
                )}
             </div>
           );
        })}
      </div>
    </div>
  );
}
