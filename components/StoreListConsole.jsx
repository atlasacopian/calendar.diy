import React from 'react'

export default function StoreListConsole({ count = 8 }) {
  const stores = Array.from({ length: count }, (_, i) => ({
    name: `Store #${i + 1}`,
    price: (3.5 + Math.random() * 2).toFixed(2),
    change: (Math.random() * 0.4 - 0.2).toFixed(2),
  }))

  return (
    <table style={{ width: '100%', fontSize: 12 }}>
      <thead>
        <tr>
          <th align="left">STORE</th>
          <th align="right">PRICE</th>
          <th align="right">Δ</th>
        </tr>
      </thead>
      <tbody>
        {stores.map((s, i) => (
          <tr key={i}>
            <td>{s.name}</td>
            <td align="right">${s.price}</td>
            <td align="right" style={{ color: s.change >= 0 ? '#00aa00' : '#dd0000' }}>
              {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
} 