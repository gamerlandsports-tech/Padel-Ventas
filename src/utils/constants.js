// ─── Categorías principales del menú ───
export const CATEGORIES = [
  { id: 'accesorios', name: 'Accesorios', icon: '🎯' },
  { id: 'paletas', name: 'Paletas', icon: '🏓' },
  { id: 'bolsos', name: 'Bolsos', icon: '👜' },
  { id: 'indumentaria', name: 'Indumentaria', icon: '👕' },
  { id: 'pelotas', name: 'Pelotas', icon: '🟡' },
  { id: 'zapatillas', name: 'Zapatillas', icon: '👟' },
];

// ─── Subcategorías de Accesorios ───
export const ACCESORIOS_SUBCATEGORIES = [
  { id: 'cubre-grips', name: 'Cubre Grips' },
  { id: 'protectores-con-aletas', name: 'Protectores Con Aletas' },
  { id: 'protectores-sin-aletas', name: 'Protectores Sin Aletas' },
  { id: 'munequeras', name: 'Muñequeras' },
  { id: 'plantillas', name: 'Plantillas' },
  { id: 'gorras', name: 'Gorras' },
  { id: 'vinchas', name: 'Vinchas' },
  { id: 'antivibradores', name: 'Antivibradores' },
  { id: 'gel-antideslizante', name: 'Gel Antideslizante' },
  { id: 'fundas', name: 'Fundas' },
  { id: 'conos-entrenamiento', name: 'Conos y Art. de Entrenamiento' },
  { id: 'carrito-pelotas', name: 'Carrito de Pelotas' },
  { id: 'medias', name: 'Medias' },
];

// ─── Filtros de Paletas ───
export const PALETA_FORMATOS = ['Redonda', 'Diamante', 'Lágrima', 'Híbrida'];

export const PALETA_PLACAS = ['3K', '8K', '12K', '16K', '18K', '24K'];

export const PALETA_NUCLEOS = ['Eva', 'Black Eva', 'Foam', 'Polietileno'];

export const PALETA_NIVELES = ['Iniciación', 'Intermedio', 'Avanzado', 'Pro'];

export const PALETA_TEXTURAS = ['Lisa', 'Rugosa', '3D'];

// ─── Marcas con alias internos para búsqueda ───
// Cada entrada: { label: 'Nombre visible', aliases: ['variante1', 'variante2', ...] }
export const BRANDS = [
  { label: 'Adidas',      aliases: ['Adidas'] },
  { label: 'Babolat',     aliases: ['Babolat'] },
  { label: 'Black Crown', aliases: ['Black Crown', 'Blackcrown'] },
  { label: 'Bullpadel',   aliases: ['Bullpadel'] },
  { label: 'Coast',       aliases: ['Coast'] },
  { label: 'Head',        aliases: ['Head'] },
  { label: 'Hirostar',    aliases: ['Hirostar'] },
  { label: 'Hyperlight',  aliases: ['Hyperlight'] },
  { label: "J'Hayber",   aliases: ["J'Hayber", 'JHayber', 'J Hayber'] },
  { label: 'Lasaig',      aliases: ['Lasaig'] },
  { label: 'Madma',       aliases: ['Madma'] },
  { label: 'Magnus',      aliases: ['Magnus'] },
  { label: 'Nox',         aliases: ['Nox'] },
  { label: 'Odea',        aliases: ['Odea', 'Odear'] },
  { label: 'OD PRO',      aliases: ['OD PRO'] },
  { label: 'Prokennex',  aliases: ['Prokennex'] },
  { label: 'Royal',       aliases: ['Royal'] },
  { label: 'Sane',        aliases: ['Sane'] },
  { label: 'Saro',        aliases: ['Saro'] },
  { label: 'Siux',        aliases: ['Siux'] },
  { label: 'Softee',      aliases: ['Softee'] },
  { label: 'StarVie',     aliases: ['StarVie', 'Star Vie'] },
  { label: 'Toalson',     aliases: ['Toalson'] },
  { label: 'Varlion',     aliases: ['Varlion'] },
  { label: 'Versus',      aliases: ['Versus'] },
  { label: 'Wilson',      aliases: ['Wilson'] },
  { label: 'Winar',       aliases: ['Winar', 'Wiinar'] },
  { label: 'Wingpadel',   aliases: ['Wingpadel'] },
];

// ─── Opciones de Transporte ───
export const SHIPPING_OPTIONS = [
  { id: 'correo-argentino', name: 'Correo Argentino' },
  { id: 'via-cargo', name: 'Vía Cargo' },
  { id: 'integral', name: 'Integral' },
  { id: 'buspack', name: 'BusPack' },
];

// ─── Estados de Pedido ───
export const ORDER_STATUSES = {
  draft: { label: 'Borrador', color: '#8888aa', icon: '📝' },
  pending: { label: 'Pendiente', color: '#ffaa00', icon: '⏳' },
  approved: { label: 'Aprobado', color: '#00f0ff', icon: '✅' },
  paid: { label: 'Pagado', color: '#39ff14', icon: '💳' },
  shipped: { label: 'Enviado', color: '#ff00e5', icon: '🚚' },
  delivered: { label: 'Entregado', color: '#00ff88', icon: '📦' },
  cancelled: { label: 'Cancelado', color: '#ff4444', icon: '❌' },
};

// ─── Roles de Usuario ───
export const USER_ROLES = {
  ANONYMOUS: 'anonymous',
  RETAIL: 'retail',
  WHOLESALE: 'wholesale',
  ADMIN: 'admin',
};

// ─── Accesorios destacados en home ───
export const FEATURED_ACCESSORY_TYPES = ['cubre-grips', 'protectores-con-aletas', 'protectores-sin-aletas'];
