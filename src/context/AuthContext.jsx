import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Evitar doble llamada a fetchProfile en la inicialización
  const initialized = useRef(false);
  const lastFetchedUserId = useRef(null);
  const fetchingUserId = useRef(null);
  const lastProcessedUserId = useRef(null);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        // Obtener la sesión persistida en caché de Supabase al iniciar la app
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        const currentUser = session?.user ?? null;
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
      }
    }

    initializeAuth();

    // Escuchar eventos futuros de inicio/cierre de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;

        const currentUser = session?.user ?? null;
        const isDifferentUser = currentUser?.id !== lastFetchedUserId.current;

        // Solo reaccionamos si de verdad cambió de usuario (login, logout, cambio de cuenta)
        // o si se disparó explícitamente un cierre de sesión.
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

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);


  // fetchProfile recibe userId Y email para no depender del estado async `user`
  async function fetchProfile(userId, userEmail) {
    // Si ya estamos buscando el perfil de este usuario o ya lo leímos, no hacer nada
    if (fetchingUserId.current === userId) return;
    if (lastFetchedUserId.current === userId && profile) {
      setLoading(false);
      return;
    }

    fetchingUserId.current = userId;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Guardar el id consultado inmediatamente para evitar re-intentos infinitos si falla la escritura
      lastFetchedUserId.current = userId;

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
            bet_amount: 0,
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
        bet_amount: 0,
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
        refreshProfile: () => user && fetchProfile(user.id, user.email),
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
