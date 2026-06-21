import { useState, useMemo } from 'react'
import { formatDate } from '../../utils/helpers'

const DAY_NAMES = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ContributionGraph({ logs }) {
  const [tooltip, setTooltip] = useState(null)

  const { weeks, totalDays } = useMemo(() => {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setDate(oneYearAgo.getDate() - 364)
    oneYearAgo.setHours(0, 0, 0, 0)

    const dayCounts = {}
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      dayCounts[key] = 0
    }

    ;(logs || []).forEach(log => {
      if (!log.created_at) return
      const key = new Date(log.created_at).toISOString().split('T')[0]
      if (dayCounts[key] !== undefined) {
        dayCounts[key]++
      }
    })

    const weeks = []
    let currentWeek = []
    const startDay = oneYearAgo.getDay()

    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null)
    }

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      currentWeek.push({
        date: key,
        count: dayCounts[key] || 0,
        day: d.getDate(),
        month: d.getMonth()
      })
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null)
      weeks.push(currentWeek)
    }

    return { weeks, totalDays: Object.keys(dayCounts).length }
  }, [logs])

  const getLevel = (count) => {
    if (count === 0) return 0
    if (count <= 1) return 1
    if (count <= 3) return 2
    if (count <= 6) return 3
    return 4
  }

  const today = new Date()
  const currentMonth = today.getMonth()

  const months = useMemo(() => {
    const m = []
    const startMonth = new Date(today)
    startMonth.setDate(startMonth.getDate() - 364)
    for (let i = 0; i < 12; i++) {
      const idx = (startMonth.getMonth() + i) % 12
      m.push(MONTH_NAMES[idx])
    }
    return m
  }, [today])

  const logsByDate = useMemo(() => {
    const map = {}
    ;(logs || []).forEach(log => {
      if (!log.created_at) return
      const key = new Date(log.created_at).toISOString().split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(log)
    })
    return map
  }, [logs])

  return (
    <div className="card contribution-card">
      <div className="contribution-header">
        <h3>Activity Timeline</h3>
        <span className="contribution-subtitle">{logs?.length || 0} actions in the last year</span>
      </div>

      <div className="contribution-graph">
        <div className="contribution-months">
          {weeks.length > 0 && weeks[0].map((day, idx) => {
            if (!day) return <span key={idx} />
            if (idx < MONTH_NAMES.length) {
              const showMonth = day.date && weeks.some((w, wi) => {
                const d = wi === 0 ? null : null
                return false
              })
            }
            return null
          })}
          <div className="months-row">
            {(() => {
              const months = []
              const start = new Date(today)
              start.setDate(start.getDate() - 364)
              for (let i = 0; i < 12; i++) {
                const m = new Date(start)
                m.setMonth(m.getMonth() + i)
                months.push(MONTH_NAMES[m.getMonth()])
              }
              const positions = []
              weeks.forEach((week, wi) => {
                week.forEach((day, di) => {
                  if (day && day.date) {
                    const d = new Date(day.date)
                    if (d.getDate() === 1) {
                      positions.push({ idx: wi, name: MONTH_NAMES[d.getMonth()] })
                    }
                  }
                })
              })
              return positions.map((p, i) => (
                <span key={i} style={{ position: 'absolute', left: p.idx * 14 + 30, top: -4, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {p.name}
                </span>
              ))
            })()}
          </div>
        </div>

        <div className="contribution-weeks">
          <div className="day-labels">
            {DAY_NAMES.map((d, i) => (
              <span key={i} className="day-label">{d}</span>
            ))}
          </div>
          <div className="weeks-container">
            {weeks.map((week, wi) => (
              <div key={wi} className="week-column">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="contribution-cell empty" />
                  const level = getLevel(day.count)
                  return (
                    <div
                      key={di}
                      className={`contribution-cell level-${level}`}
                      onMouseEnter={(e) => {
                        const logs = logsByDate[day.date] || []
                        setTooltip({
                          x: e.target.getBoundingClientRect().left,
                          y: e.target.getBoundingClientRect().top - 10,
                          date: day.date,
                          count: day.count,
                          logs
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="contribution-legend">
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Less</span>
          {[0, 1, 2, 3, 4].map(l => (
            <div key={l} className={`contribution-cell level-${l}`} style={{ width: 12, height: 12 }} />
          ))}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>

      {tooltip && (
        <>
          <div className="contribution-tooltip-bg" onClick={() => setTooltip(null)} />
          <div
            className="contribution-tooltip"
            style={{
              position: 'fixed',
              left: Math.min(tooltip.x - 100, window.innerWidth - 240),
              top: Math.max(tooltip.y - 150, 10),
              zIndex: 1000
            }}
          >
            <div className="tooltip-header">
              <strong>{tooltip.date}</strong>
              <span>{tooltip.count} action(s)</span>
            </div>
            {tooltip.logs.length > 0 && (
              <div className="tooltip-logs">
                {tooltip.logs.slice(0, 8).map((log, i) => (
                  <div key={log.id || i} className="tooltip-log-item">
                    <span className={`tooltip-action-badge action-${log.action}`}>{log.action}</span>
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
        </>
      )}
    </div>
  )
}
