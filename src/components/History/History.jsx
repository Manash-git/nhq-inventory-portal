import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { formatDate, formatDateTime } from '../../utils/helpers'
import ContributionGraph from './ContributionGraph'
import './History.css'

export default function History() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('nhq-history-tab') || 'activity')
  const switchTab = (tab) => { localStorage.setItem('nhq-history-tab', tab); setActiveTab(tab) }
  const [logs, setLogs] = useState([])
  const [archived, setArchived] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [archiveSearch, setArchiveSearch] = useState('')
  const [archiveSort, setArchiveSort] = useState('product_description')
  const [archiveSortDir, setArchiveSortDir] = useState('asc')

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error(err)
    }
  }, [])

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
  }, [fetchLogs, fetchArchived])

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase()
    return (
      l.description?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.user_name?.toLowerCase().includes(q)
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

  const getActionIcon = (action) => {
    switch (action) {
      case 'add': return 'add'
      case 'delete': return 'delete'
      case 'edit': return 'edit'
      case 'archived': return 'archive'
      default: return 'info'
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'add': return 'var(--success)'
      case 'delete': return 'var(--danger)'
      case 'edit': return 'var(--accent-primary)'
      case 'archived': return 'var(--warning)'
      default: return 'var(--text-muted)'
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
          <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {activeTab === 'activity' && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search logs..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, maxWidth: 400 }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {filteredLogs.length} entries
                </span>
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
                        {log.action === 'add' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        )}
                        {log.action === 'delete' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        )}
                        {log.action === 'edit' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        )}
                        {log.action === 'archived' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                        )}
                      </div>
                      <div className="activity-details">
                        <div className="activity-desc">{log.description}</div>
                        <div className="activity-meta">
                          <span className="activity-user">{log.user_name || 'Unknown'}</span>
                          <span className="activity-action-badge" style={{ background: `${getActionColor(log.action)}15`, color: getActionColor(log.action) }}>
                            {log.action}
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
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search archived..."
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  style={{ flex: 1, maxWidth: 400 }}
                />
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
                          Product Description {archiveSort === 'product_description' ? (archiveSortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => handleArchiveSort('part_number')} style={{ cursor: 'pointer' }}>
                          Part Number {archiveSort === 'part_number' ? (archiveSortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => handleArchiveSort('category')} style={{ cursor: 'pointer' }}>
                          Category {archiveSort === 'category' ? (archiveSortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => handleArchiveSort('archived_at')} style={{ cursor: 'pointer' }}>
                          Archived Date {archiveSort === 'archived_at' ? (archiveSortDir === 'asc' ? '↑' : '↓') : ''}
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
