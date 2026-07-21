import { useState } from 'react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CATEGORIES } from '../../utils/constants';
import { ArrowLeft, Upload, X, Save, Link } from 'lucide-react';

// Cloudinary config - subida directa sin backend (upload preset público)
const CLOUDINARY_CLOUD_NAME = 'dpadelventa';
const CLOUDINARY_UPLOAD_PRESET = 'padel_unsigned';

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Cloudinary upload failed: ' + res.status);
  const data = await res.json();
  return data.secure_url;
}

/**
 * Elimina el fondo blanco/claro de una imagen usando flood-fill desde los bordes.
 * Devuelve un data URL de PNG con fondo transparente.
 */
async function removeWhiteBackground(file, tolerance = 30) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      // Limitar a 400px para no exceder Firestore en caso de fallback Base64
      const MAX = 400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);

      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      // Determina si un pixel es "fondo blanco" dado su posición
      const isBackground = (i) => {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        return r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
      };

      const visited = new Uint8Array(w * h);
      const stack = [];

      // Sembrar desde los 4 bordes
      for (let x = 0; x < w; x++) {
        stack.push(x, 0);
        stack.push(x, h - 1);
      }
      for (let y = 1; y < h - 1; y++) {
        stack.push(0, y);
        stack.push(w - 1, y);
      }

      // BFS flood-fill
      while (stack.length) {
        const y = stack.pop();
        const x = stack.pop();
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const pidx = y * w + x;
        if (visited[pidx]) continue;
        visited[pidx] = 1;
        const i4 = pidx * 4;
        if (!isBackground(i4)) continue;
        d[i4 + 3] = 0; // transparente
        stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1);
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      // Si falla, usar base64 normal
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}

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
  const [uploadStatus, setUploadStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState('');

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
    const newUrls = [];

    for (const file of files) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" pesa más de 5MB. Por favor comprimila antes de subir.`);
        continue;
      }

      setUploadStatus(`Quitando fondo de ${file.name}...`);
      try {
        const pngBase64 = await removeWhiteBackground(file);
        
        setUploadStatus(`Subiendo ${file.name} a la nube...`);
        try {
          const cloudinaryUrl = await uploadToCloudinary(pngBase64);
          newUrls.push(cloudinaryUrl);
          setUploadStatus(`✓ ${file.name} subida (nube)`);
        } catch (cloudinaryErr) {
          console.warn("Fallo subida a Cloudinary, usando base64 optimizado:", cloudinaryErr);
          newUrls.push(pngBase64);
          setUploadStatus(`✓ ${file.name} optimizada (local)`);
        }
      } catch (err) {
        alert(`Error procesando ${file.name}: ${err.message}`);
      }
    }

    setImages(prev => [...prev, ...newUrls]);
    setUploading(false);
    setUploadStatus('');
    // Reset file input
    e.target.value = '';
  };

  const handleAddUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;

    setUploading(true);
    setUploadStatus('Verificando imagen...');

    try {
      // Intentar cargar la imagen para verificar que existe
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => reject(new Error('No se pudo cargar la imagen desde esa URL'));
        img.src = url;
        // Timeout de 5 segundos
        setTimeout(() => reject(new Error('Tiempo de espera agotado')), 5000);
      });

      setImages(prev => [...prev, url]);
      setUrlInput('');
      setUploadStatus('✓ Imagen agregada por URL');
    } catch (err) {
      alert(`La URL no es válida o no se pudo acceder a la imagen.\n\nTip: Probá con el botón "Subir archivo" desde tu computadora o celular.`);
    }

    setUploading(false);
    setUploadStatus('');
  };

  const handleRemoveImage = (idx) => {
    if (window.confirm('¿Eliminar esta imagen?')) {
      setImages(prev => prev.filter((_, i) => i !== idx));
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
      console.error('Error guardando producto:', err);
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
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label || c.name}</option>)}
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

          {/* ─── Imágenes ─── */}
          <section className="glass p-lg" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Imágenes</h3>

            {/* Thumbnails */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-dim)' }}>
                  <img src={img} alt={`Imagen ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(220,38,38,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Botón subir archivo */}
              <label style={{
                aspectRatio: '1', borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--accent-cyan)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: 'var(--bg-tertiary)', color: 'var(--accent-cyan)',
                transition: 'all 0.2s'
              }}>
                {uploading
                  ? <div className="spinner" style={{ width: '24px', height: '24px' }} />
                  : <>
                      <Upload size={22} style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: '1.2' }}>Subir<br/>archivo</span>
                    </>
                }
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Estado de la subida */}
            {uploadStatus && (
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-cyan)', marginBottom: 'var(--space-sm)' }}>
                {uploadStatus}
              </p>
            )}

            {/* Separador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 'var(--space-md) 0', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
              <hr style={{ flex: 1, borderColor: 'var(--border-dim)' }} />
              O PEGAR LINK DE WEB
              <hr style={{ flex: 1, borderColor: 'var(--border-dim)' }} />
            </div>

            {/* Input URL */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                className="input"
                placeholder="https://sitio.com/foto.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                disabled={uploading}
                style={{ fontSize: 'var(--font-xs)' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddUrl}
                disabled={uploading || !urlInput.trim()}
                style={{ whiteSpace: 'nowrap', fontSize: 'var(--font-xs)' }}
              >
                <Link size={14} /> Agregar
              </button>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Formatos: JPG, PNG, WEBP, GIF, AVIF • Máx. 5 MB por archivo.
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
