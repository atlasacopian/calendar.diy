import React, { useEffect, useState } from 'react'
import EggLineChart from './EggLineChart'

export default function StoreHistoryConsole({ store }) {
  const [historyData, setHistoryData] = useState(null)
  const [productType, setProductType] = useState('regular') // Could add a toggle later
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!store || !store.store_identifier) {
      setHistoryData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    fetch(`/api/price-history?store_id=${store.store_identifier}&product_type=${productType}`)
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Failed to parse error response" }))
          throw new Error(errData.error || `HTTP error! status: ${res.status}`);
        }
        return res.json()
      })
      .then(data => {
        setHistoryData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching store history:", err);
        setError(err.message);
        setIsLoading(false);
        setHistoryData(null); 
      });
  }, [store, productType])

  const storeName = store ? store.name : 'Selected Store';

  let content;
  if (!store || !store.store_identifier) {
    content = <div style={{ fontSize: 12, color: '#888', padding: 8 }}>Select a store to view history</div>;
  } else if (isLoading) {
    content = <div style={{ fontSize: 12, color: '#888', padding: 8 }}>Loading history for {storeName}...</div>;
  } else if (error) {
    content = <div style={{ fontSize: 12, color: '#ff4d4d', padding: 8 }}>Error: {error}</div>;
  } else if (!historyData || historyData.length === 0) {
    content = <div style={{ fontSize: 12, color: '#888', padding: 8 }}>No price history found for {storeName} ({productType}).</div>;
  } else {
    content = <EggLineChart chartData={historyData} />;
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, padding: '4px 6px', borderBottom: '1px solid #444', flexShrink: 0 }}>
        {storeName.toUpperCase()} - {productType.toUpperCase()} PRICE HISTORY 
        {/* TODO: Add toggle for productType here if desired */}
      </div>
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        {content}
      </div>
    </div>
  )
} 