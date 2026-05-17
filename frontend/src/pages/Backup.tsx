import { useState } from 'react';
import { 
  CloudBackup, 
  ShieldCheck, 
  History,
  Settings
} from 'lucide-react';
import axios from 'axios';

const BackupPage = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const connectDrive = async () => {
    try {
      const { data } = await axios.get(`/api/auth/google`);
      window.open(data.url, '_blank');
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error connecting to Google. Check your .env setup.";
      alert(msg);
    }
  };

  const startBackup = async () => {
    setStatus('running');
    try {
      const response = await axios.post(`/api/backup`);
      if (response.data.message) {
        setStatus('success');
        setLastBackup(new Date().toLocaleString('en-IN'));
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="backup-container">
      <header className="page-header">
        <h1>Safety & Security</h1>
        <p>Automated cloud sync and data preservation.</p>
      </header>

      <div className="backup-layout">
        <div className="main-card glass-card">
           <div className="card-top">
              <div className="icon-wrapper">
                 <CloudBackup size={48} color="#3b82f6" />
              </div>
              <div className="text-wrapper">
                 <h2>Google Drive Sync</h2>
                 <p>Securely upload your CRM data to your private Google account.</p>
              </div>
           </div>

           <div className="backup-controls">
             <div className="status-indicator">
                <span className={`dot ${status}`}></span>
                <span className="status-text">
                   {status === 'idle' && 'System Ready'}
                   {status === 'running' && 'Securely Transferring Data...'}
                   {status === 'success' && 'Backup Completed Successfully'}
                   {status === 'error' && 'Encountered Connection Error'}
                </span>
             </div>

             <button 
               className="connect-btn"
               onClick={connectDrive}
             >
                Connect Google Drive
             </button>

             <button 
               className={`backup-btn ${status === 'running' ? 'loading' : ''}`}
               onClick={startBackup}
               disabled={status === 'running'}
             >
                {status === 'running' ? 'Backing Up...' : 'Initiate Secure Backup Now'}
             </button>

             <p className="backup-note">
               <History size={14} />
               Last successful sync: {lastBackup || 'Never'}
             </p>
           </div>
        </div>

        <div className="side-cards">
           <div className="info-card glass-card">
              <ShieldCheck color="#10b981" />
              <div className="info-txt">
                 <h4>End-to-End Encryption</h4>
                 <p>Your data is encrypted before it leaves the server.</p>
              </div>
           </div>

           <div className="info-card glass-card">
              <Settings color="#8b5cf6" />
              <div className="info-txt">
                 <h4>Configuration</h4>
                 <p>Update Google OAuth credentials in your <code>.env</code> file.</p>
              </div>
           </div>
        </div>
      </div>

      <div className="config-help glass-card">
          <h3>Setup Instructions</h3>
          <ol>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>.</li>
            <li>Create a project and enable <strong>Google Drive API</strong>.</li>
            <li>Go to <strong>APIs & Services {'>'} Credentials</strong>.</li>
            <li>Create <strong>OAuth 2.0 Client ID</strong>.</li>
            <li>Enter the credentials into your <code>backend/.env</code> file.</li>
          </ol>
          <div className="example-env">
            <code>
              GOOGLE_CLIENT_ID=your_id_here<br/>
              GOOGLE_CLIENT_SECRET=your_secret_here<br/>
              GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
            </code>
          </div>
      </div>

      <style>{`
        .backup-container {
           max-width: 1000px;
           margin: 0 auto;
           display: flex;
           flex-direction: column;
           gap: 32px;
        }

        .backup-layout {
           display: grid;
           grid-template-columns: 2fr 1fr;
           gap: 24px;
        }

        .main-card {
           padding: 40px;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-bottom: 40px;
        }

        .icon-wrapper {
          padding: 24px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 24px;
        }

        .text-wrapper h2 {
           font-size: 1.8rem;
           margin-bottom: 8px;
        }

        .text-wrapper p {
           color: var(--text-secondary);
           font-size: 1.1rem;
        }

        .backup-controls {
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 20px;
           background: rgba(255, 255, 255, 0.02);
           padding: 32px;
           border-radius: 20px;
           border: 1px solid var(--border-color);
        }

        .status-indicator {
           display: flex;
           align-items: center;
           gap: 12px;
           background: rgba(0, 0, 0, 0.2);
           padding: 8px 20px;
           border-radius: 100px;
           font-size: 0.9rem;
        }

        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.idle { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; }
        .dot.running { background: #f59e0b; animation: pulse 1s infinite; }
        .dot.success { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .dot.error { background: #ef4444; box-shadow: 0 0 10px #ef4444; }

        @keyframes pulse {
           0% { opacity: 1; transform: scale(1); }
           50% { opacity: 0.5; transform: scale(1.5); }
           100% { opacity: 1; transform: scale(1); }
        }

        .backup-btn {
          width: 100%;
          background: var(--primary-color);
          color: white;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .backup-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .backup-btn.loading {
           background: #475569;
           cursor: not-allowed;
           box-shadow: none;
        }

        .connect-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          color: white;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .connect-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .backup-note {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .side-cards {
           display: flex;
           flex-direction: column;
           gap: 20px;
        }

        .info-card {
           padding: 24px;
           display: flex;
           gap: 16px;
        }

        .info-txt h4 {
           margin-bottom: 4px;
           font-size: 1rem;
        }

        .info-txt p {
           font-size: 0.85rem;
           color: var(--text-secondary);
           line-height: 1.4;
        }

        .config-help {
          padding: 32px;
          background: rgba(16, 185, 129, 0.03) !important;
        }

        .config-help h3 {
           margin-bottom: 16px;
        }

        .config-help ol {
           margin-left: 20px;
           display: flex;
           flex-direction: column;
           gap: 10px;
           margin-bottom: 24px;
        }

        .example-env {
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .example-env code {
          font-family: monospace;
          color: #10b981;
        }

        a { color: #3b82f6; text-decoration: none; }

        @media (max-width: 900px) {
           .backup-layout { grid-template-columns: 1fr; }
           .card-top { flex-direction: column; text-align: center; gap: 16px; margin-bottom: 24px; }
           .main-card { padding: 24px; }
        }
      `}</style>
    </div>
  );
};

export default BackupPage;
