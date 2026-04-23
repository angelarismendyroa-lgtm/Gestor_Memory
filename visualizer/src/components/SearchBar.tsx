/**
 * SearchBar — Barra de Búsqueda Semántica
 * 
 * Componente de búsqueda que se integra con el query engine.
 */

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, mode: 'semantic' | 'keyword' | 'hybrid') => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Buscar conocimiento...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'semantic' | 'keyword' | 'hybrid'>('semantic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, mode);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: 16 }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #334155',
          background: '#1e293b',
          color: '#e2e8f0',
          fontSize: 14,
          outline: 'none',
        }}
      />
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as any)}
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #334155',
          background: '#1e293b',
          color: '#e2e8f0',
          fontSize: 14,
          outline: 'none',
        }}
      >
        <option value="semantic">Semántica</option>
        <option value="keyword">Keywords</option>
        <option value="hybrid">Híbrida</option>
      </select>
      <button
        type="submit"
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          border: 'none',
          background: '#7c3aed',
          color: '#fff',
          fontSize: 14,
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Buscar
      </button>
    </form>
  );
}

export default SearchBar;