import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Users, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import AdminProducts from './AdminProducts';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: 'var(--space-3xl) 0', textAlign: 'center' }}>
        <h2>Acceso Denegado</h2>
        <p>No tenés permisos para ver esta página.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', display: 'grid', gridTemplateColumns: '250px 1fr', gap: 'var(--space-xl)' }}>
      {/* Sidebar Admin */}
      <aside className="glass" style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
        <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--accent-cyan)' }}>Panel Admin</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <Link to="/admin" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Package size={18} /> Resumen</Link>
          <Link to="/admin/productos" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><ShoppingBag size={18} /> Productos</Link>
          <Link to="/admin/pedidos" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><ShoppingBag size={18} /> Pedidos</Link>
          <Link to="/admin/usuarios" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Users size={18} /> Usuarios</Link>
          <hr style={{ borderColor: 'var(--border-dim)', margin: 'var(--space-sm) 0' }} />
          <Link to="/admin/seed" className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--accent-magenta)' }}><Database size={18} /> Cargar Datos</Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="glass" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/productos" element={<AdminProducts />} />
          <Route path="/pedidos" element={<div>Gestión de Pedidos (En desarrollo)</div>} />
          <Route path="/usuarios" element={<div>Gestión de Usuarios (En desarrollo)</div>} />
          <Route path="/seed" element={<AdminSeed />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminHome() {
  return (
    <div>
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>Resumen del Sistema</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
        <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-cyan)', fontSize: 'var(--font-2xl)' }}>--</h3>
          <p>Ventas Hoy</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-magenta)', fontSize: 'var(--font-2xl)' }}>--</h3>
          <p>Pedidos Pendientes</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-green)', fontSize: 'var(--font-2xl)' }}>--</h3>
          <p>Usuarios Registrados</p>
        </div>
      </div>
    </div>
  );
}

function AdminSeed() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');

  const appendLog = (msg) => setLog(prev => prev + msg + '\n');

  const seedProducts = async () => {
    setLoading(true);
    setLog('');
    appendLog('Iniciando carga de datos de prueba...');

    const sampleProducts = [
      {
        name: 'Paleta Bullpadel Vertex 03 2024',
        category: 'paletas',
        brand: 'Bullpadel',
        description: 'La pala Vertex 03 es una pala con forma de diamante, de máxima potencia, con alto rendimiento sin pérdidas de control.',
        priceRetail: 350000,
        priceWholesale: 280000,
        isOffer: true,
        offerPriceRetail: 310000,
        offerPriceWholesale: 250000,
        active: true,
        featured: true,
        specs: {
          formato: 'Diamante',
          peso_min: 365,
          peso_max: 375,
          marco: 'Carbono 100%',
          placa: '12K',
          nucleo: 'Black Eva',
          nivel: 'Pro',
          textura: 'Rugosa'
        }
      },
      {
        name: 'Paleta Nox AT10 Genius',
        category: 'paletas',
        brand: 'Nox',
        description: 'La pala de Agustín Tapia. Forma de lágrima, excelente balance y control.',
        priceRetail: 320000,
        priceWholesale: 260000,
        isOffer: false,
        active: true,
        featured: true,
        specs: {
          formato: 'Lágrima',
          peso_min: 360,
          peso_max: 375,
          marco: 'Carbono 100%',
          placa: '18K',
          nucleo: 'Eva',
          nivel: 'Avanzado',
          textura: '3D'
        }
      },
      {
        name: 'Paleta Head Speed Pro X',
        category: 'paletas',
        brand: 'Head',
        description: 'Pala versátil para jugadores avanzados. Combinación perfecta de potencia y control.',
        priceRetail: 340000,
        priceWholesale: 275000,
        isOffer: false,
        active: true,
        featured: false,
        specs: {
          formato: 'Híbrida',
          peso_min: 370,
          peso_max: 375,
          marco: 'Graphene',
          placa: '12K',
          nucleo: 'Foam',
          nivel: 'Avanzado',
          textura: 'Lisa'
        }
      },
      {
        name: 'Cubre Grip Tourna Tac x3',
        category: 'accesorios',
        subcategory: 'cubre-grips',
        brand: 'Tourna',
        description: 'Pack de 3 unidades. Excelente agarre y absorción de sudor.',
        priceRetail: 12000,
        priceWholesale: 8500,
        isOffer: false,
        active: true,
        featured: false,
        specs: {}
      },
      {
        name: 'Protector Transparente Rugoso',
        category: 'accesorios',
        subcategory: 'protectores-sin-aletas',
        brand: 'Nox',
        description: 'Protector transparente para no alterar la estética de tu pala.',
        priceRetail: 8000,
        priceWholesale: 5500,
        isOffer: true,
        offerPriceRetail: 7000,
        offerPriceWholesale: 5000,
        active: true,
        featured: false,
        specs: {}
      },
      {
        name: 'Tubo de Pelotas Head Pro S',
        category: 'pelotas',
        brand: 'Head',
        description: 'Tubo de 3 pelotas de alta presión. Ideales para juego rápido.',
        priceRetail: 15000,
        priceWholesale: 11000,
        isOffer: false,
        active: true,
        featured: true,
        specs: {}
      }
    ];

    try {
      for (const p of sampleProducts) {
        // add timestamp locally before inserting
        p.createdAt = new Date();
        p.updatedAt = new Date();
        const docRef = await addDoc(collection(db, 'products'), p);
        appendLog(`✓ Producto creado: ${p.name} (${docRef.id})`);
      }
      appendLog('¡Carga completada con éxito!');
    } catch (err) {
      console.error(err);
      appendLog('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--space-md)' }}>Carga de Datos Iniciales</h2>
      <p style={{ marginBottom: 'var(--space-lg)' }}>Esta herramienta carga algunos productos de prueba en la base de datos para que puedas probar la aplicación.</p>
      
      <button className="btn btn-magenta" onClick={seedProducts} disabled={loading}>
        {loading ? 'Cargando...' : 'Ejecutar Seed (Productos)'}
      </button>

      {log && (
        <pre className="input" style={{ marginTop: 'var(--space-lg)', minHeight: '200px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)', color: 'var(--accent-green)' }}>
          {log}
        </pre>
      )}
    </div>
  );
}
