import { useState } from 'react';
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import {
  BRANDS,
  PALETA_FORMATOS,
  PALETA_PLACAS,
  PALETA_NUCLEOS,
  PALETA_NIVELES,
  PALETA_TEXTURAS,
  ACCESORIOS_SUBCATEGORIES,
} from '../../utils/constants';

export default function FilterPanel({ category, filters, onFilterChange, onClear }) {
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    subcategory: true,
    formato: true,
    placa: true,
    nucleo: true,
    nivel: true,
    textura: true,
    peso: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(key, updated);
  };

  const setRangeFilter = (key, value) => {
    onFilterChange(key, value);
  };

  const activeCount = Object.values(filters).reduce((acc, val) => {
    if (Array.isArray(val)) return acc + val.length;
    if (val) return acc + 1;
    return acc;
  }, 0);

  const isPaletas = category === 'paletas';
  const isAccesorios = category === 'accesorios';

  return (
    <div className="filter-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={18} />
          Filtros
          {activeCount > 0 && (
            <span className="badge badge-cyan">{activeCount}</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {activeCount > 0 && (
        <div className="active-filters">
          {Object.entries(filters).map(([key, values]) => {
            if (!values || (Array.isArray(values) && values.length === 0)) return null;
            const valArr = Array.isArray(values) ? values : [values];
            return valArr.map((val) => (
              <span
                key={`${key}-${val}`}
                className="active-filter-tag"
                onClick={() => toggleFilter(key, val)}
              >
                {val}
                <span className="remove"><X size={12} /></span>
              </span>
            ));
          })}
        </div>
      )}

      {/* Subcategorías (solo Accesorios) */}
      {isAccesorios && (
        <FilterSection
          title="Subcategoría"
          expanded={expandedSections.subcategory}
          onToggle={() => toggleSection('subcategory')}
        >
          <div className="filter-chips">
            {ACCESORIOS_SUBCATEGORIES.map((sub) => (
              <button
                key={sub.id}
                className={`filter-chip ${(filters.subcategory || []).includes(sub.id) ? 'active' : ''}`}
                onClick={() => toggleFilter('subcategory', sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Marca */}
      <FilterSection
        title="Marca"
        expanded={expandedSections.brand}
        onToggle={() => toggleSection('brand')}
      >
        <div className="filter-chips">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              className={`filter-chip ${(filters.brand || []).includes(brand) ? 'active' : ''}`}
              onClick={() => toggleFilter('brand', brand)}
            >
              {brand}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Filtros de Paletas */}
      {isPaletas && (
        <>
          <FilterSection
            title="Formato"
            expanded={expandedSections.formato}
            onToggle={() => toggleSection('formato')}
          >
            <div className="filter-chips">
              {PALETA_FORMATOS.map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${(filters.formato || []).includes(f) ? 'active' : ''}`}
                  onClick={() => toggleFilter('formato', f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Placa"
            expanded={expandedSections.placa}
            onToggle={() => toggleSection('placa')}
          >
            <div className="filter-chips">
              {PALETA_PLACAS.map((p) => (
                <button
                  key={p}
                  className={`filter-chip ${(filters.placa || []).includes(p) ? 'active' : ''}`}
                  onClick={() => toggleFilter('placa', p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Núcleo"
            expanded={expandedSections.nucleo}
            onToggle={() => toggleSection('nucleo')}
          >
            <div className="filter-chips">
              {PALETA_NUCLEOS.map((n) => (
                <button
                  key={n}
                  className={`filter-chip ${(filters.nucleo || []).includes(n) ? 'active' : ''}`}
                  onClick={() => toggleFilter('nucleo', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Nivel de Juego"
            expanded={expandedSections.nivel}
            onToggle={() => toggleSection('nivel')}
          >
            <div className="filter-chips">
              {PALETA_NIVELES.map((n) => (
                <button
                  key={n}
                  className={`filter-chip ${(filters.nivel || []).includes(n) ? 'active' : ''}`}
                  onClick={() => toggleFilter('nivel', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Textura"
            expanded={expandedSections.textura}
            onToggle={() => toggleSection('textura')}
          >
            <div className="filter-chips">
              {PALETA_TEXTURAS.map((t) => (
                <button
                  key={t}
                  className={`filter-chip ${(filters.textura || []).includes(t) ? 'active' : ''}`}
                  onClick={() => toggleFilter('textura', t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Peso (gramos)"
            expanded={expandedSections.peso}
            onToggle={() => toggleSection('peso')}
          >
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Mín</label>
                <input
                  className="input"
                  type="number"
                  placeholder="340"
                  value={filters.pesoMin || ''}
                  onChange={(e) => setRangeFilter('pesoMin', e.target.value)}
                />
              </div>
              <span style={{ color: 'var(--text-muted)', marginTop: '20px' }}>—</span>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Máx</label>
                <input
                  className="input"
                  type="number"
                  placeholder="390"
                  value={filters.pesoMax || ''}
                  onChange={(e) => setRangeFilter('pesoMax', e.target.value)}
                />
              </div>
            </div>
          </FilterSection>
        </>
      )}
    </div>
  );
}

function FilterSection({ title, expanded, onToggle, children }) {
  return (
    <div className="filter-section">
      <div className="filter-section-title" onClick={onToggle}>
        {title}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {expanded && children}
    </div>
  );
}
