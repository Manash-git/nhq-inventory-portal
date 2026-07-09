import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PartQuantityChart({ products }) {
  const data = products
    .slice()
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 15)
    .map(p => ({
      name: p.product_description?.length > 25 ? p.product_description.slice(0, 25) + '...' : p.product_description,
      quantity: p.quantity,
      part: p.part_number
    }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-light)' }} />
        <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={{ stroke: 'var(--border-light)' }} width={150} />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13
          }}
          formatter={(value, name, props) => [value, props.payload.part || 'Quantity']}
        />
        <Bar dataKey="quantity" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}