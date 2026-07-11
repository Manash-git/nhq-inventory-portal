import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { formatDate, formatDateTime } from '../../utils/helpers'
import ContributionGraph from './ContributionGraph'
import './History.css'

const ACTION_FILTERS = ['add', 'edit', 'delete', 'archive', 'login', 'logout', 'quantity_change', 'export', 'password_change', 'user_create', 'user_delete', 'password_reset']
const ACTION_LABELS = {
  add: 'Add', edit: 'Edit', delete: 'Delete', archive: 'Archive',
  login: 'Login', logout: 'Logout', quantity_change: 'Qty Change', export: 'Export',
  password_change: 'Pwd Change', user_create: 'User Create', user_delete: 'User Delete',
  password_reset: 'Pwd Reset'
}

export default function History() {
  const { user, canViewAllLogs, isSuperUser } = useAuth()
  const { addToast } = useNotification()
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('nhq-history-tab') || 'activity')
  const switchTab = (t) => { localStorage.setItem('nhq-history-tab', t); setActiveTab(t) }

  // Activity Logs state
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [logsLoading, setLogsLoading] = useState(true)
  const [logSearch, setLogSearch] = useState('')
  const [logAction, setLogAction] = useState(null)
  const [logDateFrom, setLogDateFrom] = useState('')
  const [logDateTo, setLogDateTo] = useState('')

  // Login History state
  const [loginHistory, setLoginHistory] = useState([])
  const [loginTotal, setLoginTotal] = useState(0)
  const [loginPage, setLoginPage] = useState(1)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginStatus, setLoginStatus] = useState(null)
  const [loginDateFrom, setLoginDateFrom] = useState('')
  const [loginDateTo, setLoginDateTo] = useState('')

  // Timeline state
  const [timelineLogs, setTimelineLogs] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Archived state
  const [archived, setArchived] = useState([])
  const [archivedAll, setArchivedAll] = useState([])
  const [archiveLoading, setArchiveLoading] = useState(true)
  const [archiveSearch, setArchiveSearch] = useState('')
  const [archiveSort, setArchiveSort] = useState('product_description')
  const [archiveSortDir, setArchiveSortDir] = useState('asc')
  const [archiveCategoryId, setArchiveCategoryId] = useState('')
  const [archiveCategories, setArchiveCategories] = useState([])
  const [archiveDateFrom, setArchiveDateFrom] = useState('')
  const [archiveDateTo, setArchiveDateTo] = useState('')
  const [archivePage, setArchivePage] = useState(1)
  const [archiveTotal, setArchiveTotal] = useState(0)
  const ARCHIVE_PER_PAGE = 15

  const perPage = 10000

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_activity_logs', {
        p_user_id: user.id,
        p_page: logsPage,
        p_per_page: perPage,
        p_action: logAction,
        p_search: logSearch || null,
        p_date_from: logDateFrom ? new Date(logDateFrom).toISOString() : null,
        p_date_to: logDateTo ? new Date(logDateTo + 'T23:59:59').toISOString() : null
      })
      if (error) throw error
      setLogs(data.items || [])
      setLogsTotal(data.total || 0)
    } catch (err) {
      addToast('Failed to load logs', 'error')
    } finally {
      setLogsLoading(false)
    }
  }, [user, logsPage, logAction, logSearch, logDateFrom, logDateTo, addToast])

  const fetchLoginHistory = useCallback(async () => {
    setLoginLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_login_history', {
        p_user_id: user.id,
        p_page: loginPage,
        p_per_page: perPage,
        p_status: loginStatus,
        p_date_from: loginDateFrom ? new Date(loginDateFrom).toISOString() : null,
        p_date_to: loginDateTo ? new Date(loginDateTo + 'T23:59:59').toISOString() : null
      })
      if (error) throw error
      setLoginHistory(data.items || [])
      setLoginTotal(data.total || 0)
    } catch (err) {
      addToast('Failed to load login history', 'error')
    } finally {
      setLoginLoading(false)
    }
  }, [user, loginPage, loginStatus, loginDateFrom, loginDateTo, addToast])

  const fetchTimelineLogs = useCallback(async () => {
    setTimelineLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_timeline_logs', {
        p_user_id: user.id
      })
      if (error) throw error
      setTimelineLogs(data || [])
    } catch {}
    setTimelineLoading(false)
  }, [user])

  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_products', { p_archived: true })
      if (error) throw error

      setArchiveCategories([])
      // Load categories for filter dropdown
      supabase.rpc('get_categories').then(({ data: cats }) => {
        if (cats) setArchiveCategories(cats)
      }).catch(() => {})

      let filtered = data || []

      if (archiveSearch) {
        const q = archiveSearch.toLowerCase()
        filtered = filtered.filter(p =>
          p.product_description?.toLowerCase().includes(q) ||
          p.part_number?.toLowerCase().includes(q)
        )
      }

      if (archiveCategoryId) {
        filtered = filtered.filter(p => p.category_id === archiveCategoryId)
      }

      // Sort
      filtered.sort((a, b) => {
        const dir = archiveSortDir === 'asc' ? 1 : -1
        const va = (a[archiveSort] || '').toString().toLowerCase()
        const vb = (b[archiveSort] || '').toString().toLowerCase()
        return va.localeCompare(vb) * dir
      })

      setArchivedAll(filtered)
      setArchiveTotal(filtered.length)

      // Paginate
      const start = (archivePage - 1) * ARCHIVE_PER_PAGE
      setArchived(filtered.slice(start, start + ARCHIVE_PER_PAGE))
    } catch (err) {
      console.error(err)
    } finally {
      setArchiveLoading(false)
    }
  }, [archivePage, archiveSort, archiveSortDir, archiveSearch, archiveCategoryId])

  useEffect(() => {
    if (activeTab === 'activity') fetchLogs()
    else if (activeTab === 'login') fetchLoginHistory()
    else if (activeTab === 'archived') fetchArchived()
    else if (activeTab === 'timeline') fetchTimelineLogs()
  }, [activeTab, fetchLogs, fetchLoginHistory, fetchArchived, fetchTimelineLogs])

  // Eagerly fetch archived count on mount so tab badge shows correct count
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      fetchArchived()
    }
  }, [fetchArchived])

  const handleArchiveSort = (col) => {
    if (archiveSort === col) setArchiveSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setArchiveSort(col); setArchiveSortDir('asc') }
  }

  const getActionColor = (action) => {
    const m = {
      add: 'var(--success)', delete: 'var(--danger)', edit: 'var(--accent-primary)',
      archive: 'var(--warning)', restore: 'var(--accent-secondary)',
      login: 'var(--accent-secondary)', logout: 'var(--text-muted)',
      quantity_change: 'var(--accent-primary)', password_change: 'var(--warning)',
      user_create: 'var(--success)', user_delete: 'var(--danger)',
      password_reset: 'var(--warning)', export: 'var(--accent-secondary)'
    }
    return m[action] || 'var(--text-muted)'
  }

  const totalPages = (total, size) => Math.max(1, Math.ceil(total / size))

  const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = totalPages(total, perPage)
    if (pages <= 1) return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 20px' }}>
        <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Page {page} of {pages}</span>
        <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">History & Logs</h1>
          <p className="page-subtitle">Complete audit trail of all activities</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => switchTab('activity')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg> Activity Log
        </button>
        <button className={`tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg> Login History
        </button>
        <button className={`tab ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => switchTab('archived')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
          </svg> Archived ({archiveTotal})
        </button>
        <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => switchTab('timeline')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
          </svg> Timeline
        </button>
      </div>

      {/* === ACTIVITY LOG TAB === */}
      {activeTab === 'activity' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" className="form-input" placeholder="Search logs..." style={{ paddingLeft: 36, width: '100%' }}
                  value={logSearch} onChange={e => { setLogSearch(e.target.value); setLogsPage(1) }} />
              </div>
              <input type="date" className="form-input" style={{ width: 150 }}
                value={logDateFrom} onChange={e => { setLogDateFrom(e.target.value); setLogsPage(1) }} title="From date" />
              <input type="date" className="form-input" style={{ width: 150 }}
                value={logDateTo} onChange={e => { setLogDateTo(e.target.value); setLogsPage(1) }} title="To date" />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{logsTotal} entries</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className={`btn btn-sm ${!logAction ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setLogAction(null); setLogsPage(1) }} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>All</button>
              {ACTION_FILTERS.map(a => (
                <button key={a} className={`btn btn-sm ${logAction === a ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setLogAction(logAction === a ? null : a); setLogsPage(1) }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{ACTION_LABELS[a]}</button>
              ))}
            </div>
          </div>

          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3>No activity logs found</h3>
              <p>Actions performed on hardware will appear here.</p>
            </div>
          ) : (
            <div className="activity-list" style={{ maxHeight: logs.length >= 50 ? '70vh' : 'none', overflowY: 'auto' }}>
              {logs.map(log => (
                <div key={log.id} className="activity-item">
                  <div className="activity-icon" style={{ background: `${getActionColor(log.action)}15`, color: getActionColor(log.action) }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {log.action === 'add' && <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
                      {log.action === 'edit' && <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
                      {log.action === 'delete' && <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}
                      {log.action === 'archive' && <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>}
                      {log.action === 'login' && <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>}
                      {log.action === 'logout' && <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}
                      {(log.action === 'quantity_change' || log.action === 'export') && <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}
                      {['password_change', 'password_reset'].includes(log.action) && <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}
                      {['user_create', 'user_delete'].includes(log.action) && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="12" r="4"/></>}
                    </svg>
                  </div>
                  <div className="activity-details">
                    <div className="activity-desc">{log.description}</div>
                    <div className="activity-meta">
                      <span className="activity-user">{log.user_name || 'Unknown'}</span>
                      <span className="activity-role-badge" style={{
                        background: log.user_role === 'super_user' ? 'rgba(59,130,246,0.1)' : log.user_role === 'admin' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                        color: log.user_role === 'super_user' ? '#3b82f6' : log.user_role === 'admin' ? '#10b981' : '#eab308'
                      }}>{log.user_role?.replace('_', ' ')}</span>
                      <span className="activity-action-badge" style={{ background: `${getActionColor(log.action)}15`, color: getActionColor(log.action) }}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="activity-time">{formatDateTime(log.created_at)}</span>
                    </div>
                    {log.changes && (
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-hover)', borderRadius: 6, padding: '6px 10px' }}>
                        {Object.entries(log.changes).map(([field, val]) => (
                          <div key={field} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 600, textTransform: 'capitalize', minWidth: 100 }}>{field.replace('_', ' ')}:</span>
                            <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{val.from || '(empty)'}</span>
                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                            <span style={{ color: 'var(--success)' }}>{val.to || '(empty)'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === LOGIN HISTORY TAB === */}
      {activeTab === 'login' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn btn-sm ${!loginStatus ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setLoginStatus(null); setLoginPage(1) }} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>All</button>
                <button className={`btn btn-sm ${loginStatus === 'success' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setLoginStatus(loginStatus === 'success' ? null : 'success'); setLoginPage(1) }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--success)' }}>Success</button>
                <button className={`btn btn-sm ${loginStatus === 'failed' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setLoginStatus(loginStatus === 'failed' ? null : 'failed'); setLoginPage(1) }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--danger)' }}>Failed</button>
              </div>
              <input type="date" className="form-input" style={{ width: 150 }}
                value={loginDateFrom} onChange={e => { setLoginDateFrom(e.target.value); setLoginPage(1) }} />
              <input type="date" className="form-input" style={{ width: 150 }}
                value={loginDateTo} onChange={e => { setLoginDateTo(e.target.value); setLoginPage(1) }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{loginTotal} events</span>
            </div>
          </div>
          {loginLoading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : loginHistory.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <h3>No login history</h3>
              <p>Login events will appear here.</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: loginHistory.length >= 50 ? '70vh' : 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Browser</th>
                    <th>OS</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{formatDateTime(h.login_time)}</td>
                      <td style={{ fontWeight: 500 }}>{h.username}</td>
                      <td><span className={`badge ${h.user_role === 'super_user' ? 'badge-primary' : h.user_role === 'admin' ? 'badge-success' : 'badge-warning'}`}>
                        {h.user_role?.replace('_', ' ')}</span></td>
                      <td><span className={`badge ${h.status === 'success' ? 'badge-success' : 'badge-danger'}`}
                        style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>{h.status}</span></td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{h.ip_address || '-'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{h.browser || '-'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{h.os || '-'}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{h.device || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === ARCHIVED TAB === */}
      {activeTab === 'archived' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" className="form-input" placeholder="Search archived..." style={{ paddingLeft: 36, width: '100%' }}
                value={archiveSearch} onChange={e => { setArchiveSearch(e.target.value); setArchivePage(1) }} />
            </div>
            <select className="form-input" style={{ width: 150 }} value={archiveCategoryId}
              onChange={e => { setArchiveCategoryId(e.target.value); setArchivePage(1) }}>
              <option value="">All Teams</option>
              {archiveCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{archiveTotal} items</span>
          </div>
          {archiveLoading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : archived.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <h3>No archived hardware</h3>
              <p>Hardware with quantity 1 can be archived from the home page.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleArchiveSort('product_description')} style={{ cursor: 'pointer' }}>
                      Hardware Name {archiveSort === 'product_description' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => handleArchiveSort('part_number')} style={{ cursor: 'pointer' }}>
                      Part No {archiveSort === 'part_number' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => handleArchiveSort('category')} style={{ cursor: 'pointer' }}>
                      Team {archiveSort === 'category' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th>Quantity</th>
                    <th>Inventory Serial</th>
                    <th onClick={() => handleArchiveSort('archived_at')} style={{ cursor: 'pointer' }}>
                      Archived Date {archiveSort === 'archived_at' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.product_description}</td>
                      <td><code style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{p.part_number}</code></td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.category}</td>
                      <td>{p.quantity}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {p.inventory_box_serial || <span className="text-muted">--</span>}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatDate(p.archived_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={archivePage} total={archiveTotal} perPage={ARCHIVE_PER_PAGE} onChange={setArchivePage} />
        </div>
      )}

      {/* === TIMELINE TAB === */}
      {activeTab === 'timeline' && (
        timelineLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : (
          <ContributionGraph logs={timelineLogs} />
        )
      )}
    </div>
  )
}
