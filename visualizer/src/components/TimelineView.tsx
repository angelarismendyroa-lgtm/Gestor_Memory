/**
 * TimelineView — Vista Temporal del Conocimiento
 * 
 * Muestra nodos en una vista temporal/horizontal.
 */

import React from 'react';

interface TimelineItem {
  id: string;
  date: string;
  content: string;
  type?: string;
}

interface TimelineViewProps {
  items: TimelineItem[];
  onItemClick?: (id: string) => void;
}

export function TimelineView({ items, onItemClick }: TimelineViewProps) {
  return (
    <div style={{ padding: 16 }}>
      {items.map((item, index) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item.id)}
          style={{
            display: 'flex',
            marginBottom: 16,
            cursor: 'pointer',
          }}
        >
          {/* Línea y punto */}
          <div style={{ position: 'relative', marginRight: 16 }}>
            <div
              style={{
                width: 2,
                height: '100%',
                background: '#334155',
                position: 'absolute',
                left: 8,
                top: 0,
              }}
            />
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: item.type === 'feature' ? '#10b981' : '#7c3aed',
                position: 'relative',
              }}
            />
          </div>
          
          {/* Contenido */}
          <div
            style={{
              flex: 1,
              background: '#1e293b',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#94a3b8',
                marginBottom: 4,
              }}
            >
              {item.date}
            </div>
            <div style={{ color: '#e2e8f0' }}>
              {item.content.slice(0, 150)}
              {item.content.length > 150 ? '...' : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TimelineView;