import { useState, useMemo } from 'react'

const DAY_NAMES = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getLevel(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

export default function ContributionGraph({ logs }) {
  const [tooltip, setTooltip] = useState(null)

  const { weeks, monthPositions, logsByDate, totalActions } = useMemo(() => {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setDate(oneYearAgo.getDate() - 364)
    oneYearAgo.setHours(0, 0, 0, 0)

    const dayCounts = {}
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      dayCounts[d.toISOString().split('T')[0]] = 0
    }

    ;(logs || []).forEach(log => {
      if (!log.created_at) return
      try {
        const key = new Date(log.created_at).toISOString().split('T')[0]
        if (dayCounts[key] !== undefined) dayCounts[key]++
      } catch (e) {}
    })

    const weeks = []
    let currentWeek = []
    const startDay = oneYearAgo.getDay()
    for (let i = 0; i < startDay; i++) currentWeek.push(null)

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
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
          const d = new Date(day.date + 'T12:00:00')
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
        const key = new Date(log.created_at).toISOString().split('T')[0]
        if (!logsByDate[key]) logsByDate[key] = []
        logsByDate[key].push(log)
      } catch (e) {}
    })

    return { weeks, monthPositions, logsByDate, totalActions: logs?.length || 0 }
  }, [logs])

  const CELL_SIZE = 13
  const CELL_GAP = 3
  const COL_WIDTH = CELL_SIZE + CELL_GAP

  return (
    <div className="card contribution-card">
      <div className="contribution-header">
        <h3>Activity Timeline</h3>
        <span className="contribution-subtitle">{totalActions} action{totalActions !== 1 ? 's' : ''} in the last year</span>
      </div>

      <div className="contribution-graph">
        {/* Month labels */}
        <div className="contribution-months" style={{ marginLeft: 28, marginBottom: 4, position: 'relative', height: 16 }}>
          {monthPositions.map((p, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: p.idx * COL_WIDTH,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap'
              }}
            >
              {p.name}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP, paddingRight: 4, width: 28 }}>
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
          <div style={{ display: 'flex', gap: CELL_GAP, overflowX: 'auto', paddingBottom: 4 }}>
            {weeks.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No data</div>
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
                          backgroundColor: `var(--contribution-${level})`,
                          cursor: 'pointer',
                          transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={(e) => {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 8 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginRight: 4 }}>Less</span>
          {[0, 1, 2, 3, 4].map(l => (
            <div
              key={l}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 3,
                backgroundColor: `var(--contribution-${l})`
              }}
            />
          ))}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 4 }}>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="contribution-tooltip"
          style={{
            position: 'fixed',
            left: Math.min(tooltip.x, window.innerWidth - 300),
            top: Math.max(tooltip.y - 40, 10),
            zIndex: 10000,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-header">
            <strong>{tooltip.date}</strong>
            <span>{tooltip.count} action{tooltip.count !== 1 ? 's' : ''}</span>
          </div>
          {tooltip.logs.length > 0 && (
            <div className="tooltip-logs">
              {tooltip.logs.slice(0, 8).map((log, i) => (
                <div key={log.id || i} className="tooltip-log-item">
                  <span className={`tooltip-action-badge action-${log.action}`}>{log.action.replace('_', ' ')}</span>
                  <span className="tooltip-log-desc">
                    {log.description?.length > 60
                      ? log.description.slice(0, 60) + '...'
                      : log.description}
                  </span>
                </div>
              ))}
              {tooltip.logs.length > 8 && (
                <div className="tooltip-more">+{tooltip.logs.length - 8} more</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}