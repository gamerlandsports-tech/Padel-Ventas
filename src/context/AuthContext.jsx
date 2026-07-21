import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserProfile, logoutUser } from '../services/authService';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } catch (err) {
          console.error('Error loading profile:', err);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = profile?.role === USER_ROLES.ADMIN;
  const isWholesale = profile?.role === USER_ROLES.WHOLESALE;
  const isRetail = profile?.role === USER_ROLES.RETAIL;
  const userRole = profile?.role || USER_ROLES.ANONYMOUS;

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    isWholesale,
    isRetail,
    userRole,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
