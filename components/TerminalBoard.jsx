import React from 'react'
import TerminalConsole from './TerminalConsole'

export default function TerminalBoard({ consoles, title }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridAutoRows: '100px',
          gap: 6,
        }}
      >
        {consoles.map(({ key, title, content, col = 3, row = 2 }) => (
          <TerminalConsole
            key={key}
            title={title}
            style={{ gridColumn: `span ${col}`, gridRow: `span ${row}` }}
          >
            {content}
          </TerminalConsole>
        ))}
      </div>
    </div>
  )
} 