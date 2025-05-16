import React from 'react'

export default function TerminalConsole({ title, children, style }) {
  return (
    <div
      style={{
        border: '1px solid #444',
        background: '#000000',
        color: '#ffffff',
        fontFamily: 'Roboto Mono, monospace',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div
        style={{
          background: '#111111',
          borderBottom: '1px solid #444',
          padding: '4px 8px',
          fontSize: 12,
          fontWeight: 600,
          color: '#ffffff',
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  )
} 