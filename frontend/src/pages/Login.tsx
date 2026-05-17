import React, { useState } from 'react';
import { Target, Lock, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setAuthUser }: { setAuthUser: (user: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to login');

      // Save to localStorage
      localStorage.setItem('crm-user', JSON.stringify(data.user));
      localStorage.setItem('crm-token', data.token);
      
      setAuthUser(data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-logo">
            <Target size={28} color="#3b82f6" />
          </div>
          <h2>Welcome Back</h2>
          <p>Login to Aura CRM to manage your pipeline.</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} color="#94a3b8" />
              <input 
                 type="email" 
                 required 
                 placeholder="admin@example.com"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} color="#94a3b8" />
              <input 
                 type="password" 
                 required 
                 placeholder="••••••••"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>
        
        <div className="login-demo-notes">
          <small>Demo Accounts:</small><br/>
          <small>admin@example.com / password</small><br/>
          <small>agent@example.com / password</small>
        </div>
      </div>

      <style>{`
        .login-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100vw;
          background: var(--bg-color);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 99999;
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-header h2 {
          font-size: 1.8rem;
          margin-bottom: 8px;
        }
        .login-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .login-error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 20px;
          text-align: center;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .login-form .form-group {
          margin-bottom: 20px;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-icon svg {
          position: absolute;
          left: 14px;
        }
        .input-with-icon input {
          width: 100%;
          padding-left: 42px !important;
        }
        .login-btn {
          width: 100%;
          margin-top: 10px;
          height: 48px;
        }
        .login-demo-notes {
          margin-top: 24px;
          text-align: center;
          color: var(--text-secondary);
          background: rgba(255,255,255,0.03);
          padding: 12px;
          border-radius: 8px;
        }
        .login-logo {
          width: 52px; height: 52px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px auto;
        }
        body.light-theme .login-demo-notes { background: #f8fafc; }
      `}</style>
    </div>
  );
};

export default Login;
