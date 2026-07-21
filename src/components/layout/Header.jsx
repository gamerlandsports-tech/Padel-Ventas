import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { CATEGORIES } from '../../utils/constants';

export default function Header() {
  const { isAuthenticated, isAdmin, profile, logout } = useAuth();
  const { itemCount, toggleCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
  };

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <Link to="/" className="header-logo" onClick={() => setMobileOpen(false)}>
          PADEL PRO
        </Link>

        {/* Navigation */}
        <nav className={`header-nav ${mobileOpen ? 'mobile-open' : ''}`}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalogo/${cat.id}`}
              className={`header-nav-link ${location.pathname.includes(cat.id) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{cat.icon}</span> {cat.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {/* Cart */}
          {isAuthenticated && (
            <button className="btn btn-ghost btn-icon cart-badge" onClick={toggleCart} aria-label="Carrito">
              <ShoppingCart size={20} />
              {itemCount > 0 && <span className="count">{itemCount}</span>}
            </button>
          )}

          {/* User actions */}
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="btn btn-ghost btn-icon" title="Panel Admin">
                  <Shield size={20} />
                </Link>
              )}
              <Link
                to="/pedidos"
                className="btn btn-ghost btn-sm"
                style={{ gap: '4px' }}
              >
                <User size={16} />
                <span className="hide-mobile">{profile?.displayName?.split(' ')[0] || 'Cuenta'}</span>
              </Link>
              <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Ingresar
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            className="menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
