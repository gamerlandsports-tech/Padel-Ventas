import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-col">
          <h4>Padel Pro</h4>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            Tu tienda de pádel con los mejores productos y precios del mercado argentino.
          </p>
        </div>

        {/* Categories */}
        <div className="footer-col">
          <h4>Categorías</h4>
          <ul>
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <Link to={`/catalogo/${cat.id}`}>
                  {cat.icon} {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div className="footer-col">
          <h4>Mi Cuenta</h4>
          <ul>
            <li><Link to="/login">Iniciar Sesión</Link></li>
            <li><Link to="/register">Registrarse</Link></li>
            <li><Link to="/pedidos">Mis Pedidos</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li><a href="mailto:info@padelpro.com.ar">info@padelpro.com.ar</a></li>
            <li><a href="https://wa.me/5491100000000" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Padel Pro — Todos los derechos reservados
      </div>
    </footer>
  );
}
