import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, MapPin, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { submitOrder, createOrder } from '../services/orderService';
import { SHIPPING_OPTIONS } from '../utils/constants';
import { formatPrice } from '../utils/formatters';

export default function CheckoutPage() {
  const { 
    items, 
    subtotal, 
    subtotalWholesale, 
    discountPercentage, 
    setDiscountPercentage, 
    discountAmount, 
    discountAmountWholesale, 
    total, 
    totalWholesale, 
    clearCart 
  } = useCart();
  const { user, isWholesale, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [shippingMethod, setShippingMethod] = useState('');
  const [address, setAddress] = useState(profile?.address || '');
  const [city, setCity] = useState(profile?.city || '');
  const [province, setProvince] = useState(profile?.province || '');
  const [zipCode, setZipCode] = useState('');
  
  // If cart is empty and not in success state, redirect to catalog
  useEffect(() => {
    if (items.length === 0 && !success) {
      navigate('/catalogo');
    }
  }, [items, success, navigate]);

  const displaySubtotal = isWholesale ? subtotalWholesale : subtotal;
  const displayDiscount = isWholesale ? discountAmountWholesale : discountAmount;
  const displayTotal = isWholesale ? totalWholesale : total;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Debes iniciar sesión para finalizar la compra.");
      return;
    }
    
    setLoading(true);

    try {
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items,
        subtotal: displaySubtotal,
        discountPercentage,
        discountAmount: displayDiscount,
        total: displayTotal,
        shipping: {
          method: shippingMethod,
          address,
          city,
          province,
          zipCode
        },
        status: 'pending',
        paymentStatus: 'unpaid',
        shippingStatus: 'not_shipped',
        isDraft: false
      };

      await createOrder(orderData);
      
      clearCart();
      setSuccess(true);
    } catch (err) {
      console.error('Error during checkout:', err);
      alert('Hubo un error al procesar tu pedido. Por favor, intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ padding: 'var(--space-3xl) 0', textAlign: 'center' }}>
        <div className="glass-strong" style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-3xl)', borderRadius: 'var(--radius-xl)' }}>
          <CheckCircle size={64} style={{ color: 'var(--accent-green)', margin: '0 auto var(--space-lg)' }} />
          <h1 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>¡Pedido Confirmado!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', fontSize: 'var(--font-lg)' }}>
            Hemos recibido tu pedido correctamente. Lo estamos procesando y nos pondremos en contacto pronto para coordinar el pago y envío.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <Link to="/pedidos" className="btn btn-primary">Ver mis pedidos</Link>
            <Link to="/" className="btn btn-ghost">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title" style={{ marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-xl)' }}>Finalizar Compra</h1>
      
      <form onSubmit={handleSubmit} className="checkout-layout">
        <div>
          {/* Shipping Form */}
          <section className="checkout-section glass-strong">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} /> Datos de Envío</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label>Dirección</label>
                <input required className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle y número" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>Ciudad</label>
                  <input required className="input" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Código Postal</label>
                  <input required className="input" value={zipCode} onChange={e => setZipCode(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Provincia</label>
                <input required className="input" value={province} onChange={e => setProvince(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Shipping Method */}
          <section className="checkout-section glass-strong">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={20} /> Método de Envío</h3>
            <div className="input-group">
              <label>Seleccioná el transporte</label>
              <select required className="input" value={shippingMethod} onChange={e => setShippingMethod(e.target.value)}>
                <option value="" disabled>Elegir opción...</option>
                {SHIPPING_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>
            <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              El costo de envío se abona en destino al recibir/retirar el pedido.
            </p>
          </section>
        </div>

        {/* Order Summary */}
        <div>
          <section className="checkout-section glass-strong" style={{ position: 'sticky', top: 'calc(var(--header-height) + var(--space-xl))' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={20} /> Resumen de Pedido</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              {items.map(item => (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice((isWholesale ? item.priceWholesale || item.price : item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <hr style={{ borderColor: 'var(--border-dim)', margin: 'var(--space-md) 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontSize: 'var(--font-lg)', fontFamily: 'var(--font-mono)' }}>{formatPrice(displaySubtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Descuento</span>
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
                <span style={{ fontSize: 'var(--font-sm)', color: 'inherit' }}>Ahorro</span>
                <span style={{ fontSize: 'var(--font-md)', fontFamily: 'var(--font-mono)' }}>- {formatPrice(displayDiscount)}</span>
              </div>
            )}

            <hr style={{ borderColor: 'var(--border-dim)', margin: 'var(--space-md) 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: '600' }}>Total a Pagar</span>
              <span className="price" style={{ fontSize: 'var(--font-2xl)' }}>{formatPrice(displayTotal)}</span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
