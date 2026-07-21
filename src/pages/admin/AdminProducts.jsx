import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Edit, Trash2, Plus } from 'lucide-react';
import ProductForm from '../../components/admin/ProductForm';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const data = snap.docs.map(document => ({ id: document.id, ...document.data() }));
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que querés eliminar este producto de forma permanente?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  if (isEditing) {
    return (
      <ProductForm 
        product={currentProduct} 
        onClose={() => {
          setIsEditing(false);
          setCurrentProduct(null);
          fetchProducts();
        }} 
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h2>Gestión de Catálogo</h2>
        <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : products.length === 0 ? (
        <div className="empty-state glass">
          <p>No hay productos en la base de datos.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: 'var(--space-sm)' }}>Producto</th>
                <th style={{ padding: 'var(--space-sm)' }}>Categoría</th>
                <th style={{ padding: 'var(--space-sm)' }}>Precio Min.</th>
                <th style={{ padding: 'var(--space-sm)' }}>Precio May.</th>
                <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-dim)', transition: 'background 0.2s' }}>
                  <td style={{ padding: 'var(--space-sm)' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{p.brand}</div>
                  </td>
                  <td style={{ padding: 'var(--space-sm)', textTransform: 'capitalize' }}>{p.category}</td>
                  <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)' }}>${p.priceRetail}</td>
                  <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)' }}>${p.priceWholesale}</td>
                  <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => { setCurrentProduct(p); setIsEditing(true); }} title="Editar">
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-magenta)' }} onClick={() => handleDelete(p.id)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
