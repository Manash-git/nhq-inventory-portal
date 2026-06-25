import { useState, useEffect, useCallback } from 'react'
import { supabase, USER_CREDENTIALS } from '../../utils/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDateTime } from '../../utils/helpers'
import './LoginActivity.css'

const USERNAME_ROLE_MAP = Object.fromEntries(
  Object.values(USER_CREDENTIALS).map(u => [u.username, u.role])
)

export default function LoginActivity() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchLoginLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'login')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch login logs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchLoginLogs()
  }, [fetchLoginLogs])

  const visibleLogs = logs.filter(log => {
    const role = USERNAME_ROLE_MAP[log.user_id]
    if (user?.role === 'root') return true
    if (user?.role === 'admin') return role === 'admin' || role === 'nhq'
    if (user?.role === 'nhq') return role === 'nhq'
    return false
  })

  const filteredLogs = visibleLogs.filter(log => {
    const q = search.toLowerCase()
    return (
      log.user_name?.toLowerCase().includes(q) ||
      log.user_id?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q)
    )
  })

  const getLoginIcon = (role) => {
    if (role === 'root') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      )
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    )
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'root': return 'badge-root'
      case 'admin': return 'badge-admin'
      case 'nhq': return 'badge-nhq'
      default: return ''
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Login Activity</h1>
          <p className="page-subtitle">Monitor user login sessions across the portal</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="login-activity-toolbar">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, username, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <span className="login-activity-count">
            {filteredLogs.length} login{filteredLogs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <h3>No login activity found</h3>
            <p>Login records will appear here when users sign in.</p>
          </div>
        ) : (
          <div className="login-activity-list">
            {filteredLogs.map((log, index) => {
              const role = USERNAME_ROLE_MAP[log.user_id] || 'unknown'
              return (
                <div key={log.id} className="login-activity-item" style={{ animationDelay: `${index * 30}ms` }}>
                  <div className={`login-activity-avatar ${role}`}>
                    {log.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="login-activity-details">
                    <div className="login-activity-desc">
                      <strong>{log.user_name || 'Unknown User'}</strong>
                      <span className={`role-badge ${getRoleBadgeClass(role)}`}>{role}</span>
                    </div>
                    <div className="login-activity-meta">
                      <span className="login-activity-username">{log.user_id}</span>
                      <span className="login-activity-separator">•</span>
                      <span className="login-activity-time">{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>
                  <div className="login-icon-wrapper">
                    {getLoginIcon(role)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
