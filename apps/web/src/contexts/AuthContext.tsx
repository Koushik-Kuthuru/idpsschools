"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string;
  designation?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  schoolId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (details: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  schoolId: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (authId: string, email: string | undefined) => {
      try {
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user profile:", error);
        }

        setUser({
          uid: authId,
          email: email || profile?.email || null,
          displayName: profile?.full_name || null,
          photoURL: profile?.avatar_url || null,
          phone: profile?.phone || undefined,
        });
        setRole(profile?.role || null);
        setSchoolId(profile?.school_id || null);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setRole(null);
        setSchoolId(null);
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoading(true);
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setRole(null);
          setSchoolId(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    let identifier = email.trim().toLowerCase();
    
    // Automatically append the dummy domain if they just typed their User ID
    if (!identifier.includes("@")) {
      identifier = `${identifier}@idps.local`;
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setSchoolId(null);
  };

  const updateProfile = async (details: Partial<User>) => {
    if (!user?.uid) throw new Error("No authenticated user found");

    const updates = {
      full_name: details.displayName !== undefined ? details.displayName : user.displayName,
      avatar_url: details.photoURL !== undefined ? details.photoURL : user.photoURL,
      phone: details.phone !== undefined ? details.phone : user.phone,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.uid);

    if (error) {
      throw error;
    }

    setUser(prev => prev ? {
      ...prev,
      displayName: updates.full_name,
      photoURL: updates.avatar_url,
      phone: updates.phone,
    } : null);
  };

  return (
    <AuthContext.Provider value={{ user, role, schoolId, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
