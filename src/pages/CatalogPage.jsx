import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import ProductCardGrouped from '../components/product/ProductCardGrouped';
import FilterPanel from '../components/filters/FilterPanel';
import { getProducts } from '../services/productService';
import { CATEGORIES } from '../utils/constants';
import { groupProducts } from '../utils/productGrouping';

export default function CatalogPage() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const isOfferQuery = searchParams.get('ofertas') === 'true';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  const categoryName = categoryId 
    ? CATEGORIES.find(c => c.id === categoryId)?.name || 'Catálogo'
    : isOfferQuery ? 'Ofertas' : 'Catálogo Completo';

  useEffect(() => {
    // Reset filters when category changes
    setFilters({});
  }, [categoryId]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const queryFilters = { ...filters };
        if (categoryId) queryFilters.category = categoryId;
        if (isOfferQuery) queryFilters.isOffer = true;

        const data = await getProducts(queryFilters);
        setProducts(data);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryId, isOfferQuery, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Local filtering for array values (brand, subcategory, specs)
  const filteredProducts = products.filter(p => {
    // Check array filters (Brand, Subcategory, Formato, Placa, etc)
    for (const [key, values] of Object.entries(filters)) {
      if (!values || (Array.isArray(values) && values.length === 0) || key === 'pesoMin' || key === 'pesoMax') continue;

      const valArray = Array.isArray(values) ? values : [values];

      if (key === 'brand') {
        if (!p.brand || !valArray.some(v => v.toLowerCase() === p.brand.toLowerCase())) return false;
      } else if (key === 'subcategory') {
        if (!p.subcategory || !valArray.some(v => v.toLowerCase() === p.subcategory.toLowerCase())) return false;
      } else if (key === 'category') {
        if (!p.category || !valArray.some(v => v.toLowerCase() === p.category.toLowerCase())) return false;
      } else {
        // Specs filters (paletas)
        const specVal = p.specs ? p.specs[key] : null;
        if (!specVal || !valArray.some(v => v.toLowerCase() === String(specVal).toLowerCase())) return false;
      }
    }

    // Check Range filters (Peso)
    if (filters.pesoMin && p.specs?.peso_min) {
      if (p.specs.peso_max < parseInt(filters.pesoMin)) return false;
    }
    if (filters.pesoMax && p.specs?.peso_max) {
      if (p.specs.peso_min > parseInt(filters.pesoMax)) return false;
    }

    return true;
  });

  // Agrupar productos si la categoría lo requiere (zapatillas / indumentaria)
  const groupedProducts = useMemo(() => {
    return groupProducts(filteredProducts, categoryId);
  }, [filteredProducts, categoryId]);

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: 'var(--space-3xl)' }}>
      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside>
          <FilterPanel 
            category={categoryId} 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </aside>

        {/* Main Content */}
        <main>
          <div className="catalog-header">
            <h1 className="section-title" style={{ fontSize: 'var(--font-2xl)', margin: 0 }}>{categoryName}</h1>
            <span className="catalog-count">
              {groupedProducts.length} {(categoryId === 'zapatillas' || categoryId === 'indumentaria') ? 'modelos' : 'productos'}
            </span>
          </div>

          {loading ? (
            <div className="grid-stories">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton skeleton-image" style={{ borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No encontramos productos</h3>
              <p>No hay productos que coincidan con los filtros seleccionados.</p>
              <button className="btn btn-primary" onClick={handleClearFilters}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid-stories">
              {groupedProducts.map((item, i) =>
                item.isGroup ? (
                  <ProductCardGrouped key={item.id} group={item} index={i} />
                ) : (
                  <ProductCard key={item.id} product={item} index={i} />
                )
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
