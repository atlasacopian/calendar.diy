import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const colors = ['#00ff00', '#ff0000', '#007bff', '#ffff00']

const generateData = (n = 60, base = 4) => {
  const data = []
  let series = [base, base + 0.3, base - 0.4, base + 0.6]
  for (let i = 0; i < n; i++) {
    series = series.map(s => s + (Math.random() - 0.5) * 0.15)
    data.push({ x: i, ...Object.fromEntries(series.map((v, idx) => [`s${idx}`, +v.toFixed(2)])) })
  }
  return data
}

export default function EggMultiLineChart({ width, height, base = 4 }) {
  const data = useMemo(() => generateData(90, base), [base])

  return (
    <ResponsiveContainer width={width || '100%'} height={height || '100%'}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="x" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: '#222', border: 'none', color: '#fff', fontSize: 12 }}
          labelStyle={{ color: '#fff' }}
          cursor={{ stroke: '#555', strokeWidth: 1 }}
        />
        {colors.map((c, idx) => (
          <Line
            key={idx}
            type="monotone"
            dataKey={`s${idx}`}
            stroke={c}
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
} 