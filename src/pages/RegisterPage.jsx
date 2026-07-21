import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Building, User } from 'lucide-react';
import { registerUser } from '../services/authService';

export default function RegisterPage() {
  const [role, setRole] = useState('retail'); // 'retail' | 'wholesale'
  
  // Estados comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [phone, setPhone] = useState('');

  // Estados Mayorista
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [dni, setDni] = useState('');
  const [clubName, setClubName] = useState('');
  const [clubAddress, setClubAddress] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [transportMethods, setTransportMethods] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Preparamos el objeto con la data del perfil
      const profileData = {
        role,
        name,
        lastName,
        city,
        province,
        phone,
      };

      if (role === 'wholesale') {
        profileData.address = address;
        profileData.zipCode = zipCode;
        profileData.dni = dni;
        profileData.clubName = clubName;
        profileData.clubAddress = clubAddress;
        profileData.storeAddress = storeAddress;
        profileData.websiteLink = websiteLink;
        profileData.transportMethods = transportMethods;
      }

      await registerUser(email, password, profileData);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('El correo electrónico ya está registrado.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Debés habilitar el método "Correo electrónico/Contraseña" en tu Consola de Firebase (Authentication -> Método de acceso).');
      } else {
        setError(`Error (${err.code || 'Auth Error'}): ${err.message || 'Ocurrió un problema al registrar la cuenta.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in" style={{ padding: 'var(--space-2xl) 0' }}>
      <div className="auth-card" style={{ maxWidth: '800px', width: '90%' }}>
        <h2>Crear Cuenta</h2>
        <p className="subtitle">Seleccioná tu tipo de cuenta para comenzar.</p>

        {/* Selector de Tipo de Usuario */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <button 
            type="button"
            className={`btn ${role === 'retail' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: 'var(--space-lg)', flexDirection: 'column', height: 'auto', gap: '8px' }}
            onClick={() => setRole('retail')}
          >
            <User size={32} />
            <span style={{ fontSize: 'var(--font-md)' }}>Consumidor Final</span>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'normal', opacity: 0.8 }}>Comprador particular</span>
          </button>
          
          <button 
            type="button"
            className={`btn ${role === 'wholesale' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: 'var(--space-lg)', flexDirection: 'column', height: 'auto', gap: '8px', background: role === 'wholesale' ? 'var(--accent-magenta)' : '', color: role === 'wholesale' ? 'white' : '' }}
            onClick={() => setRole('wholesale')}
          >
            <Building size={32} />
            <span style={{ fontSize: 'var(--font-md)' }}>Mayorista</span>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'normal', opacity: 0.8 }}>Clubes y comercios</span>
          </button>
        </div>

        {error && <div className="auth-error mb-lg">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {/* SECCIÓN 1: Datos Comunes (Para ambos) */}
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '8px' }}>Datos Personales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Nombre *</label>
              <input required className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Apellido *</label>
              <input required className="input" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Celular de contacto *</label>
              <input required className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Provincia *</label>
              <input required className="input" value={province} onChange={e => setProvince(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Localidad *</label>
              <input required className="input" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>

          {/* SECCIÓN 2: Datos Mayoristas */}
          {role === 'wholesale' && (
            <>
              <h3 style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '8px' }}>Datos Comerciales (Mayorista)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>DNI / CUIT *</label>
                  <input required className="input" value={dni} onChange={e => setDni(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Dirección Personal *</label>
                  <input required className="input" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Código Postal *</label>
                  <input required className="input" value={zipCode} onChange={e => setZipCode(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Nombre del Club / Comercio *</label>
                  <input required className="input" value={clubName} onChange={e => setClubName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Dirección del Club</label>
                  <input className="input" value={clubAddress} onChange={e => setClubAddress(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Dirección del Comercio</label>
                  <input className="input" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <div className="input-group">
                  <label>Medios de transporte que llegan a tu localidad *</label>
                  <input required className="input" placeholder="Ej: Vía Cargo, Correo Argentino, Andreani" value={transportMethods} onChange={e => setTransportMethods(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Link de página Web o Instagram</label>
                  <input className="input" type="url" placeholder="https://..." value={websiteLink} onChange={e => setWebsiteLink(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* SECCIÓN 3: Datos de Cuenta */}
          <h3 style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '8px' }}>Datos de Cuenta</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Correo Electrónico *</label>
              <input required type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label>Contraseña *</label>
                <input required type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Confirmar Contraseña *</label>
                <input required type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 'var(--space-xl)', width: '100%' }}>
            {loading ? 'Registrando...' : (
              <>
                <UserPlus size={20} />
                Completar Registro
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </div>
      </div>
    </div>
  );
}
