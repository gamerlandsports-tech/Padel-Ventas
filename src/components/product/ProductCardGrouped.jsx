import { useState } from 'react';
import { ShoppingCart, Eye, X, Plus, Minus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatters';

/**
 * Tarjeta de producto agrupado por modelo (zapatillas / indumentaria).
 * Muestra la imagen limpia arriba y la información con selector de talles por debajo.
 */
export default function ProductCardGrouped({ group, index = 0 }) {
  const { isAuthenticated, isWholesale } = useAuth();
  const { addItem, openCart } = useCart();

  const [selectedSize, setSelectedSize] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSize, setModalSize]   = useState(null);
  const [qty, setQty]               = useState(1);

  const showWholesale = isWholesale;
  const imageUrl = group.images?.[0]
    || `https://placehold.co/400x600/12121a/00f0ff?text=${encodeURIComponent(group.baseName)}`;

  // Precio base del grupo
  const getPrice = (v) => {
    if (!v) return null;
    return v.isOffer
      ? (showWholesale ? v.offerPriceWholesale : v.offerPriceRetail) || (showWholesale ? v.priceWholesale : v.priceRetail)
      : (showWholesale ? v.priceWholesale : v.priceRetail);
  };

  const baseVariant = group.variants[0];
  const displayPrice = getPrice(baseVariant);

  const openModal = (e, preselectedSize = null) => {
    e.preventDefault();
    e.stopPropagation();
    setModalSize(preselectedSize || selectedSize || group.variants.find(v => v.inStock)?.size || null);
    setQty(1);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const confirmAdd = () => {
    const variant = group.variants.find(v => v.size === modalSize);
    if (!variant) return;
    addItem({
      id: variant.productId,
      name: variant.name || `${group.brand} ${group.baseName} T.${variant.size}`,
      brand: group.brand,
      images: group.images,
      priceRetail: variant.priceRetail,
      priceWholesale: variant.priceWholesale,
      offerPriceRetail: variant.offerPriceRetail,
      offerPriceWholesale: variant.offerPriceWholesale,
      isOffer: variant.isOffer,
    }, qty);
    openCart();
    setModalOpen(false);
  };

  const inStockCount = group.variants.filter(v => v.inStock).length;

  return (
    <>
      {/* ─── CARD ─── */}
      <div
        className="product-card"
        style={{ animationDelay: `${index * 0.05}s`, cursor: 'default' }}
      >
        {/* 📸 Imagen limpia arriba (100% visible) */}
        <div
          className="product-card-image-box"
          onClick={isAuthenticated ? openModal : undefined}
          style={{ cursor: isAuthenticated ? 'pointer' : 'default' }}
        >
          {group.isOffer && (
            <div className="product-card-badge" style={{ top: '8px', left: '8px' }}>
              <span className="badge badge-magenta">🔥 Oferta</span>
            </div>
          )}
          {showWholesale && (
            <div className="product-card-badge" style={{ top: group.isOffer ? '38px' : '8px', left: '8px' }}>
              <span className="badge badge-cyan">Mayorista</span>
            </div>
          )}

          <img
            className="product-card-image"
            src={imageUrl}
            alt={group.baseName}
            loading="lazy"
          />
        </div>

        {/* 📝 Información y selector de talles por debajo */}
        <div className="product-card-body">
          <div>
            <span className="product-card-brand">{group.brand}</span>
            <h3 className="product-card-name" title={group.baseName}>
              {group.baseName}
            </h3>

            {/* Precio */}
            <div className="product-card-price-row">
              <span className="price">{formatPrice(displayPrice)}</span>
            </div>

            {/* Selector de talles inline */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '8px 0' }}>
              {group.variants.map(v => (
                <button
                  key={v.size}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(v.size);
                  }}
                  disabled={!v.inStock}
                  style={{
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: `1.5px solid ${selectedSize === v.size ? 'var(--accent-cyan)' : 'var(--border-dim)'}`,
                    background: selectedSize === v.size ? 'var(--accent-cyan)' : 'transparent',
                    color: selectedSize === v.size ? '#000' : v.inStock ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: v.inStock ? 'pointer' : 'not-allowed',
                    opacity: v.inStock ? 1 : 0.4,
                    textDecoration: !v.inStock ? 'line-through' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Botón agregar / ver */}
          {isAuthenticated ? (
            <button
              className="product-card-btn"
              onClick={(e) => openModal(e, selectedSize)}
              disabled={inStockCount === 0}
              style={{ opacity: inStockCount === 0 ? 0.5 : 1, cursor: inStockCount === 0 ? 'not-allowed' : 'pointer' }}
            >
              <ShoppingCart size={14} />
              {inStockCount === 0 ? 'Sin Stock' : selectedSize ? `Agregar T.${selectedSize}` : 'Elegir talle'}
            </button>
          ) : (
            <div className="product-card-btn" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
              <Eye size={14} />
              Ver detalle
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL ─── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-lg)',
          }}
          onClick={closeModal}
        >
          <div
            className="glass"
            style={{
              maxWidth: '420px', width: '100%',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-xl)',
              border: '1px solid var(--border-glow-cyan)',
              boxShadow: 'var(--shadow-glow-cyan)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
              <div>
                <p style={{ color: 'var(--accent-cyan)', fontSize: 'var(--font-xs)', fontWeight: '700', letterSpacing: '2px', marginBottom: '4px' }}>
                  {group.brand}
                </p>
                <h3 style={{ fontSize: 'var(--font-lg)', lineHeight: '1.2' }}>{group.baseName}</h3>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Imagen */}
            <div style={{ width: '100%', aspectRatio: '1', marginBottom: 'var(--space-lg)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
              <img src={imageUrl} alt={group.baseName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
            </div>

            {/* Talles */}
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>TALLE / NÚMERO</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-lg)' }}>
              {group.variants.map(v => (
                <button
                  key={v.size}
                  disabled={!v.inStock}
                  onClick={() => setModalSize(v.size)}
                  style={{
                    padding: '8px 14px',
                    fontWeight: '700',
                    fontSize: 'var(--font-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${modalSize === v.size ? 'var(--accent-cyan)' : 'var(--border-dim)'}`,
                    background: modalSize === v.size ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                    color: modalSize === v.size ? '#000' : v.inStock ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: v.inStock ? 'pointer' : 'not-allowed',
                    opacity: v.inStock ? 1 : 0.35,
                    textDecoration: !v.inStock ? 'line-through' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {v.size}
                  {!v.inStock && <span style={{ display: 'block', fontSize: '9px', fontWeight: '400' }}>sin stock</span>}
                </button>
              ))}
            </div>

            {/* Precio del talle seleccionado */}
            {modalSize && (() => {
              const v = group.variants.find(x => x.size === modalSize);
              const price = getPrice(v);
              return (
                <p style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: 'var(--font-xl)', marginBottom: 'var(--space-lg)' }}>
                  {formatPrice(price)}
                </p>
              );
            })()}

            {/* Cantidad */}
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>CANTIDAD</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-xl)' }}>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)', background: 'var(--bg-tertiary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Minus size={16} />
              </button>
              <span style={{ fontSize: 'var(--font-xl)', fontWeight: '700', minWidth: '32px', textAlign: 'center' }}>{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-cyan)', background: 'rgba(0,240,255,0.1)', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Botón confirmar */}
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!modalSize}
              onClick={confirmAdd}
            >
              <ShoppingCart size={18} />
              {modalSize ? `Agregar ${qty} × T.${modalSize} al carrito` : 'Seleccioná un talle'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
