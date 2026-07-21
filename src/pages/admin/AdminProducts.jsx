import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Edit, Trash2, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import ProductForm from '../../components/admin/ProductForm';
import { CATEGORIES } from '../../utils/constants';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Estados de Filtros Admin
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [sortOption, setSortOption] = useState('alpha-asc'); // 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc'
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'instock' | 'outstock'

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

  const handleToggleStock = async (productItem) => {
    const newStockState = productItem.inStock === false ? true : false;
    try {
      await updateDoc(doc(db, 'products', productItem.id), {
        inStock: newStockState,
        updatedAt: new Date()
      });
      // Actualización local rápida en pantalla
      setProducts(prev => prev.map(p => p.id === productItem.id ? { ...p, inStock: newStockState } : p));
    } catch (err) {
      alert('Error al actualizar stock: ' + err.message);
    }
  };

  // Filtrado y Ordenamiento Dinámico
  const filteredProducts = products.filter(p => {
    // Filtro por término de búsqueda (Nombre, Marca, SKU)
    const matchesSearch = searchTerm === '' || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por categoría
    const matchesCategory = selectedCategory === 'todas' || p.category === selectedCategory;

    // Filtro por Stock
    const isAvailable = p.inStock !== false;
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'instock' && isAvailable) || 
      (stockFilter === 'outstock' && !isAvailable);

    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    if (sortOption === 'alpha-asc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortOption === 'alpha-desc') {
      return (b.name || '').localeCompare(a.name || '');
    } else if (sortOption === 'price-asc') {
      return (a.priceRetail || 0) - (b.priceRetail || 0);
    } else if (sortOption === 'price-desc') {
      return (b.priceRetail || 0) - (a.priceRetail || 0);
    }
    return 0;
  });

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
        <h2>Gestión de Catálogo ({filteredProducts.length} ítems)</h2>
        <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* BARRA DE FILTROS ADMIN */}
      <div className="glass p-md" style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', alignItems: 'center' }}>
        
        {/* Búsqueda por Texto */}
        <div style={{ position: 'relative' }}>
          <input 
            type="text"
            className="input" 
            placeholder="Buscar por nombre, marca o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: 'var(--font-xs)' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        {/* Filtro por Categoría */}
        <div>
          <select 
            className="input" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ fontSize: 'var(--font-xs)' }}
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Orden por Abecedario / Precio */}
        <div>
          <select 
            className="input" 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
            style={{ fontSize: 'var(--font-xs)' }}
          >
            <option value="alpha-asc">Abecedario (A - Z)</option>
            <option value="alpha-desc">Abecedario (Z - A)</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
          </select>
        </div>

        {/* Filtro por Estado de Stock */}
        <div>
          <select 
            className="input" 
            value={stockFilter} 
            onChange={(e) => setStockFilter(e.target.value)}
            style={{ fontSize: 'var(--font-xs)' }}
          >
            <option value="all">Stock: Todos</option>
            <option value="instock">Solo con Stock</option>
            <option value="outstock">Sin Stock</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state glass">
          <p>No se encontraron productos con los filtros seleccionados.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: 'var(--space-sm)' }}>Producto</th>
                <th style={{ padding: 'var(--space-sm)' }}>Categoría</th>
                <th style={{ padding: 'var(--space-sm)' }}>Precio Ret.</th>
                <th style={{ padding: 'var(--space-sm)' }}>Precio May.</th>
                <th style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const inStock = p.inStock !== false;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-dim)', transition: 'background 0.2s', opacity: inStock ? 1 : 0.6 }}>
                    <td style={{ padding: 'var(--space-sm)' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{p.brand} {p.sku ? `(${p.sku})` : ''}</div>
                    </td>
                    <td style={{ padding: 'var(--space-sm)', textTransform: 'capitalize' }}>{p.category}</td>
                    <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)' }}>${p.priceRetail}</td>
                    <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)' }}>${p.priceWholesale}</td>
                    
                    {/* Botón interactivo de Toggle Stock */}
                    <td style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => handleToggleStock(p)}
                        className={`btn ${inStock ? 'btn-ghost' : 'btn-ghost'}`}
                        style={{ 
                          padding: '0.2rem 0.6rem', 
                          fontSize: 'var(--font-xs)', 
                          color: inStock ? 'var(--accent-green)' : 'var(--accent-magenta)',
                          border: `1px solid ${inStock ? 'var(--accent-green)' : 'var(--accent-magenta)'}`
                        }}
                        title="Hacé clic para cambiar disponibilidad de stock"
                      >
                        {inStock ? (
                          <>
                            <CheckCircle size={14} /> Hay Stock
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Sin Stock
                          </>
                        )}
                      </button>
                    </td>

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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
