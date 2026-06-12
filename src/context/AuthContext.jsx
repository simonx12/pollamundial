import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { validateTokenClaims } from '../lib/jwt';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const lastFetchedUserId = useRef(null);
  const fetchingUserId = useRef(null);
  const lastProcessedUserId = useRef(null);

  const expirationTimer = useRef(null);

  useEffect(() => {
    let active = true;

    const setupExpirationTimer = (session) => {
      if (expirationTimer.current) clearTimeout(expirationTimer.current);
      if (!session?.access_token) return;

      // Usamos los claims decodificados en lugar del tiempo general
      const isTokenValid = validateTokenClaims(session.access_token);
      if (!isTokenValid) {
        supabase.auth.signOut();
        return;
      }

      const expiresInMs = (session.expires_at * 1000) - Date.now();
      
      if (expiresInMs > 0) {
        expirationTimer.current = setTimeout(async () => {
          console.warn('⏱️ Access Token expirado según el timer. Cerrando sesión.');
          await supabase.auth.signOut();
        }, expiresInMs);
      } else {
        supabase.auth.signOut();
      }
    };

    async function initializeAuth() {
      const timeoutId = setTimeout(() => {
        if (active) {
          console.warn('⚠️ initializeAuth timeout: Forzando fin de carga');
          setLoading(false);
        }
      }, 5000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        
        if (error || !session) {
           setUser(null);
           setProfile(null);
           setLoading(false);
           return;
        }

        // Validación estricta de claims
        if (!validateTokenClaims(session.access_token)) {
          console.warn('⚠️ Invalid token claims at initialization. Forcing logout.');
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        setupExpirationTimer(session);

        const currentUser = session.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error al inicializar sesión:', err);
        if (active) setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;
        
        // Si hay una sesión, validamos los claims antes de procesarla
        if (session && !validateTokenClaims(session.access_token)) {
          console.warn('⚠️ Invalid token claims on Auth change. Forcing logout.');
          await supabase.auth.signOut();
          return;
        }

        setupExpirationTimer(session);
        
        if (event === 'INITIAL_SESSION') return;

        const currentUser = session?.user ?? null;
        const isDifferentUser = currentUser?.id !== lastFetchedUserId.current;

        if (isDifferentUser || event === 'SIGNED_OUT') {
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id, currentUser.email);
          } else {
            lastFetchedUserId.current = null;
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    const heartbeatTimer = setInterval(async () => {
      if (!active) return;
      const { data: { session } } = await supabase.auth.getSession();
      
      const claimsAreValid = session ? validateTokenClaims(session.access_token) : false;

      if ((!session || !claimsAreValid) && lastFetchedUserId.current) {
        console.warn('⚠️ Sesión o claims no válidos en heartbeat. Forzando salida.');
        setUser(null);
        setProfile(null);
        lastFetchedUserId.current = null;
        supabase.auth.signOut();
      }
    }, 3000);

    return () => {
      active = false;
      subscription.unsubscribe();
      if (expirationTimer.current) clearTimeout(expirationTimer.current);
      clearInterval(heartbeatTimer);
    };
  }, []);


  // fetchProfile recibe userId Y email para no depender del estado async `user`
  async function fetchProfile(userId, userEmail, force = false) {
    // Si ya estamos buscando el perfil de este usuario o ya lo leímos, no hacer nada
    if (fetchingUserId.current === userId) return;
    if (!force && lastFetchedUserId.current === userId) {
      setLoading(false);
      return;
    }

    fetchingUserId.current = userId;
    // Guardar el id consultado inmediatamente para evitar re-intentos infinitos si falla la red o escritura
    lastFetchedUserId.current = userId;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Perfil no existe → crearlo
        console.log('📝 Creando perfil para:', userId);
        const fallbackUsername = userEmail
          ? userEmail.split('@')[0]
          : 'jugador';

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: fallbackUsername,
            bet_amount: 20000,
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creando perfil:', insertError);
        } else {
          setProfile(newProfile);
        }
      } else if (error) {
        console.error('❌ Error leyendo perfil:', error);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('❌ Error fetchProfile:', err);
    } finally {
      fetchingUserId.current = null;
      setLoading(false);
    }
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;

    // Crear perfil inmediatamente (el trigger de onAuthStateChange también lo intentará,
    // pero con upsert evitamos duplicados)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username || email.split('@')[0],
        bet_amount: 20000,
      }, { onConflict: 'id' });
    }
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    lastFetchedUserId.current = null;
    fetchingUserId.current = null;
    setUser(null);
    setProfile(null);
  }

  async function updateBetAmount(amount) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ bet_amount: amount })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateBetAmount,
        refreshProfile: () => user && fetchProfile(user.id, user.email, true),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
