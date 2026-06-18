import React from "react";

interface CoverRow {
  active: boolean;
  width: string;
}

interface CoverProps {
  rows?: CoverRow[];
  noMargin?: boolean;
}

const DEFAULT_ROWS: CoverRow[] = [
  { active: false, width: '60%' },
  { active: false, width: '47%' },
  { active: true,  width: '41%' },
  { active: false, width: '35%' },
  { active: false, width: '52%' },
];

export function Cover({ rows = DEFAULT_ROWS, noMargin = false }: CoverProps) {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      background: '#111113',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      marginBottom: noMargin ? '0' : '2rem',
    }}>
      {/* grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: [
          'repeating-linear-gradient(90deg, transparent, transparent 149px, rgba(255,255,255,0.05) 150px)',
          'repeating-linear-gradient(0deg, transparent, transparent 77px, rgba(255,255,255,0.05) 78px)',
        ].join(','),
      }} />
      {/* today line */}
      <div style={{
        position: 'absolute', left: '50%', top: '12px',
        transform: 'translateX(-50%)',
        width: '1px', height: 'calc(100% - 24px)',
        background: 'rgba(255,255,255,0.18)',
      }} />
      <div style={{
        position: 'absolute', left: 'calc(50% - 4px)', top: '10px',
        width: '9px', height: '9px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.35)',
      }} />
      {/* rows */}
      <div style={{
        position: 'absolute', inset: 0,
        padding: '28px 32px',
        display: 'flex', flexDirection: 'column',
        gap: '14px', justifyContent: 'center',
      }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
              background: row.active ? 'rgba(139,139,255,0.8)' : 'rgba(255,255,255,0.2)',
            }} />
            <div style={{
              height: '20px',
              width: row.width,
              borderRadius: '5px',
              background: row.active ? '#2b2b3d' : '#252528',
              border: row.active ? '0.75px solid rgba(108,108,255,0.55)' : 'none',
              boxShadow: row.active ? 'inset 0 0 0 9999px rgba(108,108,255,0.06)' : 'none',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
