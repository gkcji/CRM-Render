import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  CheckCircle2,
  Settings,
  LogOut,
  Database,
  TrendingUp,
  ChevronRight,
  Sun,
  Moon,
  BarChart2,
  Shield,
  Package
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/',        color: '#3b82f6' },
  { icon: Users,           label: 'Leads',         path: '/leads',   color: '#8b5cf6' },
  { icon: TrendingUp,      label: 'Deals',         path: '/deals',   color: '#10b981' },
  { icon: Package,         label: 'Products',      path: '/products',color: '#8b5cf6', adminOnly: true },
  { icon: CheckCircle2,    label: 'Tasks',         path: '/tasks',   color: '#f59e0b' },
  { icon: BarChart2,       label: 'Reports',       path: '/reports', color: '#ec4899', adminOnly: true },
  { icon: Shield,          label: 'Audit Log',     path: '/audit',   color: '#06b6d4', adminOnly: true },
  { icon: Database,        label: 'Backup',        path: '/backup',  color: '#64748b', adminOnly: true },
  { icon: Settings,        label: 'Settings',      path: '/settings',color: '#94a3b8' },
];

const Sidebar = ({ authUser, setAuthUser }: { authUser?: any, setAuthUser?: any }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('crm-theme');
    if (saved === 'light') {
       document.body.classList.add('light-theme');
       return 'light';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.body.classList.add('light-theme');
      localStorage.setItem('crm-theme', 'light');
      setTheme('light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('crm-theme', 'dark');
      setTheme('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm-user');
    localStorage.removeItem('crm-token');
    if (setAuthUser) setAuthUser(null);
    navigate('/');
  };

  const visibleMenu = menuItems.filter(item => !item.adminOnly || authUser?.role === 'Admin');

  return (
    <>
      {/* ── SIDEBAR RAIL ── */}
      <aside className="sb-rail">
        {/* Logo */}
        <div className="sb-logo" title="Aura CRM">
          <Target size={26} color="#3b82f6" />
        </div>

        {/* Nav Items */}
        <nav className="sb-nav">
          {visibleMenu.map((item) => (
            <div
              key={item.label}
              className="sb-item-wrap"
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sb-icon-btn ${isActive ? 'sb-icon-active' : ''}`}
                style={({ isActive }) => isActive ? { '--accent': item.color } as any : {}}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} color={isActive ? item.color : undefined} />
                    {isActive && <span className="sb-active-bar" style={{ background: item.color }} />}
                  </>
                )}
              </NavLink>

              {/* Floating tooltip popup */}
              {hoveredItem === item.label && (
                <div className="sb-popup">
                  <span className="sb-popup-icon" style={{ color: item.color }}>
                    <item.icon size={16} />
                  </span>
                  <span className="sb-popup-label">{item.label}</span>
                  <ChevronRight size={14} color="#475569" />
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer – avatar + logout */}
        <div className="sb-footer">
          <div
            className="sb-item-wrap"
            onMouseEnter={() => setHoveredItem('user')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="sb-avatar">{authUser ? authUser.name.substring(0,2).toUpperCase() : 'U'}</div>
            {hoveredItem === 'user' && (
              <div className="sb-popup sb-user-popup">
                <div className="sb-user-info">
                  <span className="sb-user-name">{authUser ? authUser.name : 'Unknown'}</span>
                  <span className="sb-user-role">{authUser ? authUser.role : 'Guest'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="sb-item-wrap">
            <NotificationBell />
          </div>

          {/* Theme Toggle */}
          <div
            className="sb-item-wrap"
            onMouseEnter={() => setHoveredItem('theme')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button className="sb-icon-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {hoveredItem === 'theme' && (
              <div className="sb-popup">
                <span className="sb-popup-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            )}
          </div>

          <div
            className="sb-item-wrap"
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button className="sb-icon-btn sb-logout" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
            {hoveredItem === 'logout' && (
              <div className="sb-popup">
                <span className="sb-popup-icon" style={{ color: '#ef4444' }}><LogOut size={16} /></span>
                <span className="sb-popup-label" style={{ color: '#ef4444' }}>Logout</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <style>{`
        /* ─────── RAIL ─────── */
        .sb-rail {
          position: fixed;
          top: 0; left: 0;
          width: 68px;
          height: 100vh;
          z-index: 1000;
          background: rgba(10, 12, 16, 0.97);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0 20px;
          gap: 0;
          backdrop-filter: blur(16px);
        }

        /* Logo */
        .sb-logo {
          width: 44px; height: 44px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
          cursor: pointer;
          transition: all 0.25s;
        }
        .sb-logo:hover { background: rgba(59, 130, 246, 0.2); transform: scale(1.05); }

        /* Nav */
        .sb-nav {
          display: flex; flex-direction: column;
          align-items: center; gap: 4px;
          flex: 1;
          width: 100%;
        }

        /* Each item wrapper – relative for popup positioning */
        .sb-item-wrap {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Icon button */
        .sb-icon-btn {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #475569;
          text-decoration: none;
          border: none; background: transparent; cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: visible;
        }
        .sb-icon-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
        }
        .sb-icon-active {
          background: rgba(255, 255, 255, 0.06) !important;
        }

        /* Active indicator bar on the left edge */
        .sb-active-bar {
          position: absolute;
          left: -12px;
          top: 50%; transform: translateY(-50%);
          width: 3px; height: 20px;
          border-radius: 0 3px 3px 0;
          pointer-events: none;
        }

        /* ─────── POPUP TOOLTIP ─────── */
        .sb-popup {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%; transform: translateY(-50%);
          background: rgba(17, 20, 28, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 9px 14px;
          display: flex; align-items: center; gap: 9px;
          white-space: nowrap;
          z-index: 9999;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04);
          pointer-events: none;
          animation: sbPopIn 0.15s ease;
        }
        /* Arrow pointing left */
        .sb-popup::before {
          content: '';
          position: absolute;
          left: -6px; top: 50%; transform: translateY(-50%);
          width: 0; height: 0;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-right: 6px solid rgba(255, 255, 255, 0.1);
        }
        .sb-popup::after {
          content: '';
          position: absolute;
          left: -5px; top: 50%; transform: translateY(-50%);
          width: 0; height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-right: 5px solid rgba(17, 20, 28, 0.98);
        }

        @keyframes sbPopIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-6px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        .sb-popup-icon { display: flex; align-items: center; }
        .sb-popup-label { font-size: 0.88rem; font-weight: 600; color: #e2e8f0; }

        /* User popup variant */
        .sb-user-popup { flex-direction: column; align-items: flex-start; gap: 2px; padding: 12px 16px; }
        .sb-user-info { display: flex; flex-direction: column; gap: 2px; }
        .sb-user-name  { font-size: 0.88rem; font-weight: 700; color: #f1f5f9; }
        .sb-user-role  { font-size: 0.72rem; color: #64748b; }

        /* ─────── FOOTER ─────── */
        .sb-footer {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          width: 100%;
        }
        .sb-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: white;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .sb-avatar:hover { transform: scale(1.08); }

        .sb-logout { color: #475569 !important; }
        .sb-logout:hover { color: #f87171 !important; background: rgba(239, 68, 68, 0.08) !important; }
        .sb-logout:hover svg { stroke: #ef4444; }

        /* ─────── MOBILE RESPONSIVITY (BOTTOM BAR) ─────── */
        @media (max-width: 768px) {
          .sb-rail {
            flex-direction: row;
            top: auto;
            bottom: 0;
            left: 0;
            width: 100vw;
            height: 60px;
            padding: 0 10px;
            border-right: none;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(12, 14, 18, 0.95);
            z-index: 9999;
          }
          
          .sb-logo, .sb-footer, .sb-popup, .sb-active-bar {
            display: none !important;
          }
          
          .sb-nav {
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
            height: 100%;
            gap: 0;
          }
          
          .sb-item-wrap {
            width: auto;
            flex: 1;
            height: 100%;
          }
          
          .sb-icon-btn {
            width: 100%;
            height: 100%;
            border-radius: 0;
          }
          
          .sb-icon-active {
            background: transparent !important;
            border-top: 3px solid var(--accent);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
