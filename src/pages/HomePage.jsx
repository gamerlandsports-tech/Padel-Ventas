import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { getOfferProducts, getFeaturedProducts } from '../services/productService';
import { CATEGORIES, BRANDS } from '../utils/constants';

export default function HomePage() {
  const [offerProducts, setOfferProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [offers, featured] = await Promise.all([
          getOfferProducts(4),
          getFeaturedProducts(8)
        ]);
        setOfferProducts(offers);
        setFeaturedProducts(featured);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="home-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>ELEVÁ TU JUEGO</h1>
          <p>La mejor selección de paletas y accesorios con tecnología de punta.</p>
          <Link to="/catalogo/paletas" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-md)' }}>
            Ver Paletas
          </Link>
        </div>
      </section>

      <div className="container" style={{ padding: 'var(--space-3xl) var(--space-lg)' }}>
        {/* Ofertas */}
        <section className="section-header" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div>
            <h2 className="section-title">🔥 Ofertas Destacadas</h2>
            <p className="section-subtitle">Precios increíbles por tiempo limitado</p>
          </div>
          <Link to="/catalogo?ofertas=true" className="btn btn-ghost">Ver todas</Link>
        </section>

        {loading ? (
          <div className="grid-stories mb-3xl">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton skeleton-image" style={{ borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <div className="grid-stories mb-3xl" style={{ marginBottom: 'var(--space-3xl)' }}>
            {offerProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {/* Categorías Principales */}
        <section className="section-header" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div>
            <h2 className="section-title">Categorías</h2>
          </div>
        </section>
        <div className="scroll-row" style={{ marginBottom: 'var(--space-3xl)' }}>
          {CATEGORIES.map((cat, i) => (
            <Link key={cat.id} to={`/catalogo/${cat.id}`} className="category-card" style={{ width: '180px', flexShrink: 0, animationDelay: `${i * 0.1}s` }}>
              <div className="category-card-content">
                <span className="category-card-icon">{cat.icon}</span>
                <span className="category-card-name">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Destacados */}
        <section className="section-header" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div>
            <h2 className="section-title">✨ Novedades</h2>
            <p className="section-subtitle">Lo último en llegar a la tienda</p>
          </div>
        </section>
        
        {loading ? (
          <div className="grid-stories mb-3xl">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton skeleton-image" style={{ borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <div className="grid-stories" style={{ marginBottom: 'var(--space-3xl)' }}>
            {featuredProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {/* Marcas */}
        <section className="section-header" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div>
            <h2 className="section-title">Marcas Oficiales</h2>
          </div>
        </section>
        <div className="scroll-row" style={{ paddingBottom: 'var(--space-2xl)' }}>
          {BRANDS.slice(0, 8).map((brand, i) => (
            <div key={brand} className="glass" style={{ padding: 'var(--space-lg) var(--space-2xl)', borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', fontWeight: '700', letterSpacing: '2px', color: 'var(--text-secondary)' }}>
              {brand}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
