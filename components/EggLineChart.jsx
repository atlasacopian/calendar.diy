import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Generates an array of length n with incremental x and random y values around base
const defaultGenerateData = (n = 30, basePrice = 4) => {
  const arr = []
  let price = basePrice
  for (let i = 0; i < n; i++) {
    price += (Math.random() - 0.5) * 0.2 // small step
    arr.push({ x: i, price: +price.toFixed(2) })
  }
  return arr
}

export default function EggLineChart({ width, height, basePrice = 4, chartData }) {
  // Use provided chartData if available, otherwise generate default data
  const data = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return chartData.map((d, i) => ({ x: i, price: d.price, date: d.date })); // Assuming chartData is [{date, price}]
    }
    return defaultGenerateData(60, basePrice);
  }, [chartData, basePrice]);

  if (!data || data.length === 0) {
    return <div style={{fontSize: 12, color: '#888', padding: 8}}>No price data available for chart.</div>;
  }

  // Determine Y-axis domain dynamically if using real data, or fallback for generated data
  const yDomain = useMemo(() => {
    if (chartData && chartData.length > 0) {
      const prices = chartData.map(d => d.price);
      const minVal = Math.min(...prices);
      const maxVal = Math.max(...prices);
      const padding = (maxVal - minVal) * 0.1 || 0.5; // Add some padding or default if flat
      return [minVal - padding, maxVal + padding];
    }
    return [basePrice - 1, basePrice + 1]; // Fallback for generated data
  }, [chartData, basePrice]);

  return (
    <ResponsiveContainer width={width || '100%'} height={height || '100%'}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" hide /> 
        <YAxis domain={yDomain} hide />
        <Tooltip
          contentStyle={{ background: '#222', border: 'none', color: '#fff', fontSize: 12 }}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.date ? new Date(payload[0].payload.date).toLocaleDateString() : ''}
          formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
          cursor={{ stroke: '#555', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#00ff00"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false} // Consider true for dynamic data if preferred
        />
      </LineChart>
    </ResponsiveContainer>
  )
} 