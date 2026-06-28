"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { clientCacheKey, readClientCache, removeClientCache, writeClientCache } from "@/lib/clientCache";

const AUTH_CACHE_KEY = clientCacheKey("portal", "profile");

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string;
  designation?: string;
  department?: string;
  /** Student: current academic year class */
  grade?: string;
  section?: string;
  className?: string;
  rollNumber?: string;
  academicYearName?: string;
}

type CachedAuth = {
  user: User;
  role: string | null;
  schoolId: string | null;
};

function readAuthCache(): CachedAuth | null {
  return readClientCache<CachedAuth>(AUTH_CACHE_KEY);
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  schoolId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (details: Partial<User>) => Promise<void>;
  devLogin?: (role: string, schoolId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  schoolId: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  devLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const cached = typeof window !== "undefined" ? readAuthCache() : null;
  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [role, setRole] = useState<string | null>(cached?.role ?? null);
  const [schoolId, setSchoolId] = useState<string | null>(cached?.schoolId ?? null);
  const [loading, setLoading] = useState(!cached);

  const applyProfile = (nextUser: User | null, nextRole: string | null, nextSchoolId: string | null) => {
    setUser(nextUser);
    setRole(nextRole);
    setSchoolId(nextSchoolId);
    if (nextUser) {
      writeClientCache(AUTH_CACHE_KEY, {
        user: nextUser,
        role: nextRole,
        schoolId: nextSchoolId,
      });
    } else {
      removeClientCache(AUTH_CACHE_KEY);
    }
  };

  useEffect(() => {
    const fetchProfile = async (accessToken: string) => {
      try {
        const res = await fetch("/api/portal/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          console.warn("Portal profile unavailable:", res.status);
          const { data: authData } = await supabase.auth.getUser(accessToken);
          const authUser = authData.user;
          if (authUser) {
            applyProfile(
              {
                uid: authUser.id,
                email: authUser.email ?? null,
                displayName:
                  (authUser.user_metadata?.full_name as string | undefined) ??
                  authUser.email?.split("@")[0] ??
                  null,
                photoURL: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
              },
              (authUser.user_metadata?.role as string | undefined) ?? "teacher",
              (authUser.user_metadata?.school_id as string | undefined) ?? null
            );
          }
          return;
        }

        const data = await res.json();
        applyProfile(data.user ?? null, data.role ?? null, data.schoolId ?? null);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        fetchProfile(session.access_token);
      } else {
        applyProfile(null, null, null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          fetchProfile(session.access_token);
        } else {
          applyProfile(null, null, null);
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
    applyProfile(null, null, null);
  };

  const devLogin = (roleMock: string, schoolIdMock: string) => {
    setUser({
      uid: "dev-mock-uid",
      email: `dev-${roleMock}@${schoolIdMock}.com`,
      displayName: `Dev ${roleMock}`,
      photoURL: null,
    });
    setRole(roleMock);
    setSchoolId(schoolIdMock);
    setLoading(false);
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
    <AuthContext.Provider value={{ user, role, schoolId, loading, login, logout, updateProfile, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
