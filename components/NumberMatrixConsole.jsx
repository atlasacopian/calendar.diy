import React, { useMemo } from 'react'

export default function NumberMatrixConsole({ rows = 12, cols = 6 }) {
  const data = useMemo(() => {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() * 10).toFixed(2))
    )
  }, [])

  const cellStyle = (val) => ({
    padding: '2px 4px',
    fontSize: 11,
    color: val >= 5 ? '#00ff00' : '#ff4d4d',
  })

  return (
    <div style={{ overflow: 'auto', height: '100%', padding: 4 }}>
      {data.map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
          {row.map((val, j) => (
            <div key={j} style={cellStyle(val)}>
              {val}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
} 