import { useState, useMemo } from 'react'

const DAY_NAMES = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getLevel(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

const CELL_SIZE = 13
const CELL_GAP = 3

export default function ContributionGraph({ logs }) {
  const [tooltip, setTooltip] = useState(null)

  const { weeks, monthPositions, logsByDate, totalActions } = useMemo(() => {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setDate(oneYearAgo.getDate() - 364)
    oneYearAgo.setHours(0, 0, 0, 0)

    const dayCounts = {}
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      dayCounts[localDateStr(d)] = 0
    }

    ;(logs || []).forEach(log => {
      if (!log.created_at) return
      try {
        const key = localDateStr(new Date(log.created_at))
        if (dayCounts[key] !== undefined) dayCounts[key]++
      } catch (e) {}
    })

    const weeks = []
    let currentWeek = []
    const startDay = oneYearAgo.getDay()
    for (let i = 0; i < startDay; i++) currentWeek.push(null)

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const key = localDateStr(d)
      currentWeek.push({ date: key, count: dayCounts[key] || 0 })
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null)
      weeks.push(currentWeek)
    }

    const monthPositions = []
    weeks.forEach((week, wi) => {
      week.forEach(day => {
        if (day && day.date) {
          const parts = day.date.split('-')
          const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
          if (d.getDate() === 1) {
            monthPositions.push({ idx: wi, name: MONTH_NAMES[d.getMonth()] })
          }
        }
      })
    })

    const logsByDate = {}
    ;(logs || []).forEach(log => {
      if (!log.created_at) return
      try {
        const key = localDateStr(new Date(log.created_at))
        if (!logsByDate[key]) logsByDate[key] = []
        logsByDate[key].push(log)
      } catch (e) {}
    })

    return { weeks, monthPositions, logsByDate, totalActions: logs?.length || 0 }
  }, [logs])

  const colWidth = CELL_SIZE + CELL_GAP

  return (
    <div className="card" style={{ padding: '20px 24px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Activity Timeline</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalActions} action{totalActions !== 1 ? 's' : ''} in the last year</span>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 4 }}>
        {/* Month labels */}
        <div style={{ marginLeft: 30, marginBottom: 2, position: 'relative', height: 16 }}>
          {monthPositions.map((p, i) => (
            <span key={i} style={{
              position: 'absolute',
              left: p.idx * colWidth,
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap'
            }}>
              {p.name}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP, paddingRight: 2, width: 30, flexShrink: 0 }}>
            {DAY_NAMES.map((d, i) => (
              <span key={i} style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                height: CELL_SIZE,
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1
              }}>
                {d}
              </span>
            ))}
          </div>

          {/* Contribution grid */}
          <div style={{ display: 'flex', gap: CELL_GAP, minHeight: 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP }}>
            {weeks.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No data</div>
            ) : (
              weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP }}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
                    const level = getLevel(day.count)
                    return (
                      <div
                        key={di}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          borderRadius: 3,
                          backgroundColor: level === 0 ? 'var(--contribution-0)' :
                            `var(--contribution-${level})`,
                          cursor: day.count > 0 ? 'pointer' : 'default',
                          transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (day.count === 0) return
                          const rect = e.target.getBoundingClientRect()
                          setTooltip({
                            x: rect.left,
                            y: rect.top - 10,
                            date: day.date,
                            count: day.count,
                            logs: logsByDate[day.date] || []
                          })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 12 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginRight: 4 }}>Less</span>
          {[0, 1, 2, 3, 4].map(l => (
            <div key={l} style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: 3,
              backgroundColor: `var(--contribution-${l})`
            }} />
          ))}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 4 }}>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(tooltip.x, window.innerWidth - 300),
            top: Math.max(tooltip.y - 40, 10),
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            padding: 12,
            minWidth: 220,
            maxWidth: 300,
            zIndex: 10000,
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{tooltip.date}</strong>
            <span>{tooltip.count} action{tooltip.count !== 1 ? 's' : ''}</span>
          </div>
          {tooltip.logs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tooltip.logs.slice(0, 8).map((log, i) => (
                <div key={log.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginTop: 1,
                    background: log.action === 'add' ? 'rgba(56, 161, 105, 0.15)' :
                      log.action === 'delete' ? 'rgba(229, 62, 62, 0.15)' :
                      log.action === 'edit' ? 'rgba(0, 82, 255, 0.1)' :
                      log.action === 'archive' ? 'rgba(214, 158, 46, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                    color: log.action === 'add' ? 'var(--success)' :
                      log.action === 'delete' ? 'var(--danger)' :
                      log.action === 'edit' ? 'var(--accent-primary)' :
                      log.action === 'archive' ? 'var(--warning)' : 'var(--text-muted)'
                  }}>
                    {log.action.replace('_', ' ')}
                  </span>
                  <span style={{ wordBreak: 'break-word' }}>
                    {log.description?.length > 60 ? log.description.slice(0, 60) + '...' : log.description}
                  </span>
                </div>
              ))}
              {tooltip.logs.length > 8 && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
                  +{tooltip.logs.length - 8} more
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
