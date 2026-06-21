import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function QuantityChart({ products }) {
  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        No data to display
      </div>
    )
  }

  const categoryMap = {}
  products.forEach(p => {
    if (!p.category) return
    categoryMap[p.category] = (categoryMap[p.category] || 0) + p.quantity
  })

  const data = Object.entries(categoryMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border-color)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            fontSize: '0.8125rem',
            boxShadow: 'var(--shadow-md)'
          }}
          labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}
        />
        <Bar dataKey="quantity" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
