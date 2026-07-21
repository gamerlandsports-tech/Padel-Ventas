/**
 * Agrupa productos de zapatillas e indumentaria por modelo.
 * Extrae el talle/número del final del nombre y agrupa los que comparten
 * brand + baseName en un único "grupo" con array de variantes.
 */

const SHOE_SIZE_RE = /^(.+?)\s+(\d{2})(?:\s*\(.*?\))?$/;
const CLOTHING_SIZE_RE = /^(.+?)\s+(XXL|XL|XS|2XL|3XL|[SML])$/i;

export function extractVariant(name, category) {
  if (category === 'zapatillas') {
    const m = name.match(SHOE_SIZE_RE);
    if (m) return { baseName: m[1].trim(), size: m[2] };
  }
  if (category === 'indumentaria') {
    const m = name.match(CLOTHING_SIZE_RE);
    if (m) return { baseName: m[1].trim(), size: m[2].toUpperCase() };
  }
  return { baseName: name, size: null };
}

/**
 * @param {Array} products  - lista plana de productos
 * @param {string} category - 'zapatillas' | 'indumentaria' | otro
 * @returns {Array} - si la categoría es agrupable, devuelve array de grupos;
 *                    si no, devuelve el mismo array de productos (sin cambios)
 *
 * Cada grupo tiene la forma:
 * {
 *   id: string,           // id del primer producto del grupo (para React key)
 *   brand: string,
 *   baseName: string,
 *   category: string,
 *   images: string[],
 *   priceRetail: number,
 *   priceWholesale: number,
 *   isOffer: bool,
 *   offerPriceRetail: number|null,
 *   offerPriceWholesale: number|null,
 *   variants: [{ size, productId, inStock, priceRetail, priceWholesale }]
 *   isGroup: true
 * }
 */
export function groupProducts(products, category) {
  if (category !== 'zapatillas' && category !== 'indumentaria') {
    return products.map(p => ({ ...p, isGroup: false }));
  }

  const map = new Map();

  for (const p of products) {
    const { baseName, size } = extractVariant(p.name, category);
    const key = `${(p.brand || '').toLowerCase()}::${baseName.toLowerCase()}`;

    if (!map.has(key)) {
      map.set(key, {
        id: p.id,
        brand: p.brand,
        baseName,
        category: p.category,
        images: p.images || [],
        priceRetail: p.priceRetail,
        priceWholesale: p.priceWholesale,
        isOffer: p.isOffer,
        offerPriceRetail: p.offerPriceRetail,
        offerPriceWholesale: p.offerPriceWholesale,
        featured: p.featured,
        variants: [],
        isGroup: true,
      });
    }

    const group = map.get(key);

    // Si este producto tiene imágenes y el grupo aún no tiene, usar las suyas
    if ((!group.images || group.images.length === 0) && p.images?.length) {
      group.images = p.images;
    }

    // Agregar como variante (talle)
    if (size) {
      group.variants.push({
        size,
        productId: p.id,
        inStock: p.inStock !== false,
        priceRetail: p.priceRetail,
        priceWholesale: p.priceWholesale,
        offerPriceRetail: p.offerPriceRetail,
        offerPriceWholesale: p.offerPriceWholesale,
        isOffer: p.isOffer,
        name: p.name,
      });
    } else {
      // Sin talle detectado → se trata como producto individual dentro del "grupo"
      group.variants.push({
        size: '—',
        productId: p.id,
        inStock: p.inStock !== false,
        priceRetail: p.priceRetail,
        priceWholesale: p.priceWholesale,
        offerPriceRetail: p.offerPriceRetail,
        offerPriceWholesale: p.offerPriceWholesale,
        isOffer: p.isOffer,
        name: p.name,
      });
    }
  }

  // Ordenar talles numéricamente o alfabéticamente
  for (const group of map.values()) {
    group.variants.sort((a, b) => {
      const na = parseFloat(a.size);
      const nb = parseFloat(b.size);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.size.localeCompare(b.size);
    });
  }

  return Array.from(map.values());
}
