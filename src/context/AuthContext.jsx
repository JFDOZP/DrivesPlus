import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../Firebase/firebaseConfig';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { rol, nombre, email }
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Carga el perfil del usuario desde Firestore (incluye rol)
  const cargarPerfil = async (user) => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    try {
      const ref  = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUserProfile(snap.data());
      } else {
        // Primera vez — crea el perfil con rol 'usuario' por defecto
        const perfil = {
          uid:       user.uid,
          email:     user.email,
          nombre:    user.displayName || user.email.split('@')[0],
          rol:       'usuario',          // 'usuario' | 'admin'
          creadoEn:  serverTimestamp(),
        };
        await setDoc(ref, perfil);
        setUserProfile(perfil);
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await cargarPerfil(user);
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const isAdmin = userProfile?.rol === 'admin';

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loadingAuth,
      isAdmin,
      login,
      logout,
    }}>
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
