import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotification } from '../../contexts/NotificationContext'
import Modal from '../Common/Modal'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, isRoot, resetUserPassword } = useAuth()
  const { currentTheme, isDark, toggleDark, switchTheme, themeNames } = useTheme()
  const { addToast } = useNotification()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetTarget, setResetTarget] = useState('admin')
  const [resetPassword, setResetPassword] = useState('')
  const menuRef = useRef()
  const themeRef = useRef()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false)
      if (themeRef.current && !themeRef.current.contains(e.target)) setShowThemeMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navItems = [
    { to: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                ) : (
                  <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
                )}
              </svg>
            </button>
            <img
              src="https://www.nhqbd.com/storage/2020/04/logo-nhq.png"
              alt="NHQ Logo"
              className="navbar-logo"
              onError={(e) => { e.target.src = ''; e.target.style.display = 'none' }}
            />
            <span className="navbar-brand-text">Inventory Portal</span>
          </div>

          <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="navbar-actions">
            <div className="dropdown" ref={themeRef}>
              <button
                className="navbar-action-btn"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title="Switch theme"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              {showThemeMenu && (
                <div className="dropdown-menu">
                  {Object.entries(themeNames).map(([key, name]) => (
                    <button
                      key={key}
                      className={`dropdown-item ${currentTheme === key ? 'active' : ''}`}
                      onClick={() => { switchTheme(key); setShowThemeMenu(false) }}
                      style={currentTheme === key ? { color: 'var(--accent-primary)', fontWeight: 600 } : {}}
                    >
                      {currentTheme === key && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      <span style={{ marginLeft: currentTheme === key ? 0 : 24 }}>{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="navbar-action-btn" onClick={toggleDark} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <div className="dropdown" ref={menuRef}>
              <button
                className="navbar-user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="navbar-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="navbar-user-info">
                  <span className="navbar-user-name">{user?.name || 'User'}</span>
                  <span className="navbar-user-role">{user?.role}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`navbar-chevron ${showUserMenu ? 'open' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showUserMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" style={{ cursor: 'default', background: 'none' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>
                    </div>
                  </div>
                  {isRoot && (
                    <>
                      <div className="dropdown-divider" style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
                      <button className="dropdown-item" onClick={() => { setShowUserMenu(false); setShowResetModal(true); setResetPassword('') }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"/>
                        </svg>
                        Manage Users
                      </button>
                    </>
                  )}
                  <div className="dropdown-divider" style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
                  <button className="dropdown-item dropdown-item-danger" onClick={logout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {mobileOpen && <div className="navbar-overlay" onClick={() => setMobileOpen(false)} />}

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Manage Users">
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          As the <strong>Root</strong> user, you can reset passwords for other accounts. The new password will be saved permanently.
        </p>
        <div className="form-group">
          <label className="form-label">Select User</label>
          <select className="form-input" value={resetTarget} onChange={e => setResetTarget(e.target.value)}>
            <option value="admin">Admin (admin)</option>
            <option value="nhq">NHQ Guest (nhq)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter new password"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              style={{ paddingRight: 80 }}
            />
            {resetPassword && (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setResetPassword('')}
                style={{ position: 'absolute', right: 6, top: 6, padding: '4px 8px', fontSize: '0.75rem' }}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Man@321%', 'Nhq@321%', 'Admin@123', 'Nhq@Admin', 'Pass@1234'].map(suggested => (
              <button
                key={suggested}
                type="button"
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                onClick={() => setResetPassword(suggested)}
              >
                {suggested}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={async () => {
            if (!resetPassword || resetPassword.length < 4) {
              addToast('Password must be at least 4 characters.', 'error')
              return
            }
            try {
              const targetUser = resetTarget === 'admin' ? 'admin' : 'nhq'
              await resetUserPassword(targetUser, resetPassword)
              addToast(`Password for ${resetTarget} updated successfully!`, 'success')
              setShowResetModal(false)
            } catch (err) {
              addToast(err.message, 'error')
            }
          }}>Update Password</button>
        </div>
      </Modal>
    </>
  )
}
