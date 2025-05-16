import React, { useEffect, useState, useMemo } from 'react'

export default function StorePriceConsole({ zip = '90026', onSelect, selectedId, onHover, hoveredId }) {
  const [stores, setStores] = useState([])

  useEffect(() => {
    fetch(`/api/stores?zip=${zip}`)
      .then(r => r.json())
      .then(d => {
        // Assuming API returns regular_change and organic_change percentages
        setStores(d.stores || [])
      })
      .catch(() => {})
  }, [zip])

  const formatPrice = (p) => (p != null ? `$${p.toFixed(2)}` : 'N/A')
  
  const PriceChange = ({ change }) => {
    if (change == null || change === 0) return <span style={{color: '#888', marginLeft: 3}}>–</span>;
    const isPositive = change > 0;
    const color = isPositive ? '#00ff00' : '#ff4d4d';
    const arrow = isPositive ? '▲' : '▼';
    // Assuming change is a percentage like 2.5 for 2.5%
    return <span style={{ color, marginLeft: 3 }}>{arrow}{Math.abs(change).toFixed(1)}%</span>;
  };

  const PriceDiff = ({ diff }) => {
    if (diff == null || diff === 0) return <span style={{color: '#888', marginLeft: 3}}>–</span>;
    const isPositive = diff > 0;
    const color = isPositive ? '#00ff00' : '#ff4d4d';
    const sign = isPositive ? '+' : '-';
    return <span style={{ color, marginLeft: 3 }}>{sign}${Math.abs(diff).toFixed(2)}</span>;
  };

  const { minReg, minOrg } = useMemo(() => {
    let minReg = null, minOrg = null
    stores.forEach(s => {
      if (typeof s.regular_price === 'number' && (minReg == null || s.regular_price < minReg)) {
        minReg = s.regular_price
      }
      if (typeof s.organic_price === 'number' && (minOrg == null || s.organic_price < minOrg)) {
        minOrg = s.organic_price
      }
    })
    return { minReg, minOrg }
  }, [stores])

  const headerStyle = { fontSize: 12, color: '#aaa', padding: '4px 6px' }
  const rowStyle = {
    fontSize: 12,
    padding: '4px 6px',
  }
  const subStyle = { fontSize: 10, color: '#888', padding: '0 6px 6px' }
  const storeWrapperStyle = { cursor: 'pointer', borderBottom: '1px solid #222' }

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #444' }}>
        <div style={{ ...headerStyle, flex: 5 }}>STORE</div> {/* Increased flex for store name/address */}
        <div style={{ ...headerStyle, flex: 2, textAlign: 'right' }}>REG</div>
        <div style={{ ...headerStyle, flex: 2, textAlign: 'right' }}>ORG</div>
      </div>
      {stores.map((s, i) => (
        <div
          key={s.store_identifier || i}
          onClick={() => onSelect && onSelect(s)}
          onMouseEnter={() => onHover && onHover(s)}
          onMouseLeave={() => onHover && onHover(null)}
          style={{
            ...storeWrapperStyle,
            background: s.store_identifier === selectedId
              ? '#222'
              : s.store_identifier === hoveredId
                ? '#333'
                : 'transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ ...rowStyle, flex: 5 }}>{`${s.brand} - ${s.name}`}</div>
            <div style={{ ...rowStyle, flex: 2, textAlign: 'right' }}>
              {formatPrice(s.regular_price)}
              <PriceChange change={s.regular_change_vs_yesterday_min} />
              <PriceDiff diff={s.regular_diff_vs_yesterday_min} />
            </div>
            <div style={{ ...rowStyle, flex: 2, textAlign: 'right' }}>
              {formatPrice(s.organic_price)}
              <PriceChange change={s.organic_change_vs_yesterday_min} />
              <PriceDiff diff={s.organic_diff_vs_yesterday_min} />
            </div>
          </div>
          <div style={{ ...subStyle }}>
            {s.address} {s.distance != null ? `(${s.distance.toFixed(1)} mi)` : ''}
          </div>
        </div>
      ))}
      {/* Source attribution */}
      <div style={{ fontSize: 10, color: '#888', padding: '4px 6px' }}>
        Source: Supabase RPC (nearby_kroger_stores & nearby_target_stores)
      </div>
    </div>
  )
} 