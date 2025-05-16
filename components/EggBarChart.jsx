import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const generateData = (n = 10) => {
  const arr = []
  for (let i = 0; i < n; i++) {
    arr.push({ x: `#${i + 1}`, price: +(Math.random() * 10).toFixed(2) })
  }
  return arr
}

export default function EggBarChart({ width, height }) {
  const data = useMemo(() => generateData(), [])

  return (
    <ResponsiveContainer width={width || '100%'} height={height || '100%'}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="x" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: '#222', border: 'none', color: '#fff', fontSize: 12 }}
          labelStyle={{ color: '#fff' }}
          cursor={{ fill: 'rgba(255,255,255,0.1)' }}
        />
        <Bar dataKey="price" fill="#007bff" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
} 