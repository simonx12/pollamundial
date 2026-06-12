import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserId = useRef(null);
  const fetchingUserId = useRef(null);

  useEffect(() => {
    let active = true;

    const safetyTimeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;

        const currentUser = session?.user ?? null;

        if (event === 'SIGNED_OUT') {
          lastFetchedUserId.current = null;
          fetchingUserId.current = null;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser.id, currentUser.email);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      fetchingUserId.current = null;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId, userEmail, force = false) {
    if (fetchingUserId.current === userId) return;
    if (!force && lastFetchedUserId.current === userId) {
      setLoading(false);
      return;
    }

    fetchingUserId.current = userId;
    lastFetchedUserId.current = userId;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const fallbackUsername = userEmail ? userEmail.split('@')[0] : 'jugador';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, username: fallbackUsername, bet_amount: 20000 })
          .select()
          .single();
        if (!insertError) setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } catch {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
