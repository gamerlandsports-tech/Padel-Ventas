import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Check, Shield, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductById } from '../services/productService';
import { formatPrice } from '../utils/formatters';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { addItem, openCart } = useCart();
  const { isAuthenticated, isWholesale } = useAuth();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await getProductById(id);
        setProduct(data);
        setActiveImage(0);
        setQuantity(1);
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container loading-page">
        <div className="spinner spinner-lg"></div>
        <span className="loading-text">Cargando producto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container empty-state">
        <div className="empty-state-icon">😕</div>
        <h3>Producto no encontrado</h3>
        <p>El producto que estás buscando no existe o fue removido.</p>
        <Link to="/catalogo" className="btn btn-primary">Volver al catálogo</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    openCart();
  };

  const images = product.images?.length > 0 ? product.images : [
    `https://placehold.co/600x600/12121a/00f0ff?text=${encodeURIComponent(product.name)}`
  ];

  const showWholesale = isWholesale;
  const currentPrice = product.isOffer
    ? (showWholesale ? product.offerPriceWholesale : product.offerPriceRetail) || (showWholesale ? product.priceWholesale : product.priceRetail)
    : (showWholesale ? product.priceWholesale : product.priceRetail);
  const originalPrice = showWholesale ? product.priceWholesale : product.priceRetail;

  const isPaleta = product.category === 'paletas';

  return (
    <div className="container product-detail animate-fade-in">
      <div className="product-detail-grid">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="product-gallery-main">
            <img src={images[activeImage]} alt={product.name} />
          </div>
          {images.length > 1 && (
            <div className="product-gallery-thumbs scroll-row">
              {images.map((img, i) => (
                <div 
                  key={i} 
                  className={`product-gallery-thumb ${i === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img} alt={`Thumb ${i}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          <div>
            <div className="product-info-brand">{product.brand}</div>
            <h1 className="product-info-name">{product.name}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)' }}>
            <span className="price" style={{ fontSize: 'var(--font-4xl)' }}>
              {formatPrice(currentPrice)}
            </span>
            {product.isOffer && currentPrice !== originalPrice && (
              <span className="price-old" style={{ marginBottom: '8px' }}>
                {formatPrice(originalPrice)}
              </span>
            )}
            {showWholesale && (
              <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Precio Mayorista</span>
            )}
          </div>

          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            {product.description || 'Sin descripción disponible.'}
          </div>

          {/* Specs Table (If Paleta) */}
          {isPaleta && product.specs && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--space-md)', color: 'var(--accent-cyan)' }}>
                Especificaciones Técnicas
              </h3>
              <div className="product-specs">
                {Object.entries(product.specs).map(([key, val]) => {
                  if (key === 'peso_min' || key === 'peso_max') return null;
                  return (
                    <div key={key} className="product-spec">
                      <div className="product-spec-label">{key}</div>
                      <div className="product-spec-value">{val}</div>
                    </div>
                  );
                })}
                {(product.specs.peso_min || product.specs.peso_max) && (
                  <div className="product-spec">
                    <div className="product-spec-label">Peso</div>
                    <div className="product-spec-value">
                      {product.specs.peso_min || 'N/A'}g - {product.specs.peso_max || 'N/A'}g
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <hr style={{ borderColor: 'var(--border-dim)', margin: 'var(--space-lg) 0' }} />

          {/* Add to Cart Area */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="product-quantity">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Cantidad:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '5px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dim)' }}>
                  <button 
                    className="btn btn-ghost btn-icon" 
                    style={{ width: '30px', height: '30px' }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >-</button>
                  <span style={{ fontFamily: 'var(--font-mono)', minWidth: '30px', textAlign: 'center' }}>{quantity}</span>
                  <button 
                    className="btn btn-ghost btn-icon" 
                    style={{ width: '30px', height: '30px' }}
                    onClick={() => setQuantity(quantity + 1)}
                  >+</button>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ width: '100%', fontSize: 'var(--font-md)' }}>
                <ShoppingCart size={20} />
                Agregar al Carrito
              </button>
            </div>
          ) : (
            <div className="glass" style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ marginBottom: 'var(--space-sm)' }}>Iniciá sesión para poder comprar este producto y acceder a tu carrito.</p>
              <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
            </div>
          )}

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
              <Shield size={20} className="text-accent-cyan" style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: 'var(--font-sm)' }}>Garantía Oficial</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
              <Truck size={20} className="text-accent-magenta" style={{ color: 'var(--accent-magenta)' }} />
              <span style={{ fontSize: 'var(--font-sm)' }}>Envíos a todo el país</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
              <Check size={20} className="text-accent-green" style={{ color: 'var(--accent-green)' }} />
              <span style={{ fontSize: 'var(--font-sm)' }}>Stock verificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
