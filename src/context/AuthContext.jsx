import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Evitar doble llamada a fetchProfile en la inicialización
  const initialized = useRef(false);

  useEffect(() => {
    console.log('🔄 Inicializando AuthContext...');

    // Solo usar onAuthStateChange como fuente única de verdad.
    // El evento INITIAL_SESSION se dispara inmediatamente con la sesión actual,
    // por lo que no necesitamos llamar getSession() por separado.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event, session ? 'con sesión' : 'sin sesión');

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // fetchProfile recibe userId Y email para no depender del estado async `user`
  async function fetchProfile(userId, userEmail) {
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
