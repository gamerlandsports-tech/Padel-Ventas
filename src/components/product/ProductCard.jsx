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
      {/* Offer Badge */}
      {product.isOffer && (
        <div className="product-card-badge">
          <span className="badge badge-magenta">🔥 Oferta</span>
        </div>
      )}

      {/* Wholesale badge */}
      {showWholesale && (
        <div className="product-card-badge" style={{ top: product.isOffer ? '48px' : '12px' }}>
          <span className="badge badge-cyan">Mayorista</span>
        </div>
      )}

      {/* Image */}
      <img
        className="product-card-image"
        src={imageUrl}
        alt={product.name}
        loading="lazy"
      />

      {/* Overlay */}
      <div className="product-card-overlay">
        <span className="product-card-brand">{product.brand}</span>
        <h3 className="product-card-name">{product.name}</h3>

        <div className="product-card-price-row">
          <span className="price">{formatPrice(currentPrice)}</span>
          {product.isOffer && currentPrice !== originalPrice && (
            <span className="price-old">{formatPrice(originalPrice)}</span>
          )}
        </div>

        {isAuthenticated ? (
          <button className="product-card-btn" onClick={handleAddToCart}>
            <ShoppingCart size={14} />
            Agregar
          </button>
        ) : (
          <div className="product-card-btn" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
            <Eye size={14} />
            Ver detalle
          </div>
        )}
      </div>
    </Link>
  );
}
