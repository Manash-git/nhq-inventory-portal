import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { formatDate, formatDateTime } from '../../utils/helpers'
import ContributionGraph from './ContributionGraph'
import './History.css'

const ACTION_FILTERS = ['add', 'delete', 'edit', 'archive', 'login', 'logout', 'quantity_change', 'export']
const ACTION_LABELS = {
  add: 'Add', delete: 'Delete', edit: 'Edit', archive: 'Archive',
  login: 'Login', logout: 'Logout', quantity_change: 'Qty Change', export: 'Export'
}

export default function History() {
  const { user, canViewAllLogs, canViewAdminLogs, isSuperUser } = useAuth()
  const { addToast } = useNotification()
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('nhq-history-tab') || 'activity')
  const switchTab = (tab) => { localStorage.setItem('nhq-history-tab', tab); setActiveTab(tab) }
  const [logs, setLogs] = useState([])
  const [archived, setArchived] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState(null)
  const [archiveSearch, setArchiveSearch] = useState('')
  const [archiveSort, setArchiveSort] = useState('product_description')
  const [archiveSortDir, setArchiveSortDir] = useState('asc')
  const channelRef = useRef(null)

  const fetchLogs = useCallback(async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      // Role-based filtering
      if (canViewAllLogs) {
        // Super user can see all logs
      } else if (canViewAdminLogs) {
        // Admin can see admin and read_only logs
        query = query.in('user_role', ['admin', 'read_only'])
      } else {
        // Read-only can only see own logs
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      addToast('Failed to load logs', 'error')
    }
  }, [user, canViewAllLogs, canViewAdminLogs, addToast])

  const fetchArchived = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_archived', true)
        .order(archiveSort, { ascending: archiveSortDir === 'asc' })
      if (error) throw error
      setArchived(data || [])
    } catch (err) {
      console.error(err)
    }
  }, [archiveSort, archiveSortDir])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchLogs(), fetchArchived()]).finally(() => setLoading(false))

    // Set up realtime subscription for activity logs
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('Realtime log change:', payload)
          fetchLogs()
        }
      )
      .subscribe()

    // Set up realtime subscription for archived products
    const archivedChannel = supabase
      .channel('archived-products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: 'is_archived=eq.true'
        },
        (payload) => {
          console.log('Realtime archived product change:', payload)
          fetchArchived()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (archivedChannel) {
        supabase.removeChannel(archivedChannel)
      }
    }
  }, [fetchLogs, fetchArchived])

  const filteredLogs = logs.filter(l => {
    if (actionFilter && l.action !== actionFilter) return false
    const q = search.toLowerCase()
    return (
      l.description?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.user_name?.toLowerCase().includes(q) ||
      l.user_role?.toLowerCase().includes(q)
    )
  })

  const filteredArchived = archived.filter(p => {
    const q = archiveSearch.toLowerCase()
    return (
      p.product_description?.toLowerCase().includes(q) ||
      p.part_number?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    )
  })

  const handleArchiveSort = (col) => {
    if (archiveSort === col) {
      setArchiveSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setArchiveSort(col)
      setArchiveSortDir('asc')
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'add': return 'var(--success)'
      case 'delete': return 'var(--danger)'
      case 'edit': return 'var(--accent-primary)'
      case 'archive': return 'var(--warning)'
      case 'login': return 'var(--accent-secondary)'
      case 'logout': return 'var(--text-muted)'
      case 'quantity_change': return 'var(--accent-primary)'
      case 'password_change': return 'var(--warning)'
      case 'user_create': return 'var(--success)'
      case 'user_delete': return 'var(--danger)'
      case 'password_reset': return 'var(--warning)'
      case 'export': return 'var(--accent-secondary)'
      default: return 'var(--text-muted)'
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'add': return 'add'
      case 'delete': return 'delete'
      case 'edit': return 'edit'
      case 'archive': return 'archive'
      case 'quantity_change': return 'edit'
      case 'login': return 'login'
      case 'logout': return 'logout'
      case 'password_change': return 'password'
      case 'user_create': return 'add'
      case 'user_delete': return 'delete'
      case 'password_reset': return 'password'
      case 'export': return 'export'
      default: return 'info'
    }
  }

  const renderActionIcon = (action) => {
    const icon = getActionIcon(action)
    const color = getActionColor(action)

    switch (icon) {
      case 'add':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        )
      case 'delete':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        )
      case 'edit':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        )
      case 'archive':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
        )
      case 'login':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        )
      case 'logout':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        )
      case 'password':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        )
      case 'export':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        )
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">History & Logs</h1>
          <p className="page-subtitle">Track all changes and archived inventory</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => switchTab('activity')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Activity Log
        </button>
        <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => switchTab('timeline')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          Timeline
        </button>
        <button className={`tab ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => switchTab('archived')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          Archived ({archived.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {activeTab === 'activity' && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="search-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" className="form-input" placeholder="Search logs..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      style={{ flex: 1, maxWidth: 400, paddingLeft: 36 }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {filteredLogs.length} entries
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className={`btn btn-sm ${!actionFilter ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActionFilter(null)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >All</button>
                  {ACTION_FILTERS.map(a => (
                    <button
                      key={a}
                      className={`btn btn-sm ${actionFilter === a ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setActionFilter(actionFilter === a ? null : a)}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >{ACTION_LABELS[a]}</button>
                  ))}
                </div>
              </div>
              {filteredLogs.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <h3>No activity logs found</h3>
                  <p>Actions performed on products will appear here.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="activity-item">
                      <div className="activity-icon" style={{ background: `${getActionColor(log.action)}15`, color: getActionColor(log.action) }}>
                        {renderActionIcon(log.action)}
                      </div>
                      <div className="activity-details">
                        <div className="activity-desc">{log.description}</div>
                        <div className="activity-meta">
                          <span className="activity-user">{log.user_name || 'Unknown'}</span>
                          <span className="activity-role-badge" style={{
                            background: log.user_role === 'super_user' ? 'rgba(59, 130, 246, 0.1)' :
                              log.user_role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                            color: log.user_role === 'super_user' ? '#3b82f6' :
                              log.user_role === 'admin' ? '#10b981' : '#eab308'
                          }}>
                            {log.user_role?.replace('_', ' ')}
                          </span>
                          <span className="activity-action-badge" style={{ background: `${getActionColor(log.action)}15`, color: getActionColor(log.action) }}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="activity-time">{formatDateTime(log.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <ContributionGraph logs={logs} />
          )}

          {activeTab === 'archived' && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="search-input-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" className="form-input" placeholder="Search archived..."
                    value={archiveSearch} onChange={e => setArchiveSearch(e.target.value)}
                    style={{ flex: 1, maxWidth: 400, paddingLeft: 36 }} />
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {filteredArchived.length} items
                </span>
              </div>
              {filteredArchived.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                  <h3>No archived products</h3>
                  <p>Products with quantity 1 can be archived from the home page.</p>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleArchiveSort('product_description')} style={{ cursor: 'pointer' }}>
                          Product Description {archiveSort === 'product_description' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </th>
                        <th onClick={() => handleArchiveSort('part_number')} style={{ cursor: 'pointer' }}>
                          Part Number {archiveSort === 'part_number' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </th>
                        <th onClick={() => handleArchiveSort('category')} style={{ cursor: 'pointer' }}>
                          Category {archiveSort === 'category' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </th>
                        <th onClick={() => handleArchiveSort('archived_at')} style={{ cursor: 'pointer' }}>
                          Archived Date {archiveSort === 'archived_at' ? (archiveSortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArchived.map(product => (
                        <tr key={product.id}>
                          <td style={{ fontWeight: 500 }}>{product.product_description}</td>
                          <td><code style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{product.part_number}</code></td>
                          <td><span className="badge badge-warning">{product.category}</span></td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatDate(product.archived_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}