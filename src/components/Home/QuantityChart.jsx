import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function QuantityChart({ products }) {
  const data = products.reduce((acc, p) => {
    const existing = acc.find(item => item.category === p.category)
    if (existing) {
      existing.quantity += p.quantity
    } else {
      acc.push({ category: p.category, quantity: p.quantity })
    }
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis dataKey="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-light)' }} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-light)' }} />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13
          }}
        />
        <Bar dataKey="quantity" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}