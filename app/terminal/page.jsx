'use client'

import React, { useState, useEffect } from 'react'
import TerminalConsole from '../../components/TerminalConsole'
import EggLineChart from '../../components/EggLineChart'
import EggBarChart from '../../components/EggBarChart'
import EggMultiLineChart from '../../components/EggMultiLineChart'
import NationalAvgLineChart from '../../components/NationalAvgLineChart'
import StorePriceConsole from '../../components/StorePriceConsole'
import StoreHistoryConsole from '../../components/StoreHistoryConsole'
import TickerStrip from '../../components/TickerStrip'
import NumberMatrixConsole from '../../components/NumberMatrixConsole'
import TerminalBoard from '../../components/TerminalBoard'
import NationalExtremesConsole from '../../components/NationalExtremesConsole'

export default function TerminalPage() {
  const [view, setView] = useState('local');
  const [selectedStore, setSelectedStore] = useState(null);
  const [hoveredStore, setHoveredStore] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().toUpperCase());
    }, 1000);
    setCurrentTime(new Date().toUTCString().toUpperCase());
    return () => clearInterval(timer);
  }, []);

  const tickerConsole = {
    key: 'ticker',
    title: 'TICKER',
    col: 4,
    row: 1,
    content: (
      <TickerStrip
        text="REG DOZEN $6.23 <span style='color:#00FF00'>▲</span> | ORG DOZEN $6.98 <span style='color:#FF0000'>▼</span> • 123 STORES • 45 ZIPS • CAGE-FREE $7.54 <span style='color:#FF0000'>▼</span>"
        fontSize="11px"
      />
    )
  }

  const nationalConsoles = [
    { key: 'natPrice', title: 'NATIONAL PRICE TREND', col:6, row:2, content: <EggLineChart basePrice={4.6} /> },
    { key: 'natSpread', title: 'NATIONAL AVG TREND', col:6, row:2, content: <NationalAvgLineChart /> },
    { key: 'natVolume', title: 'DAILY VOLUME', col:3, row:2, content: <EggBarChart /> },
    { key: 'heatmap', title: 'REGIONAL HEAT', col:3, row:2, content: <div style={{ padding: 8, color: '#888' }}>[ MAP COMING SOON ]</div> },
    { key: 'distribution', title: 'PRICE DISTRIBUTION', col:3, row:2, content: <EggBarChart /> },
    { key: 'matrix', title: 'MKT MATRIX', col:3, row:2, content: <NumberMatrixConsole rows={10} cols={5} /> },
    { key: 'metrics', title: 'KEY METRICS', col:4, row:2, content: (
        <div style={{ fontSize: 12, padding: 8 }}>
          <div>52W HIGH: $7.10</div><div>52W LOW: $3.25</div>
          <div>AVG COST: $4.92</div><div>YOY CHANGE: +12.7%</div>
        </div>
      ) },
    { key: 'extremes', title: 'PRICE EXTREMES', col:4, row:4, content: <NationalExtremesConsole /> },
    { key: 'news', title: 'EGG NEWSWIRE', col:4, row:2, content: (
        <div style={{ fontSize: 11, lineHeight: 1.4, padding: 8 }}>
          <div style={{ color: '#ffffff' }}>04:23 UTC BREAKING</div>
          <div>Free-range prices surge after shell shortage.</div>
        </div>
      ) },
    tickerConsole,
  ]

  const localConsoles = [
    { key: 'storeList', title: 'NEARBY STORES', col:7, row:4, content: <StorePriceConsole onSelect={setSelectedStore} onHover={setHoveredStore} selectedId={selectedStore?.store_identifier} hoveredId={hoveredStore?.store_identifier} /> },
    { key: 'storeHist', title: 'STORE HISTORY', col:5, row:4, content: <StoreHistoryConsole store={hoveredStore || selectedStore} /> },
    { key: 'locPrice', title: 'LOCAL PRICE', col:7, row:2, content: <EggLineChart basePrice={4.9} /> },
    { key: 'orderBook', title: 'EGG ORDER BOOK', col:5, row:2, content: (
        <div style={{ fontSize: 12, lineHeight: 1.4, padding: 8 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <span style={{ color: i % 2 === 0 ? '#00aa00' : '#dd0000' }}>
                {(Math.random() * 10).toFixed(2)}
              </span>{' '}<span>{(Math.random() * 1000).toFixed(0)}</span>
            </div>
          ))}
        </div>
      ) },
    tickerConsole,
  ]

  return (
    <div
      style={{
        background: '#000',
        color: '#fff',
        minHeight: '100vh',
        padding: '8px 8px 24px',
        fontFamily: 'Roboto Mono, monospace',
      }}
    >
      {/* Top bar with toggle */}
      <div style={{ position:'relative', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        {/* Toggle buttons */}
        <div>
          {['local', 'national'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? '#ffffff' : 'transparent',
                color: view === v ? '#000' : '#fff',
                border: '1px solid #666',
                padding: '4px 10px',
                fontSize: 12,
                marginRight: 6,
                cursor: 'pointer',
              }}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Clock */}
        <div style={{ position:'absolute', right:0, fontSize: 12, color: '#ffffff', textTransform: 'uppercase' }}>{currentTime}</div>
      </div>

      {/* Single Board based on toggle */}
      <div style={{ height: 'calc(100vh - 110px)' }}>
        {view === 'local' ? (
          <TerminalBoard consoles={localConsoles} />
        ) : (
          <TerminalBoard consoles={nationalConsoles} />
        )}
      </div>
    </div>
  )
} 