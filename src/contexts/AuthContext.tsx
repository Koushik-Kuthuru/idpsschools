"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  schoolId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  schoolId: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function fetchUserRole(uid: string): Promise<{ role: string | null; schoolId: string | null }> {
  try {
    // 1. Check super_admin_users collection first
    const superAdminDoc = await getDoc(doc(db, "super_admin_users", uid));
    if (superAdminDoc.exists()) {
      return { role: "super_admin", schoolId: "all" };
    }

    // 2. Fall back to user_roles collection
    const roleDoc = await getDoc(doc(db, "user_roles", uid));
    if (roleDoc.exists()) {
      const data = roleDoc.data();
      return {
        role: data.role ?? null,
        schoolId: data.schoolId ?? null,
      };
    }

    return { role: null, schoolId: null };
  } catch (err) {
    console.error("Failed to fetch user role:", err);
    return { role: null, schoolId: null };
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const { role: userRole, schoolId: userSchoolId } = await fetchUserRole(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setRole(userRole);
        setSchoolId(userSchoolId);
      } else {
        setUser(null);
        setRole(null);
        setSchoolId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // signInWithEmailAndPassword triggers onAuthStateChanged above,
    // which will set user/role/schoolId automatically.
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will clear state automatically
  };

  return (
    <AuthContext.Provider value={{ user, role, schoolId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
