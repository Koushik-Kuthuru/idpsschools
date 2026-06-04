"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
    // auth can be uninitialised during SSR — skip in that case
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const { role: userRole, schoolId: userSchoolId } = await fetchUserRole(firebaseUser.uid);
        
        // Fetch extended profile from Firestore
        let extendedProfile = {};
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            extendedProfile = userDoc.data();
          }
        } catch (e) {
          console.error("Failed to fetch extended profile:", e);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          ...extendedProfile,
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (details: Partial<User>) => {
    if (!auth.currentUser) throw new Error("No authenticated user found");
    
    // 1. Update Firebase Auth Profile
    await firebaseUpdateProfile(auth.currentUser, {
      displayName: details.displayName !== undefined ? details.displayName : auth.currentUser.displayName,
      photoURL: details.photoURL !== undefined ? details.photoURL : auth.currentUser.photoURL,
    });

    // 2. Persist profile details to Firestore
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const existingDoc = await getDoc(userDocRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};

    const updatedData = {
      ...existingData,
      displayName: details.displayName !== undefined ? details.displayName : (existingData.displayName || auth.currentUser.displayName || ""),
      photoURL: details.photoURL !== undefined ? details.photoURL : (existingData.photoURL || auth.currentUser.photoURL || ""),
      phone: details.phone !== undefined ? details.phone : (existingData.phone || ""),
      designation: details.designation !== undefined ? details.designation : (existingData.designation || ""),
      department: details.department !== undefined ? details.department : (existingData.department || ""),
      email: auth.currentUser.email,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, updatedData, { merge: true });

    // 3. Update state
    setUser(prev => prev ? {
      ...prev,
      ...updatedData,
    } : null);
  };

  return (
    <AuthContext.Provider value={{ user, role, schoolId, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
