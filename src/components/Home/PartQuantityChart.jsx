import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']

export default function PartQuantityChart({ products }) {
  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        No data to display
      </div>
    )
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const categoryColorMap = {}
  categories.forEach((cat, i) => {
    categoryColorMap[cat] = COLORS[i % COLORS.length]
  })

  const data = products
    .filter(p => p.part_number)
    .map(p => ({
      name: p.part_number,
      quantity: p.quantity,
      category: p.category
    }))
    .sort((a, b) => b.quantity - a.quantity)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
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
          formatter={(value, name, props) => [value, `${props.payload.category} - Qty`]}
        />
        <Bar dataKey="quantity" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell key={index} fill={categoryColorMap[entry.category] || 'var(--chart-5)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
