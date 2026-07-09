import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotification } from '../../contexts/NotificationContext'
import Modal from '../Common/Modal'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, isSuperUser, changePassword, createUser, deleteUser, resetUserPassword, getUsers } = useAuth()
  const { currentTheme, isDark, toggleDark, switchTheme } = useTheme()
  const { addToast } = useNotification()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showChangePwdModal, setShowChangePwdModal] = useState(false)
  const [showUserMgmtModal, setShowUserMgmtModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [users, setUsers] = useState([])

  // Change password form
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })

  // Create user form
  const [createForm, setCreateForm] = useState({ username: '', password: '', role: 'read_only' })

  // Reset password form
  const [resetUserId, setResetUserId] = useState(null)
  const [resetNewPassword, setResetNewPassword] = useState('')

  const menuRef = useRef()
  const themeRef = useRef()
  const location = useLocation()

  useEffect(() => { setMobileOpen(false) }, [location])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false)
      if (themeRef.current && !themeRef.current.contains(e.target)) setShowThemeMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const openUserMgmt = () => {
    setShowUserMenu(false)
    loadUsers()
    setShowUserMgmtModal(true)
  }

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.newPwd) {
      addToast('Please fill all fields.', 'error')
      return
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      addToast('Passwords do not match.', 'error')
      return
    }
    if (pwdForm.newPwd.length < 4) {
      addToast('Password must be at least 4 characters.', 'error')
      return
    }
    try {
      await changePassword(pwdForm.current, pwdForm.newPwd)
      addToast('Password changed successfully!', 'success')
      setShowChangePwdModal(false)
      setPwdForm({ current: '', newPwd: '', confirm: '' })
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.password) {
      addToast('Please fill all fields.', 'error')
      return
    }
    if (createForm.password.length < 4) {
      addToast('Password must be at least 4 characters.', 'error')
      return
    }
    try {
      await createUser(createForm.username, createForm.password, createForm.username, createForm.role)
      addToast(`User "${createForm.username}" created!`, 'success')
      setShowCreateUserModal(false)
      setCreateForm({ username: '', password: '', role: 'read_only' })
      loadUsers()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return
    try {
      await deleteUser(userId)
      addToast(`User "${username}" deleted.`, 'info')
      loadUsers()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleResetPassword = async () => {
    if (!resetUserId || !resetNewPassword) {
      addToast('Please enter a new password.', 'error')
      return
    }
    if (resetNewPassword.length < 4) {
      addToast('Password must be at least 4 characters.', 'error')
      return
    }
    try {
      await resetUserPassword(resetUserId, resetNewPassword)
      addToast('Password reset successfully!', 'success')
      setResetUserId(null)
      setResetNewPassword('')
      loadUsers()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

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
            <span className="navbar-brand-text">NHQ Inventory Portal</span>
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
              <button className="navbar-action-btn" onClick={() => setShowThemeMenu(!showThemeMenu)} title="Switch theme">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              {showThemeMenu && (
                <div className="dropdown-menu">
                  <button className={`dropdown-item ${currentTheme === 'nhqbd' ? 'active' : ''}`}
                    onClick={() => { switchTheme('nhqbd'); setShowThemeMenu(false) }}>
                    {currentTheme === 'nhqbd' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    <span style={{ marginLeft: currentTheme === 'nhqbd' ? 0 : 24 }}>NHQBD</span>
                  </button>
                  <button className={`dropdown-item ${currentTheme === 'cohesity' ? 'active' : ''}`}
                    onClick={() => { switchTheme('cohesity'); setShowThemeMenu(false) }}>
                    {currentTheme === 'cohesity' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    <span style={{ marginLeft: currentTheme === 'cohesity' ? 0 : 24 }}>Cohesity</span>
                  </button>
                </div>
              )}
            </div>

            <button className="navbar-action-btn" onClick={toggleDark} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <div className="dropdown" ref={menuRef}>
              <button className="navbar-user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="navbar-avatar">
                  {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="navbar-user-info">
                  <span className="navbar-user-name">{user?.display_name || 'User'}</span>
                  <span className="navbar-user-role">{user?.role?.replace('_', ' ')}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`navbar-chevron ${showUserMenu ? 'open' : ''}`}>
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
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); setShowChangePwdModal(true); setPwdForm({ current: '', newPwd: '', confirm: '' }) }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Change Password
                  </button>
                  {isSuperUser && (
                    <>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item" onClick={openUserMgmt}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Manage Users
                      </button>
                    </>
                  )}
                  <div className="dropdown-divider" />
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

      {/* Change Password Modal */}
      <Modal isOpen={showChangePwdModal} onClose={() => setShowChangePwdModal(false)} title="Change Password">
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input type="password" className="form-input" placeholder="Enter current password"
            value={pwdForm.current}
            onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input type="password" className="form-input" placeholder="Enter new password"
            value={pwdForm.newPwd}
            onChange={e => setPwdForm(p => ({ ...p, newPwd: e.target.value }))} />
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Man@321%', 'Nhq@321%', 'Admin@123', 'Nhq@Admin', 'Pass@1234'].map(s => (
              <button key={s} type="button" className="btn btn-sm btn-outline" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                onClick={() => setPwdForm(p => ({ ...p, newPwd: s }))}>{s}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input type="password" className="form-input" placeholder="Confirm new password"
            value={pwdForm.confirm}
            onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowChangePwdModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleChangePassword}>Change Password</button>
        </div>
      </Modal>

      {/* User Management Modal */}
      <Modal isOpen={showUserMgmtModal} onClose={() => setShowUserMgmtModal(false)} title="Manage Users" width="700px">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{users.length} user(s)</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateUserModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create User
          </button>
        </div>
        <div className="table-container">
          <table className="data-table" style={{ minWidth: 500 }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><code>{u.username}</code></td>
                  <td>{u.display_name}</td>
                  <td>
                    <span className="badge" style={{
                      background: u.role === 'super_user' ? 'rgba(59, 130, 246, 0.1)' :
                        u.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                      color: u.role === 'super_user' ? '#3b82f6' :
                        u.role === 'admin' ? '#10b981' : '#eab308'
                    }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: u.is_active ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
                      color: u.is_active ? '#38a169' : '#e53e3e'
                    }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.id !== user.id && u.is_active && (
                        <>
                          <button className="btn btn-sm btn-outline" onClick={() => { setResetUserId(u.id); setResetNewPassword('') }}>
                            Reset Pwd
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id, u.username)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reset Password Inline */}
        {resetUserId && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
            <label className="form-label">New Password for selected user</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input type="password" className="form-input" placeholder="Enter new password"
                value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={handleResetPassword}>Reset</button>
              <button className="btn btn-secondary" onClick={() => setResetUserId(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create User Modal */}
      <Modal isOpen={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} title="Create New User">
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" placeholder="Enter username"
            value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-input" placeholder="Enter password"
            value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-input" value={createForm.role}
            onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
            <option value="super_user">Super User</option>
            <option value="admin">Admin</option>
            <option value="read_only">Read Only</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowCreateUserModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreateUser}>Create User</button>
        </div>
      </Modal>
    </>
  )
}