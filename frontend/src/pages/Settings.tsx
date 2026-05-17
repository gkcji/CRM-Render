import { UserCircle, HardDrive, Bell, Shield, Users as UsersIcon, Plus, Trash2, Sliders, Mail, Edit3 } from 'lucide-react';
import CustomFieldsTab from './CustomFieldsTab';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = ({ authUser }: { authUser?: any }) => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Agent' });

  // Email Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTpl, setEditingTpl] = useState<any>(null);
  const [tplForm, setTplForm] = useState({ name: '', subject: '', body: '' });
  const [showTplForm, setShowTplForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'Team' && authUser?.role === 'Admin') fetchUsers();
    if (activeTab === 'EmailTemplates') fetchTemplates();
  }, [activeTab, authUser]);

  const fetchTemplates = async () => {
    try {
      const resp = await axios.get(`/api/email-templates`);
      setTemplates(resp.data);
    } catch (e) { console.error(e); }
  };

  const handleSaveTemplate = async (e: any) => {
    e.preventDefault();
    try {
      if (editingTpl) {
        await axios.put(`/api/email-templates/${editingTpl.id}`, tplForm);
      } else {
        await axios.post(`/api/email-templates`, tplForm);
      }
      setShowTplForm(false);
      setEditingTpl(null);
      setTplForm({ name: '', subject: '', body: '' });
      fetchTemplates();
    } catch (err: any) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await axios.delete(`/api/email-templates/${id}`);
      fetchTemplates();
    } catch (e) { alert('Delete failed'); }
  };

  const fetchUsers = async () => {
    try {
      const resp = await axios.get(`/api/users`);
      setUsers(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`/api/users`, newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'Agent' });
      fetchUsers();
    } catch (err: any) {
      alert("Failed to add user: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to delete user: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="settings-page">
      <header className="page-header">
         <div className="header-left">
           <h1>System Settings</h1>
           <p>Manage your account, preferences, and CRM integrations.</p>
         </div>
      </header>

      <div className="settings-container">
         <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="settings-sidebar glass-card"
         >
            <ul className="settings-nav">
               <li className={activeTab === 'Profile' ? 'active' : ''} onClick={() => setActiveTab('Profile')}><UserCircle size={18}/> Profile Details</li>
               <li className={activeTab === 'Security' ? 'active' : ''} onClick={() => setActiveTab('Security')}><Shield size={18}/> Security & Privacy</li>
               {authUser?.role === 'Admin' && (
                 <>
                   <li className={activeTab === 'Team' ? 'active' : ''} onClick={() => setActiveTab('Team')}><UsersIcon size={18}/> Team Members</li>
                   <li className={activeTab === 'CustomFields' ? 'active' : ''} onClick={() => setActiveTab('CustomFields')}><Sliders size={18}/> Custom Fields</li>
                   <li className={activeTab === 'EmailTemplates' ? 'active' : ''} onClick={() => setActiveTab('EmailTemplates')}><Mail size={18}/> Email Templates</li>
                 </>
               )}
               <li className={activeTab === 'Notifications' ? 'active' : ''} onClick={() => setActiveTab('Notifications')}><Bell size={18}/> Notifications</li>
               <li className={activeTab === 'Integrations' ? 'active' : ''} onClick={() => setActiveTab('Integrations')}><HardDrive size={18}/> Integrations</li>
            </ul>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="settings-content glass-card"
         >
            {activeTab === 'Profile' && (
              <div className="setting-section">
                 <h2>Personal Information</h2>
                 <p className="sub-text">Update your basic profile and contact details.</p>
                 
                 <div className="form-grid">
                    <div className="form-group">
                       <label>Full Name</label>
                       <input type="text" defaultValue={authUser?.name || 'Admin User'} />
                    </div>
                    <div className="form-group">
                       <label>Email Address</label>
                       <input type="email" defaultValue={authUser?.email || 'admin@example.com'} disabled />
                    </div>
                    <div className="form-group">
                       <label>Phone Number</label>
                       <input type="text" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="form-group">
                       <label>Role</label>
                       <input type="text" defaultValue={authUser?.role || 'Admin'} disabled style={{background: 'var(--bg-color)'}} />
                    </div>
                 </div>
                 <button className="btn-primary" style={{marginTop: 20}}>Save Changes</button>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="setting-section">
                 <h2>Password & Security</h2>
                 <p className="sub-text">Ensure your account is using a long, random password to stay secure.</p>
                 
                 <div className="form-grid">
                    <div className="form-group">
                       <label>Current Password</label>
                       <input type="password" placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                       <label>New Password</label>
                       <input type="password" placeholder="••••••••" />
                    </div>
                 </div>
                 <button className="btn-primary" style={{marginTop: 20}}>Update Password</button>

                 <hr className="divider"/>

                 <div className="setting-section danger-zone">
                    <h2>Danger Zone</h2>
                    <p className="sub-text" style={{color: '#f87171'}}>Irreversible actions that affect your entire account.</p>
                    
                    <div className="danger-actions">
                        <div className="action-row">
                           <div className="action-text">
                              <h4>Delete Account</h4>
                              <p>Permanently remove your account and all data.</p>
                           </div>
                           <button className="del-btn-large">Delete Account</button>
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'Team' && authUser?.role === 'Admin' && (
              <div className="setting-section">
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h2>Team Members</h2>
                      <p className="sub-text">Manage your Sales Agents and Administrators.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddUser(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={16} /> Add User
                    </button>
                 </div>
                 
                 <div className="team-list" style={{ marginTop: 24, overflowX: 'auto' }}>
                   <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '500px' }}>
                     <thead>
                       <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                         <th style={{ padding: '12px 10px' }}>Name</th>
                         <th style={{ padding: '12px 10px' }}>Email</th>
                         <th style={{ padding: '12px 10px' }}>Role</th>
                         <th style={{ padding: '12px 10px' }}>Joined</th>
                         <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {users.map(u => (
                         <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                           <td style={{ padding: '16px 10px', fontWeight: 500, color: 'var(--text-color)' }}>{u.name}</td>
                           <td style={{ padding: '16px 10px', color: 'var(--text-secondary)' }}>{u.email}</td>
                           <td style={{ padding: '16px 10px' }}>
                             <span className="kb-badge" style={{ background: u.role === 'Admin' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: u.role === 'Admin' ? '#3b82f6' : '#10b981' }}>
                               {u.role}
                             </span>
                           </td>
                           <td style={{ padding: '16px 10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                           <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                             {u.id !== authUser.id && (
                               <button className="action-btn" title="Delete User" style={{ color: '#ef4444' }} onClick={() => handleDeleteUser(u.id)}>
                                 <Trash2 size={16} />
                               </button>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="setting-section">
                 <h2>Notification Preferences</h2>
                 <p className="sub-text">Choose how and when you want to be alerted by the CRM.</p>
                 
                 <div className="notification-list">
                    <div className="notif-item">
                       <div className="notif-info">
                          <h4>New Lead Assigned</h4>
                          <p>Get notified when an Admin assigns a new lead to you.</p>
                       </div>
                       <label className="switch">
                         <input type="checkbox" defaultChecked />
                         <span className="slider round"></span>
                       </label>
                    </div>
                    <hr className="divider" style={{ margin: '16px 0' }} />
                    <div className="notif-item">
                       <div className="notif-info">
                          <h4>Task Reminders (Upcoming)</h4>
                          <p>Alerts for calls or meetings due within the next hour.</p>
                       </div>
                       <label className="switch">
                         <input type="checkbox" defaultChecked />
                         <span className="slider round"></span>
                       </label>
                    </div>
                    <hr className="divider" style={{ margin: '16px 0' }} />
                    <div className="notif-item">
                       <div className="notif-info">
                          <h4>Deal Progress</h4>
                          <p>Updates when a deal is marked as Won or Lost.</p>
                       </div>
                       <label className="switch">
                         <input type="checkbox" />
                         <span className="slider round"></span>
                       </label>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'EmailTemplates' && authUser?.role === 'Admin' && (
              <div className="setting-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2>Email Templates</h2>
                    <p className="sub-text">Reusable snippets for lead outreach. Use <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>{'{name}'}</code>, <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3 }}>{'{company}'}</code> as smart placeholders.</p>
                  </div>
                  <button className="btn-primary" onClick={() => { setEditingTpl(null); setTplForm({ name: '', subject: '', body: '' }); setShowTplForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> New Template
                  </button>
                </div>

                <AnimatePresence>
                  {showTplForm && (
                    <motion.form
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleSaveTemplate}
                      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                      <div className="form-group">
                        <label>Template Name (internal reference)</label>
                        <input required type="text" placeholder="e.g. Initial Outreach" value={tplForm.name} onChange={e => setTplForm({...tplForm, name: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Subject Line</label>
                        <input required type="text" placeholder="e.g. Following up on our conversation, {name}" value={tplForm.subject} onChange={e => setTplForm({...tplForm, subject: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Body</label>
                        <textarea required rows={6} placeholder={"Hi {name},\n\nHope this finds you well..."} value={tplForm.body} onChange={e => setTplForm({...tplForm, body: e.target.value})} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-cancel" onClick={() => { setShowTplForm(false); setEditingTpl(null); }}>Cancel</button>
                        <button type="submit" className="btn-primary">{editingTpl ? 'Update Template' : 'Save Template'}</button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {templates.length === 0 && !showTplForm ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
                    <Mail size={40} style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: 12 }}>No templates yet. Click <strong>New Template</strong> to get started.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {templates.map((t: any) => (
                      <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Mail size={14} color="#3b82f6" />
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{t.name}</strong>
                          </div>
                          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '2px 0' }}>Subject: {t.subject}</p>
                          <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4, whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.body}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button className="icon-btn" style={{ color: '#60a5fa' }} onClick={() => { setEditingTpl(t); setTplForm({ name: t.name, subject: t.subject, body: t.body }); setShowTplForm(true); }}><Edit3 size={15} /></button>
                          <button className="icon-btn" style={{ color: '#ef4444' }} onClick={() => handleDeleteTemplate(t.id)}><Trash2 size={15} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Integrations' && (
              <div className="setting-section">
                 <h2>Connected Integrations</h2>
                 <p className="sub-text">Manage external services connected to your workspace.</p>
                 
                 <div className="integrations-grid">
                    {/* Google Drive Card */}
                    <div className="integration-card">
                       <div className="int-header">
                          <div className="int-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                             <HardDrive size={24} />
                          </div>
                          <span className="status-badge connected">Connected</span>
                       </div>
                       <div className="int-body">
                          <h4>Google Drive Cloud</h4>
                          <p>Automated weekly database backups and file attachments.</p>
                       </div>
                       <div className="int-footer">
                          <button className="btn-cancel" style={{ width: '100%' }}>Manage</button>
                       </div>
                    </div>

                    {/* WhatsApp API Card */}
                    <div className="integration-card">
                       <div className="int-header">
                          <div className="int-icon" style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25d366' }}>
                             <Bell size={24} /> {/* Placeholder for MessageCircle if not imported */}
                          </div>
                          <span className="status-badge disconnected">Not Configured</span>
                       </div>
                       <div className="int-body">
                          <h4>WhatsApp Cloud API</h4>
                          <p>Send and receive messages directly inside the CRM inbox.</p>
                       </div>
                       <div className="int-footer">
                          <button className="btn-primary" style={{ width: '100%', padding: '10px' }}>Setup Webhook</button>
                       </div>
                    </div>

                    {/* Meta Ads Card */}
                    <div className="integration-card">
                       <div className="int-header">
                          <div className="int-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                             <UsersIcon size={24} />
                          </div>
                          <span className="status-badge disconnected">Not Configured</span>
                       </div>
                       <div className="int-body">
                          <h4>Meta Lead Ads</h4>
                          <p>Automatically ingest fresh leads directly from your Facebook campaigns.</p>
                       </div>
                       <div className="int-footer">
                          <button className="btn-primary" style={{ width: '100%', padding: '10px' }}>Connect Page</button>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'CustomFields' && authUser?.role === 'Admin' && (
              <CustomFieldsTab />
            )}
         </motion.div>
      </div>

      <AnimatePresence>
        {showAddUser && (
           <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <motion.div className="modal-content glass-card" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ maxWidth: 400 }}>
               <div className="modal-header">
                 <h2>Create New User</h2>
                 <button className="close-btn" onClick={() => setShowAddUser(false)}>✕</button>
               </div>
               <form className="modal-body" onSubmit={handleAddUser}>
                 <div className="form-group">
                   <label>Full Name</label>
                   <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Jane Doe" />
                 </div>
                 <div className="form-group">
                   <label>Email Address</label>
                   <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="jane@example.com" />
                 </div>
                 <div className="form-group">
                   <label>Temporary Password</label>
                   <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" />
                 </div>
                 <div className="form-group">
                   <label>Account Role</label>
                   <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="Agent">Sales Agent</option>
                      <option value="Admin">Administrator</option>
                   </select>
                 </div>
                 <div className="modal-footer" style={{ marginTop: 20 }}>
                   <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Agents can only access leads assigned specifically to them.</p>
                   <div style={{ display: 'flex', gap: '10px' }}>
                     <button type="button" className="btn-cancel" onClick={() => setShowAddUser(false)}>Cancel</button>
                     <button type="submit" className="btn-primary">Create User</button>
                   </div>
                 </div>
               </form>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .settings-page {
           padding: 24px;
           max-width: 1200px;
           margin: 0 auto;
        }
        .settings-container {
           display: grid;
           grid-template-columns: 280px 1fr;
           gap: 30px;
           margin-top: 24px;
           min-width: 0;
        }
        @media(max-width: 768px) {
           .settings-container {
               grid-template-columns: 1fr;
           }
        }
        .settings-sidebar {
           padding: 20px;
           height: fit-content;
        }
        .settings-nav {
           list-style: none;
        }
        .settings-nav li {
           padding: 14px 16px;
           display: flex;
           align-items: center;
           gap: 12px;
           color: var(--text-secondary);
           cursor: pointer;
           border-radius: 10px;
           margin-bottom: 6px;
           transition: 0.2s;
           font-weight: 500;
        }
        .settings-nav li:hover {
           background: rgba(255,255,255,0.05);
           color: var(--text-color);
        }
        .settings-nav li.active {
           background: rgba(59, 130, 246, 0.1);
           color: #3b82f6;
        }
        body.light-theme .settings-nav li:hover {
           background: #f1f5f9;
        }
        .settings-content {
           padding: 30px;
           min-width: 0;
        }
        .setting-section h2 {
           font-size: 1.3rem;
           margin-bottom: 6px;
        }
        .setting-section .sub-text {
           color: var(--text-secondary);
           font-size: 0.95rem;
           margin-bottom: 24px;
        }
        .divider {
           border: 0;
           height: 1px;
           background: var(--border-color);
           margin: 30px 0;
        }
        .danger-zone {
            padding: 20px;
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            background: rgba(239, 68, 68, 0.03);
            margin-top: 30px;
        }
        .danger-actions .action-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0,0,0,0.1);
            padding: 16px;
            border-radius: 10px;
        }
        .danger-actions .action-text h4 {
            color: var(--text-color);
        }
        .danger-actions .action-text p {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        body.light-theme .danger-actions .action-row { background: white; border: 1px solid #cbd5e1; }
        .del-btn-large {
            background: #ef4444;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
        }
        .del-btn-large:hover { background: #dc2626; }

        /* Modal Styles */
        .modal-overlay {
           position: fixed; top: 0; left: 0; right: 0; bottom: 0;
           background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px);
           z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content { 
           width: 100%; max-width: 400px; background: var(--card-bg); 
           display: flex; flex-direction: column;
           border-radius: 16px; border: 1px solid var(--border-color);
           overflow: hidden;
        }
        .modal-header { 
           display: flex; justify-content: space-between; align-items: center; 
           padding: 24px 32px 16px 32px; flex-shrink: 0; 
        }
        .modal-body { 
           padding: 8px 32px 32px 32px; 
           display: flex; flex-direction: column; gap: 16px; 
        }
        .close-btn { 
           cursor: pointer; color: var(--text-secondary); background: none; border: none; 
           font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
        }
        .close-btn:hover { color: var(--text-color); }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
        .form-group input, .form-group select {
           padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color);
           border-radius: 10px; color: var(--text-color); outline: none; font-family: inherit; width: 100%;
           box-sizing: border-box;
        }
        .form-group input:focus, .form-group select:focus { border-color: var(--primary-color); }
        body.light-theme .form-group input, body.light-theme .form-group select { background: #ffffff; }
        
        .btn-cancel {
           padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer;
           background: transparent; border: 1px solid var(--border-color); color: var(--text-color);
           transition: 0.2s;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.05); }
        body.light-theme .btn-cancel { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        body.light-theme .btn-cancel:hover { background: #e2e8f0; }

        /* Notifications CSS */
        .notification-list { margin-top: 20px; }
        .notif-item { display: flex; justify-content: space-between; align-items: center; }
        .notif-item h4 { font-size: 1.05rem; margin-bottom: 4px; color: var(--text-color); }
        .notif-item p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
        
        /* Toggle Switch CSS */
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .3s; border-radius: 24px; }
        body.light-theme .slider { background-color: #cbd5e1; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: #3b82f6; }
        input:checked + .slider:before { transform: translateX(20px); }

        /* Integrations Grid CSS */
        .integrations-grid {
           display: grid;
           grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
           gap: 20px;
           margin-top: 20px;
        }
        .integration-card {
           background: rgba(0,0,0,0.2);
           border: 1px solid var(--border-color);
           border-radius: 12px;
           padding: 20px;
           display: flex;
           flex-direction: column;
           transition: 0.2s;
        }
        body.light-theme .integration-card { background: #ffffff; border-color: #e2e8f0; }
        .integration-card:hover { border-color: rgba(59, 130, 246, 0.4); }
        .int-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .int-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .status-badge { font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 8px; }
        .status-badge.connected { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .status-badge.disconnected { background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--border-color); }
        body.light-theme .status-badge.disconnected { background: #f1f5f9; border-color: #cbd5e1; color: #475569; }
        .int-body h4 { font-size: 1.1rem; margin-bottom: 8px; color: var(--text-color); }
        .int-body p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px; flex: 1; }
        .int-footer { margin-top: auto; }
      `}</style>
    </div>
  );
};

export default Settings;
