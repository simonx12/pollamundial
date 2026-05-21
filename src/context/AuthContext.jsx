import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Inicializando AuthContext...');
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📦 Sesión obtenida:', session ? 'Usuario logueado' : 'No hay sesión');
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('❌ Error obteniendo sesión:', err);
      setLoading(false);
    });

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔔 Cambio en Auth detectado:', _event);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Perfil no existe, crear uno
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: user?.email?.split('@')[0] || 'jugador',
            bet_amount: 0,
          })
          .select()
          .single();
        setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
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

    // Crear perfil
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username || email.split('@')[0],
        bet_amount: 0,
      });
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
        refreshProfile: () => user && fetchProfile(user.id),
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
