/**
 * BrainView — Vista Cerebro del Conocimiento
 * 
 * Usa Cytoscape.js para visualizar el grafo de conocimiento
 * como un cerebro interconectado.
 */

import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface Node {
  id: string;
  label: string;
  type?: string;
}

interface Edge {
  source: string;
  target: string;
  relationship: string;
}

interface BrainViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
}

export function BrainView({ nodes, edges, onNodeClick }: BrainViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Create new instance
    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': '#7c3aed',
            'color': '#fff',
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 40,
            'height': 40,
            'shape': 'ellipse',
          },
        },
        {
          selector: 'node[type="concept"]',
          style: {
            'background-color': '#3b82f6',
            'width': 35,
            'height': 35,
          },
        },
        {
          selector: 'node[type="feature"]',
          style: {
            'background-color': '#10b981',
            'width': 35,
            'height': 35,
          },
        },
        {
          selector: 'node[type="issue"]',
          style: {
            'background-color': '#f59e0b',
            'width': 30,
            'height': 30,
            'shape': 'diamond',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: ':selected',
          style: {
            'background-color': '#f43f5e',
            'line-color': '#f43f5e',
            'target-arrow-color': '#f43f5e',
          },
        },
      ],
      });

    // Add nodes
    cy.add(nodes.map(n => ({
      data: { id: n.id, label: n.label, type: n.type || 'default' },
    })));

    // Add edges
    cy.add(edges.map(e => ({
      data: { source: e.source, target: e.target, relationship: e.relationship },
    })));

    // Layout: breadthfirst (cerebro-like)
    cy.layout({
      name: 'breadthfirst',
      directed: true,
      padding: 10,
      spacingFactor: 1.5,
    }).run();

    // Click handler
    if (onNodeClick) {
      cy.on('tap', 'node', (evt) => {
        onNodeClick(evt.target.id());
      });
    }

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        background: '#0f172a',
        borderRadius: 8,
      }}
    />
  );
}

export default BrainView;