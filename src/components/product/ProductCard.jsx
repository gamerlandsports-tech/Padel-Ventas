import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatters';

export default function ProductCard({ product, index = 0 }) {
  const { isAuthenticated, isWholesale } = useAuth();
  const { addItem, openCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    openCart();
  };

  // Determine which price to show
  const showWholesale = isWholesale;
  const currentPrice = product.isOffer
    ? (showWholesale ? product.offerPriceWholesale : product.offerPriceRetail) || (showWholesale ? product.priceWholesale : product.priceRetail)
    : (showWholesale ? product.priceWholesale : product.priceRetail);
  const originalPrice = showWholesale ? product.priceWholesale : product.priceRetail;

  // Placeholder image if no images
  const imageUrl = product.images?.[0] || `https://placehold.co/400x600/12121a/00f0ff?text=${encodeURIComponent(product.name || 'Producto')}`;

  return (
    <Link
      to={`/producto/${product.id}`}
      className="product-card"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* 📸 Imagen limpia arriba (100% visible sin texto encima) */}
      <div className="product-card-image-box">
        {/* Badges de estado sobre la imagen */}
        {product.isOffer && (
          <div className="product-card-badge" style={{ top: '8px', left: '8px' }}>
            <span className="badge badge-magenta">🔥 Oferta</span>
          </div>
        )}

        {showWholesale && (
          <div className="product-card-badge" style={{ top: product.isOffer ? '38px' : '8px', left: '8px' }}>
            <span className="badge badge-cyan">Mayorista</span>
          </div>
        )}

        {product.inStock === false && (
          <div className="product-card-badge" style={{ top: '8px', right: '8px' }}>
            <span className="badge" style={{ background: 'var(--accent-magenta)', color: 'white' }}>❌ Sin Stock</span>
          </div>
        )}

        <img
          className="product-card-image"
          src={imageUrl}
          alt={product.name}
          loading="lazy"
        />
      </div>

      {/* 📝 Información descriptiva y precio abajo */}
      <div className="product-card-body">
        <div>
          <span className="product-card-brand">{product.brand}</span>
          <h3 className="product-card-name" title={product.name}>{product.name}</h3>
        </div>

        <div>
          <div className="product-card-price-row">
            <span className="price">{formatPrice(currentPrice)}</span>
            {product.isOffer && currentPrice !== originalPrice && (
              <span className="price-old">{formatPrice(originalPrice)}</span>
            )}
          </div>

          {isAuthenticated ? (
            <button 
              className="product-card-btn" 
              onClick={handleAddToCart}
              disabled={product.inStock === false}
              style={{ opacity: product.inStock === false ? 0.5 : 1, cursor: product.inStock === false ? 'not-allowed' : 'pointer' }}
            >
              <ShoppingCart size={14} />
              {product.inStock === false ? 'Sin Stock' : 'Agregar'}
            </button>
          ) : (
            <div className="product-card-btn" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
              <Eye size={14} />
              Ver detalle
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
