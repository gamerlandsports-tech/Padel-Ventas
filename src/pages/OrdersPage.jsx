import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getUserOrders, getUserDrafts } from '../services/orderService';
import { ORDER_STATUSES } from '../utils/constants';
import { formatPrice, formatDateShort } from '../utils/formatters';

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const { loadFromDraft, openCart } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'drafts'
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const [ordersData, draftsData] = await Promise.all([
          getUserOrders(user.uid),
          getUserDrafts(user.uid)
        ]);
        setOrders(ordersData);
        setDrafts(draftsData);
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, isAuthenticated, navigate]);

  const handleResumeDraft = (draft) => {
    loadFromDraft(draft.items);
    openCart();
  };

  if (loading) {
    return (
      <div className="container loading-page">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: 'var(--space-2xl) var(--space-lg)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title" style={{ marginBottom: 'var(--space-xl)' }}>Mis Pedidos</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button 
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={16} /> Pedidos Realizados ({orders.length})
        </button>
        <button 
          className={`btn ${activeTab === 'drafts' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('drafts')}
        >
          <Clock size={16} /> Borradores Guardados ({drafts.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        orders.length === 0 ? (
          <div className="empty-state glass">
            <Package size={48} className="empty-state-icon" />
            <h3>No tenés pedidos</h3>
            <p>Aún no realizaste ninguna compra.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )
      ) : (
        drafts.length === 0 ? (
          <div className="empty-state glass">
            <Clock size={48} className="empty-state-icon" />
            <h3>No hay borradores</h3>
            <p>Tus pedidos guardados aparecerán aquí para que puedas retomarlos luego.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {drafts.map(draft => (
              <div key={draft.id} className="card p-lg" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Borrador del {formatDateShort(draft.createdAt)}</h4>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{draft.items.length} items</span>
                  </div>
                  <span className="price" style={{ fontSize: 'var(--font-xl)' }}>{formatPrice(draft.subtotal)}</span>
                </div>
                <div className="scroll-row" style={{ marginBottom: 'var(--space-lg)' }}>
                  {draft.items.map((item, i) => (
                    <div key={i} style={{ width: '60px', height: '60px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-dim)' }}>
                      {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>🏓</div>}
                    </div>
                  ))}
                </div>
                <button className="btn btn-secondary" onClick={() => handleResumeDraft(draft)}>
                  <ShoppingCart size={16} /> Retomar pedido
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function OrderCard({ order }) {
  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
  
  return (
    <div className="card" style={{ padding: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Pedido #{order.id.slice(-6).toUpperCase()}</span>
          <h3 style={{ marginTop: '4px' }}>Realizado el {formatDateShort(order.createdAt)}</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="price" style={{ fontSize: 'var(--font-2xl)', marginBottom: '4px' }}>{formatPrice(order.subtotal)}</div>
          <span className="badge" style={{ backgroundColor: `${statusInfo.color}22`, color: statusInfo.color, border: `1px solid ${statusInfo.color}55` }}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border-dim)', marginBottom: 'var(--space-lg)' }} />

      {/* Visual Timeline */}
      <div className="order-timeline">
        {['pending', 'approved', 'paid', 'shipped'].map((step, index) => {
          const stepInfo = ORDER_STATUSES[step];
          const isActive = order.status === step;
          // Simplified logic for completed steps: if status is shipped, previous are completed. 
          const statusesOrdered = ['pending', 'approved', 'paid', 'shipped', 'delivered'];
          const currentIndex = statusesOrdered.indexOf(order.status);
          const stepIndex = statusesOrdered.indexOf(step);
          const isCompleted = stepIndex < currentIndex || order.status === 'delivered';
          
          return (
            <div key={step} className={`order-timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="order-timeline-dot">
                {stepInfo.icon}
              </div>
              <span className="order-timeline-label">{stepInfo.label}</span>
            </div>
          );
        })}
      </div>

      <hr style={{ borderColor: 'var(--border-dim)', margin: 'var(--space-lg) 0' }} />

      <div>
        <h4 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>Resumen ({order.items.length} items)</h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span>{item.quantity}x {item.name}</span>
            </div>
          ))}
        </div>
        
        {order.shipping && (
          <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Envío por:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={16} className="text-accent-cyan" /> <strong>{order.shipping.method}</strong> a {order.shipping.city}, {order.shipping.province}</div>
          </div>
        )}
      </div>
    </div>
  );
}
