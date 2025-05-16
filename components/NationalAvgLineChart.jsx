import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function NationalAvgLineChart({ width, height }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/national-history')
      .then(async res => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then(json => setData(json.data || []))
      .catch(err => {
        console.error('Error loading national history:', err)
        setError(true)
      })
  }, [])

  if (error) return <div style={{ fontSize: 12, color: '#888', padding: 8 }}>Error loading national history</div>
  if (!data) return <div style={{ fontSize: 12, color: '#888', padding: 8 }}>Loading national history...</div>
  if (!data.length) return <div style={{ fontSize: 12, color: '#888', padding: 8 }}>No national history data found</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width={width || '100%'} height={height || '100%'}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#222', border: 'none', color: '#fff', fontSize: 12 }}
              labelFormatter={label => new Date(label).toLocaleDateString()}
              formatter={(value, name) => [`$${value.toFixed(2)}`, name.toUpperCase()]}
              cursor={{ stroke: '#555', strokeWidth: 1 }}
            />
            <Line type="monotone" dataKey="regular" name="Regular" stroke="#00ff00" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="organic" name="Organic" stroke="#ff4d4d" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 10, color: '#888', padding: '4px 6px' }}>
        Source: USDA Weekly (usda_weekly_egg_prices)
      </div>
    </div>
  )
} 