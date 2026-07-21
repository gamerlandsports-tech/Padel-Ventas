import { ShoppingCart, X, Minus, Plus, Trash2, Save, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatters';
import { saveDraftOrder } from '../../services/orderService';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    subtotal,
    subtotalWholesale,
    discountPercentage,
    setDiscountPercentage,
    discountAmount,
    discountAmountWholesale,
    total,
    totalWholesale,
    itemCount,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();

  const { isAuthenticated, isWholesale, user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const displaySubtotal = isWholesale ? subtotalWholesale : subtotal;
  const displayDiscount = isWholesale ? discountAmountWholesale : discountAmount;
  const displayTotal = isWholesale ? totalWholesale : total;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    try {
      await saveDraftOrder(user.uid, user.email, items, displaySubtotal);
      alert('Pedido guardado como borrador. Podés retomarlo desde "Mis Pedidos".');
      clearCart();
      closeCart();
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Error al guardar el borrador.');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={closeCart} />

      {/* Drawer */}
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-drawer-header">
          <h3>
            <ShoppingCart size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Carrito ({itemCount})
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={closeCart}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="cart-drawer-items">
          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-2xl) 0' }}>
              <div className="empty-state-icon">🛒</div>
              <h3>Tu carrito está vacío</h3>
              <p>Explorá nuestro catálogo y agregá productos.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="cart-item">
                {item.image ? (
                  <img className="cart-item-image" src={item.image} alt={item.name} />
                ) : (
                  <div className="cart-item-image" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    background: 'var(--bg-tertiary)',
                  }}>
                    🏓
                  </div>
                )}
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {item.brand}
                  </span>
                  <span className="price" style={{ fontSize: 'var(--font-md)' }}>
                    {formatPrice(isWholesale ? (item.priceWholesale || item.price) : item.price)}
                  </span>
                  <div className="cart-item-controls">
                    <button
                      className="cart-item-qty-btn"
                      onClick={() => decrementItem(item.productId)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="cart-item-qty">{item.quantity}</span>
                    <button
                      className="cart-item-qty-btn"
                      onClick={() => incrementItem(item.productId)}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeItem(item.productId)}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-total" style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="cart-total-label" style={{ fontSize: 'var(--font-sm)' }}>Subtotal</span>
              <span className="cart-total-value" style={{ fontSize: 'var(--font-lg)' }}>{formatPrice(displaySubtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span className="cart-total-label" style={{ fontSize: 'var(--font-sm)' }}>Descuento</span>
              <select 
                className="input" 
                style={{ width: '80px', padding: '0.2rem 0.5rem', fontSize: 'var(--font-sm)' }}
                value={discountPercentage} 
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
              >
                <option value={0}>0%</option>
                <option value={2}>2%</option>
                <option value={3}>3%</option>
                <option value={5}>5%</option>
                <option value={10}>10%</option>
              </select>
            </div>

            {discountPercentage > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', color: 'var(--accent-green)' }}>
                <span className="cart-total-label" style={{ fontSize: 'var(--font-sm)', color: 'inherit' }}>Ahorro</span>
                <span className="cart-total-value" style={{ fontSize: 'var(--font-md)' }}>- {formatPrice(displayDiscount)}</span>
              </div>
            )}

            <hr style={{ borderColor: 'var(--border-dim)', marginBottom: 'var(--space-md)' }} />

            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">{formatPrice(displayTotal)}</span>
            </div>

            {isWholesale && (
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-magenta)', textAlign: 'right', marginBottom: 'var(--space-md)' }}>
                Precio mayorista aplicado
              </div>
            )}
            <div className="cart-actions">
              <button className="btn btn-primary btn-lg" onClick={handleCheckout}>
                <CreditCard size={18} />
                Finalizar Compra
              </button>
              <button className="btn btn-secondary" onClick={handleSaveDraft}>
                <Save size={16} />
                Guardar Pedido
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={clearCart}
                style={{ alignSelf: 'center', marginTop: 'var(--space-xs)' }}
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
