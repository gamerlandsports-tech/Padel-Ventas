import { useState } from 'react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { uploadImage, deleteImageByUrl } from '../../services/storageService';
import { CATEGORIES } from '../../utils/constants';
import { ArrowLeft, Upload, X, Save } from 'lucide-react';

export default function ProductForm({ product, onClose }) {
  const isEditing = !!product;
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    category: product?.category || 'paletas',
    subcategory: product?.subcategory || '',
    description: product?.description || '',
    priceRetail: product?.priceRetail || '',
    priceWholesale: product?.priceWholesale || '',
    isOffer: product?.isOffer || false,
    offerPriceRetail: product?.offerPriceRetail || '',
    offerPriceWholesale: product?.offerPriceWholesale || '',
    active: product?.active ?? true,
    inStock: product?.inStock ?? true,
    featured: product?.featured || false,
  });

  const [specs, setSpecs] = useState(product?.specs || {
    formato: '', peso_min: '', peso_max: '', marco: '', placa: '', nucleo: '', nivel: '', textura: ''
  });

  const [images, setImages] = useState(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setSpecs(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newImageUrls = [];
      for (const file of files) {
        // Intentar subir a Firebase Storage si está activo
        try {
          const url = await uploadImage(file);
          if (url) {
            newImageUrls.push(url);
            continue;
          }
        } catch (storageErr) {
          console.warn('Firebase Storage no activo, convirtiendo imagen localmente:', storageErr);
        }

        // Fallback automático a Base64 Data URL (¡Funciona 100% sin importar Firebase Storage!)
        const base64Url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
        newImageUrls.push(base64Url);
      }
      setImages(prev => [...prev, ...newImageUrls]);
    } catch (err) {
      alert('Error procesando imágenes: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (url) => {
    if (window.confirm('¿Eliminar esta imagen?')) {
      try {
        await deleteImageByUrl(url);
        setImages(prev => prev.filter(img => img !== url));
      } catch (err) {
        alert('Error al borrar la imagen de la nube.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      priceRetail: Number(formData.priceRetail),
      priceWholesale: Number(formData.priceWholesale),
      offerPriceRetail: formData.offerPriceRetail ? Number(formData.offerPriceRetail) : null,
      offerPriceWholesale: formData.offerPriceWholesale ? Number(formData.offerPriceWholesale) : null,
      images,
      specs: formData.category === 'paletas' ? specs : {},
      updatedAt: new Date()
    };

    try {
      if (isEditing) {
        await setDoc(doc(db, 'products', product.id), payload, { merge: true });
      } else {
        payload.createdAt = new Date();
        await addDoc(collection(db, 'products'), payload);
      }
      onClose();
    } catch (err) {
      alert('Error guardando el producto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <button className="btn btn-ghost" onClick={onClose} style={{ marginBottom: 'var(--space-md)' }}>
        <ArrowLeft size={16} /> Volver
      </button>

      <form onSubmit={handleSubmit} className="checkout-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Info Básica */}
          <section className="glass p-lg" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Información Básica</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label>Nombre del Producto *</label>
                <input required className="input" name="name" value={formData.name} onChange={handleChange} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>Marca *</label>
                  <input required className="input" name="brand" value={formData.brand} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Categoría *</label>
                  <select required className="input" name="category" value={formData.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Descripción</label>
                <textarea className="input" name="description" value={formData.description} onChange={handleChange} rows="4" />
              </div>
            </div>
          </section>

          {/* Precios */}
          <section className="glass p-lg" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Precios</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label>Precio Retail (Normal) *</label>
                <input required type="number" className="input" name="priceRetail" value={formData.priceRetail} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Precio Mayorista *</label>
                <input required type="number" className="input" name="priceWholesale" value={formData.priceWholesale} onChange={handleChange} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)', cursor: 'pointer' }}>
              <input type="checkbox" name="isOffer" checked={formData.isOffer} onChange={handleChange} />
              El producto está en oferta
            </label>

            {formData.isOffer && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label style={{ color: 'var(--accent-magenta)' }}>Precio Oferta (Retail)</label>
                  <input type="number" className="input" name="offerPriceRetail" value={formData.offerPriceRetail} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label style={{ color: 'var(--accent-cyan)' }}>Precio Oferta (Mayorista)</label>
                  <input type="number" className="input" name="offerPriceWholesale" value={formData.offerPriceWholesale} onChange={handleChange} />
                </div>
              </div>
            )}
          </section>

          {/* Especificaciones (Solo para paletas) */}
          {formData.category === 'paletas' && (
            <section className="glass p-lg" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--accent-cyan)' }}>Especificaciones Técnicas (Paletas)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>Formato</label>
                  <input className="input" name="formato" placeholder="Ej: Lágrima, Diamante" value={specs.formato} onChange={handleSpecChange} />
                </div>
                <div className="input-group">
                  <label>Nivel</label>
                  <input className="input" name="nivel" placeholder="Ej: Pro, Avanzado" value={specs.nivel} onChange={handleSpecChange} />
                </div>
                <div className="input-group">
                  <label>Peso Mínimo (g)</label>
                  <input type="number" className="input" name="peso_min" value={specs.peso_min} onChange={handleSpecChange} />
                </div>
                <div className="input-group">
                  <label>Peso Máximo (g)</label>
                  <input type="number" className="input" name="peso_max" value={specs.peso_max} onChange={handleSpecChange} />
                </div>
                <div className="input-group">
                  <label>Marco</label>
                  <input className="input" name="marco" value={specs.marco} onChange={handleSpecChange} />
                </div>
                <div className="input-group">
                  <label>Placa / Caras</label>
                  <input className="input" name="placa" placeholder="Ej: Carbono 12K" value={specs.placa} onChange={handleSpecChange} />
                </div>
                <div className="input-group">
                  <label>Núcleo</label>
                  <input className="input" name="nucleo" placeholder="Ej: Black EVA" value={specs.nucleo} onChange={handleSpecChange} />
                </div>
                <div className="input-group">
                  <label>Textura</label>
                  <input className="input" name="textura" placeholder="Ej: Rugosa 3D" value={specs.textura} onChange={handleSpecChange} />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Columna Derecha: Imágenes y Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <section className="glass p-lg" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Estado</h3>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)', cursor: 'pointer' }}>
              <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
              Producto Activo (Visible en catálogo)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)', cursor: 'pointer' }}>
              <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} />
              Hay Stock disponible
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
              Destacado (Aparece en inicio)
            </label>
          </section>

          <section className="glass p-lg" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Imágenes</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-dim)' }}>
                  <img src={img} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImage(img)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <label style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                {uploading ? <div className="spinner"></div> : (
                  <>
                    <Upload size={24} style={{ marginBottom: '8px' }} />
                    <span style={{ fontSize: 'var(--font-xs)' }}>Subir archivo</span>
                  </>
                )}
                <input type="file" multiple accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/avif" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            
            {/* Input para agregar por URL directa */}
            <div className="input-group" style={{ marginTop: 'var(--space-md)' }}>
              <label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>O pegar URL de imagen directa:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="url" 
                  className="input" 
                  placeholder="https://ejemplo.com/imagen.jpg" 
                  id="directImageUrlInput"
                  style={{ fontSize: 'var(--font-xs)' }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const input = document.getElementById('directImageUrlInput');
                    if (input && input.value.trim()) {
                      setImages(prev => [...prev, input.value.trim()]);
                      input.value = '';
                    }
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>

            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Formatos soportados: <strong>JPG, JPEG, PNG, WEBP, GIF, SVG, AVIF</strong>.
            </p>
          </section>

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ width: '100%', marginTop: 'auto' }}>
            {saving ? 'Guardando...' : (
              <>
                <Save size={20} />
                {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
