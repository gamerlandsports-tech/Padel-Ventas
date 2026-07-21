import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import FilterPanel from '../components/filters/FilterPanel';
import { getProducts } from '../services/productService';
import { CATEGORIES } from '../utils/constants';

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

  // Local filtering for array values (since Firestore array-contains-any has limits)
  const filteredProducts = products.filter(p => {
    let match = true;
    
    // Check array filters (Brand, Formato, Placa, etc)
    Object.entries(filters).forEach(([key, values]) => {
      // Skip range filters or empty arrays
      if (!values || (Array.isArray(values) && values.length === 0) || key === 'pesoMin' || key === 'pesoMax') return;
      
      if (key === 'brand' || key === 'subcategory') {
        if (!values.includes(p[key])) match = false;
      } else if (p.specs && p.specs[key]) {
        // Specs filters (paletas)
        if (!values.includes(p.specs[key])) match = false;
      } else {
        // If product doesn't have the spec but filter is active
        match = false;
      }
    });

    // Check Range filters (Peso)
    if (filters.pesoMin && p.specs?.peso_min) {
      if (p.specs.peso_max < parseInt(filters.pesoMin)) match = false;
    }
    if (filters.pesoMax && p.specs?.peso_max) {
      if (p.specs.peso_min > parseInt(filters.pesoMax)) match = false;
    }

    return match;
  });

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
            <span className="catalog-count">{filteredProducts.length} productos</span>
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
              {filteredProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
