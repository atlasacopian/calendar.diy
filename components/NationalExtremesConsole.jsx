import React, { useEffect, useState } from 'react'

export default function NationalExtremesConsole() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/extremes')
      .then(async r => {
        if (!r.ok) throw new Error('resp')
        return r.json()
      })
      .then(setData)
      .catch(() => setError('ERR'))
  }, [])

  if (error) return <div style={{ fontSize: 12, color: '#888', padding: 8 }}>Error loading extremes</div>
  if (!data) return <div style={{ fontSize: 12, color: '#888', padding: 8 }}>Loading...</div>

  const block = (label, obj) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: '#aaa', fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 12 }}>
        {obj?.brand ? obj.brand + ' – ' : ''}{obj?.name ?? obj?.store_id} – {obj?.city ?? ''}{obj?.state ? `, ${obj.state}` : ''}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        {obj && obj.price != null ? `$${obj.price.toFixed(2)}` : 'N/A'}
      </div>
    </div>
  )

  const avgBlock = (label, value, date) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: '#aaa', fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        {value != null ? `$${value.toFixed(2)}` + (date ? ` (${new Date(date).toLocaleDateString()})` : '') : 'N/A'}
      </div>
    </div>
  )

  return (
    <div style={{ fontSize: 12, color: '#fff', padding: 6 }}>
      {block('CHEAPEST REG', data.cheapest_regular)}
      {block('CHEAPEST ORG', data.cheapest_organic)}
      {block('PRICIEST REG', data.priciest_regular)}
      {block('PRICIEST ORG', data.priciest_organic)}
      {avgBlock('NATIONAL AVG REG', data.avgRegNat, data.avgRegNatDate)}
      {avgBlock('NATIONAL AVG ORG', data.avgOrgNat, data.avgOrgNatDate)}
      <div style={{ fontSize: 10, color: '#888' }}>Updated {new Date(data.generated_at).toLocaleString()}</div>
      <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Sources: FRED (regular prices), USDA (organic prices)</div>
    </div>
  )
} 